CREATE TABLE person (
    id        BIGSERIAL PRIMARY KEY,
    name      TEXT NOT NULL,
    email     TEXT UNIQUE,
    phone     TEXT UNIQUE,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

CREATE TABLE admin (
    id        BIGSERIAL PRIMARY KEY,
    person_id BIGINT NOT NULL REFERENCES person(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE car (
    id     BIGSERIAL PRIMARY KEY,
    firm   TEXT,
    number TEXT UNIQUE,
    color  TEXT
);

CREATE TABLE location (
    id      BIGSERIAL PRIMARY KEY,
    x       DOUBLE PRECISION NOT NULL,
    y       DOUBLE PRECISION NOT NULL,
    address TEXT
);

CREATE TABLE driver (
    id          BIGSERIAL PRIMARY KEY,
    person_id   BIGINT NOT NULL UNIQUE REFERENCES person(id) ON DELETE CASCADE,
    car_id      BIGINT REFERENCES car(id) ON DELETE SET NULL,
    experience  INTEGER DEFAULT 0
);

CREATE TABLE passenger (
    id        BIGSERIAL PRIMARY KEY,
    person_id BIGINT NOT NULL UNIQUE REFERENCES person(id) ON DELETE CASCADE
);

CREATE TABLE trip (
    id          BIGSERIAL PRIMARY KEY,
    driver_id   BIGINT REFERENCES driver(id) ON DELETE SET NULL,
    start_id    BIGINT REFERENCES location(id) ON DELETE SET NULL,
    finish_id   BIGINT REFERENCES location(id) ON DELETE SET NULL,
    started_at  TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    CONSTRAINT chk_trip_times CHECK (
        (started_at IS NULL AND finished_at IS NULL) OR
        (started_at IS NOT NULL AND finished_at IS NULL) OR
        (started_at IS NOT NULL AND finished_at IS NOT NULL AND started_at <= finished_at)
    )
);

CREATE TABLE "offer" (
    id                  BIGSERIAL PRIMARY KEY,
    trip_id             BIGINT NOT NULL REFERENCES trip(id) ON DELETE CASCADE,
    max_count_passenger INTEGER NOT NULL DEFAULT 1 CHECK (max_count_passenger >= 1),
    total_cost          INTEGER DEFAULT 0,
    is_final            BOOLEAN DEFAULT FALSE NOT NULL,
    created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_one_final_offer_per_trip 
ON "offer"(trip_id) WHERE is_final = TRUE;

CREATE TABLE offer_passengers (
    offer_id     BIGINT NOT NULL REFERENCES "offer"(id) ON DELETE CASCADE,
    passenger_id BIGINT NOT NULL REFERENCES passenger(id) ON DELETE CASCADE,
    added_at     TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (offer_id, passenger_id)
);

CREATE TABLE itmo_buildings (
    id          BIGSERIAL PRIMARY KEY,
    location_id BIGINT REFERENCES location(id) ON DELETE SET NULL,
    name        TEXT
);

CREATE TABLE reviews (
    id            BIGSERIAL PRIMARY KEY,
    originator_id BIGINT REFERENCES person(id) ON DELETE SET NULL,
    receiver_id   BIGINT REFERENCES person(id) ON DELETE SET NULL,
    trip_id       BIGINT REFERENCES trip(id) ON DELETE SET NULL,
    text          TEXT,
    rating        INTEGER CHECK (rating BETWEEN 1 AND 5),
    created_at    TIMESTAMPTZ DEFAULT now()
);

-- ИНДЕКСЫ

CREATE INDEX idx_trip_driver_id ON trip(driver_id);
CREATE INDEX idx_offer_trip_id ON "offer"(trip_id);
CREATE INDEX idx_offer_is_final ON "offer"(is_final) WHERE is_final = TRUE;
CREATE INDEX idx_offer_passengers_passenger_id ON offer_passengers(passenger_id);
CREATE INDEX idx_reviews_receiver_id ON reviews(receiver_id);
CREATE INDEX idx_reviews_originator_id ON reviews(originator_id);
CREATE INDEX idx_location_xy ON location(x, y);

CREATE VIEW trip_with_final_offer AS
SELECT 
    t.*,
    o.id AS final_offer_id
FROM trip t
LEFT JOIN "offer" o ON o.trip_id = t.id AND o.is_final = TRUE;

-- ТРИГГЕРЫ

-- Проверка вместимости оффера
CREATE OR REPLACE FUNCTION fn_check_offer_capacity()
RETURNS trigger LANGUAGE plpgsql AS
$$
DECLARE
    maxc INTEGER;
    cnt  INTEGER;
BEGIN
    SELECT max_count_passenger INTO maxc FROM "offer" WHERE id = NEW.offer_id FOR UPDATE;
    IF maxc IS NULL THEN
        RAISE EXCEPTION 'Offer % does not exist', NEW.offer_id;
    END IF;

    SELECT COUNT(*) INTO cnt FROM offer_passengers WHERE offer_id = NEW.offer_id;

    IF TG_OP = 'INSERT' THEN
        cnt := cnt + 1;
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.offer_id <> OLD.offer_id THEN
            cnt := cnt + 1;
        END IF;
    END IF;

    IF cnt > maxc THEN
        RAISE EXCEPTION 'Offer % capacity exceeded: % / %', NEW.offer_id, cnt, maxc;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_offer_capacity
BEFORE INSERT OR UPDATE ON offer_passengers
FOR EACH ROW EXECUTE FUNCTION fn_check_offer_capacity();

-- ФУНКЦИИ

-- Создать оффер
CREATE OR REPLACE FUNCTION create_offer(
    p_trip_id BIGINT, 
    p_max_count INTEGER, 
    p_total_cost INTEGER,
    p_is_final BOOLEAN DEFAULT FALSE
)
RETURNS BIGINT LANGUAGE plpgsql AS
$$
DECLARE
    new_id BIGINT;
BEGIN
    INSERT INTO "offer"(trip_id, max_count_passenger, total_cost, is_final)
    VALUES (p_trip_id, p_max_count, p_total_cost, p_is_final)
    RETURNING id INTO new_id;
    RETURN new_id;
END;
$$;

-- Установить оффер как финальный для поездки
CREATE OR REPLACE FUNCTION set_final_offer(p_offer_id BIGINT)
RETURNS void LANGUAGE plpgsql AS
$$
DECLARE
    v_trip_id BIGINT;
    existing_final_offer_id BIGINT;
BEGIN
    SELECT trip_id INTO v_trip_id FROM "offer" WHERE id = p_offer_id;
    IF v_trip_id IS NULL THEN
        RAISE EXCEPTION 'Offer % does not exist', p_offer_id;
    END IF;

    -- Проверяем, есть ли уже финальный оффер для этой поездки
    SELECT id INTO existing_final_offer_id 
    FROM "offer" 
    WHERE trip_id = v_trip_id AND is_final = TRUE;
    
    IF existing_final_offer_id IS NOT NULL THEN
        RAISE EXCEPTION 'Trip % already has final offer %', v_trip_id, existing_final_offer_id;
    END IF;

    -- Устанавливаем текущий как финальный
    UPDATE "offer" SET is_final = TRUE WHERE id = p_offer_id;
END;
$$;


-- Получить финальный оффер для поездки
CREATE OR REPLACE FUNCTION get_final_offer(p_trip_id BIGINT)
RETURNS BIGINT LANGUAGE sql AS
$$
    SELECT id FROM "offer" WHERE trip_id = p_trip_id AND is_final = TRUE LIMIT 1;
$$;

-- Добавить пассажира в оффер (создает новый оффер)
CREATE OR REPLACE FUNCTION add_passenger_to_offer(p_offer_id BIGINT, p_passenger_id BIGINT)
RETURNS BIGINT LANGUAGE plpgsql AS
$$
DECLARE
    v_trip_id BIGINT;
    v_max_count INTEGER;
    v_total_cost INTEGER;
    new_offer_id BIGINT;
BEGIN
    -- Получаем данные исходного оффера
    SELECT trip_id, max_count_passenger, total_cost 
    INTO v_trip_id, v_max_count, v_total_cost
    FROM "offer" 
    WHERE id = p_offer_id;
    
    IF v_trip_id IS NULL THEN
        RAISE EXCEPTION 'Offer % does not exist', p_offer_id;
    END IF;
    
    -- Создаем новый оффер с теми же параметрами
    INSERT INTO "offer"(trip_id, max_count_passenger, total_cost, is_final)
    VALUES (v_trip_id, v_max_count, v_total_cost, FALSE)
    RETURNING id INTO new_offer_id;
    
    -- Копируем всех пассажиров из старого оффера
    INSERT INTO offer_passengers(offer_id, passenger_id)
    SELECT new_offer_id, passenger_id
    FROM offer_passengers
    WHERE offer_id = p_offer_id;
    
    -- Добавляем нового пассажира
    INSERT INTO offer_passengers(offer_id, passenger_id) 
    VALUES (new_offer_id, p_passenger_id);
    
    RETURN new_offer_id;
END;
$$;

-- Удалить пассажира из оффера (создает новый оффер)
CREATE OR REPLACE FUNCTION remove_passenger_from_offer(p_offer_id BIGINT, p_passenger_id BIGINT)
RETURNS BIGINT LANGUAGE plpgsql AS
$$
DECLARE
    v_trip_id BIGINT;
    v_max_count INTEGER;
    v_total_cost INTEGER;
    new_offer_id BIGINT;
BEGIN
    -- Получаем данные исходного оффера
    SELECT trip_id, max_count_passenger, total_cost 
    INTO v_trip_id, v_max_count, v_total_cost
    FROM "offer" 
    WHERE id = p_offer_id;
    
    IF v_trip_id IS NULL THEN
        RAISE EXCEPTION 'Offer % does not exist', p_offer_id;
    END IF;
    
    -- Проверяем, что пассажир действительно в этом оффере
    IF NOT EXISTS (SELECT 1 FROM offer_passengers WHERE offer_id = p_offer_id AND passenger_id = p_passenger_id) THEN
        RAISE EXCEPTION 'Passenger % is not in offer %', p_passenger_id, p_offer_id;
    END IF;
    
    -- Создаем новый оффер с теми же параметрами
    INSERT INTO "offer"(trip_id, max_count_passenger, total_cost, is_final)
    VALUES (v_trip_id, v_max_count, v_total_cost, FALSE)
    RETURNING id INTO new_offer_id;
    
    -- Копируем всех пассажиров кроме удаляемого
    INSERT INTO offer_passengers(offer_id, passenger_id)
    SELECT new_offer_id, passenger_id
    FROM offer_passengers
    WHERE offer_id = p_offer_id 
      AND passenger_id != p_passenger_id;
    
    RETURN new_offer_id;
END;
$$;

-- Запустить поездку
CREATE OR REPLACE FUNCTION start_trip(p_trip_id BIGINT)
RETURNS void LANGUAGE plpgsql AS
$$
DECLARE
    max_offer_id BIGINT;
    existing_final_offer_id BIGINT;
BEGIN
    -- Проверяем существование поездки и что она не запущена
    IF NOT EXISTS (SELECT 1 FROM trip WHERE id = p_trip_id AND started_at IS NULL) THEN
        RAISE EXCEPTION 'Trip % not found or already started', p_trip_id;
    END IF;
    
    -- Проверяем, есть ли уже финальный оффер
    SELECT id INTO existing_final_offer_id 
    FROM "offer" 
    WHERE trip_id = p_trip_id AND is_final = TRUE;
    
    IF existing_final_offer_id IS NOT NULL THEN
        RAISE EXCEPTION 'Trip % already has final offer %, cannot auto-select', p_trip_id, existing_final_offer_id;
    END IF;
    
    -- Находим оффер с максимальным id
    SELECT id INTO max_offer_id 
    FROM "offer" 
    WHERE trip_id = p_trip_id 
    ORDER BY id DESC 
    LIMIT 1;
    
    -- Если нет офферов, выбрасываем исключение
    IF max_offer_id IS NULL THEN
        RAISE EXCEPTION 'Trip % has no offers, cannot start', p_trip_id;
    END IF;
    
    -- Помечаем последний оффер как финальный
    UPDATE "offer" SET is_final = TRUE WHERE id = max_offer_id;
    
    -- Запускаем поездку
    UPDATE trip SET started_at = now() WHERE id = p_trip_id;
END;
$$;

-- Завершить поездку
CREATE OR REPLACE FUNCTION finish_trip(p_trip_id BIGINT)
RETURNS void LANGUAGE plpgsql AS
$$
BEGIN
    UPDATE trip SET finished_at = now() WHERE id = p_trip_id AND finished_at IS NULL;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Trip % not found or already finished', p_trip_id;
    END IF;
END;
$$;

-- Добавить отзыв
CREATE OR REPLACE FUNCTION add_review(
    p_originator_id BIGINT, 
    p_receiver_id BIGINT, 
    p_trip_id BIGINT, 
    p_text TEXT, 
    p_rating INTEGER
)
RETURNS BIGINT LANGUAGE plpgsql AS
$$
DECLARE
    new_id BIGINT;
BEGIN
    INSERT INTO reviews(originator_id, receiver_id, trip_id, text, rating)
    VALUES (p_originator_id, p_receiver_id, p_trip_id, p_text, p_rating)
    RETURNING id INTO new_id;
    RETURN new_id;
END;
$$;

-- Поиск поездок рядом с координатами
CREATE OR REPLACE FUNCTION find_trips_near(
    p_x DOUBLE PRECISION, 
    p_y DOUBLE PRECISION, 
    p_radius DOUBLE PRECISION
)
RETURNS TABLE (
    trip_id BIGINT, 
    start_x DOUBLE PRECISION, 
    start_y DOUBLE PRECISION, 
    distance DOUBLE PRECISION
) 
LANGUAGE sql AS
$$
    SELECT t.id, l.x, l.y,
           sqrt((l.x - p_x)^2 + (l.y - p_y)^2) AS distance
    FROM trip t
    JOIN location l ON l.id = t.start_id
    WHERE sqrt((l.x - p_x)^2 + (l.y - p_y)^2) <= p_radius
    ORDER BY distance;
$$;

-- Получить рейтинг водителя
CREATE OR REPLACE FUNCTION get_driver_rating(p_driver_id BIGINT)
RETURNS NUMERIC(5,2) LANGUAGE sql AS
$$
    SELECT ROUND(AVG(r.rating)::NUMERIC, 2)
    FROM reviews r
    JOIN driver d ON d.person_id = r.receiver_id
    WHERE d.id = p_driver_id;
$$;

-- Получить количество поездок водителя
CREATE OR REPLACE FUNCTION get_driver_trip_count(p_driver_id BIGINT)
RETURNS INTEGER LANGUAGE sql AS
$$
    SELECT COUNT(*)::INTEGER
    FROM trip 
    WHERE driver_id = p_driver_id AND finished_at IS NOT NULL;
$$;

-- Получить рейтинг пассажира
CREATE OR REPLACE FUNCTION get_passenger_rating(p_passenger_id BIGINT)
RETURNS NUMERIC(5,2) LANGUAGE sql AS
$$
    SELECT ROUND(AVG(r.rating)::NUMERIC, 2)
    FROM reviews r
    JOIN passenger p ON p.person_id = r.receiver_id
    WHERE p.id = p_passenger_id;
$$;

-- Получить количество поездок пассажира
CREATE OR REPLACE FUNCTION get_passenger_trip_count(p_passenger_id BIGINT)
RETURNS INTEGER LANGUAGE sql AS
$$
    SELECT COUNT(DISTINCT t.id)::INTEGER
    FROM offer_passengers op
    JOIN "offer" o ON o.id = op.offer_id
    JOIN trip t ON t.id = o.trip_id
    WHERE op.passenger_id = p_passenger_id 
      AND t.finished_at IS NOT NULL;
$$;
