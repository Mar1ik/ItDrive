-- Миграция для добавления недостающих таблиц из init.sql
-- Эти таблицы создаются параллельно с существующими для соответствия оригинальной модели

-- 1. Таблица person (базовая сущность пользователя)
CREATE TABLE IF NOT EXISTS public.person (
    id        BIGSERIAL PRIMARY KEY,
    name      TEXT NOT NULL,
    email     TEXT UNIQUE,
    phone     TEXT UNIQUE,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- 2. Таблица admin (связь с person)
CREATE TABLE IF NOT EXISTS public.admin (
    id        BIGSERIAL PRIMARY KEY,
    person_id BIGINT NOT NULL REFERENCES public.person(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Таблица car (автомобили)
CREATE TABLE IF NOT EXISTS public.car (
    id     BIGSERIAL PRIMARY KEY,
    firm   TEXT,
    number TEXT UNIQUE,
    color  TEXT
);

-- 4. Таблица location (локации)
CREATE TABLE IF NOT EXISTS public.location (
    id      BIGSERIAL PRIMARY KEY,
    x       DOUBLE PRECISION NOT NULL,
    y       DOUBLE PRECISION NOT NULL,
    address TEXT
);

-- 5. Таблица driver (связь person + car)
-- ВАЖНО: Это для соответствия init.sql, но текущая система использует drivers (множественное число)
-- Создаем driver (единственное число) как в init.sql
CREATE TABLE IF NOT EXISTS public.driver (
    id          BIGSERIAL PRIMARY KEY,
    person_id   BIGINT NOT NULL UNIQUE REFERENCES public.person(id) ON DELETE CASCADE,
    car_id      BIGINT REFERENCES public.car(id) ON DELETE SET NULL,
    experience  INTEGER DEFAULT 0
);

-- 6. Таблица passenger (связь с person)
CREATE TABLE IF NOT EXISTS public.passenger (
    id        BIGSERIAL PRIMARY KEY,
    person_id BIGINT NOT NULL UNIQUE REFERENCES public.person(id) ON DELETE CASCADE
);

-- 7. Таблица offer (предложения для поездок)
CREATE TABLE IF NOT EXISTS public.offer (
    id                  BIGSERIAL PRIMARY KEY,
    trip_id             BIGINT NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    max_count_passenger INTEGER NOT NULL DEFAULT 1 CHECK (max_count_passenger >= 1),
    total_cost          INTEGER DEFAULT 0,
    is_final            BOOLEAN DEFAULT FALSE NOT NULL,
    created_at          TIMESTAMPTZ DEFAULT now()
);

-- 8. Таблица offer_passengers (junction table для offer и passenger)
CREATE TABLE IF NOT EXISTS public.offer_passengers (
    offer_id     BIGINT NOT NULL REFERENCES public.offer(id) ON DELETE CASCADE,
    passenger_id BIGINT NOT NULL REFERENCES public.passenger(id) ON DELETE CASCADE,
    added_at     TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (offer_id, passenger_id)
);

-- 9. Таблица itmo_buildings (связь с location)
CREATE TABLE IF NOT EXISTS public.itmo_buildings (
    id          BIGSERIAL PRIMARY KEY,
    location_id BIGINT REFERENCES public.location(id) ON DELETE SET NULL,
    name        TEXT
);

-- Индексы для новых таблиц
CREATE INDEX IF NOT EXISTS idx_person_email ON public.person(email);
CREATE INDEX IF NOT EXISTS idx_person_phone ON public.person(phone);
CREATE INDEX IF NOT EXISTS idx_admin_person_id ON public.admin(person_id);
CREATE INDEX IF NOT EXISTS idx_car_number ON public.car(number);
CREATE INDEX IF NOT EXISTS idx_location_xy ON public.location(x, y);
CREATE INDEX IF NOT EXISTS idx_driver_person_id ON public.driver(person_id);
CREATE INDEX IF NOT EXISTS idx_driver_car_id ON public.driver(car_id);
CREATE INDEX IF NOT EXISTS idx_passenger_person_id ON public.passenger(person_id);
CREATE INDEX IF NOT EXISTS idx_offer_trip_id ON public.offer(trip_id);
CREATE INDEX IF NOT EXISTS idx_offer_is_final ON public.offer(is_final) WHERE is_final = TRUE;
CREATE INDEX IF NOT EXISTS idx_offer_passengers_passenger_id ON public.offer_passengers(passenger_id);
CREATE INDEX IF NOT EXISTS idx_itmo_buildings_location_id ON public.itmo_buildings(location_id);

-- Уникальный индекс для одного финального оффера на поездку
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_final_offer_per_trip 
ON public.offer(trip_id) WHERE is_final = TRUE;

-- Триггер для проверки вместимости оффера (из init.sql)
CREATE OR REPLACE FUNCTION fn_check_offer_capacity()
RETURNS trigger LANGUAGE plpgsql AS
$$
DECLARE
    maxc INTEGER;
    cnt  INTEGER;
BEGIN
    SELECT max_count_passenger INTO maxc FROM public.offer WHERE id = NEW.offer_id FOR UPDATE;
    IF maxc IS NULL THEN
        RAISE EXCEPTION 'Offer % does not exist', NEW.offer_id;
    END IF;

    SELECT COUNT(*) INTO cnt FROM public.offer_passengers WHERE offer_id = NEW.offer_id;

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

-- Создаем триггер только если его еще нет
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_offer_capacity'
    ) THEN
        CREATE TRIGGER trg_offer_capacity
        BEFORE INSERT OR UPDATE ON public.offer_passengers
        FOR EACH ROW EXECUTE FUNCTION fn_check_offer_capacity();
    END IF;
END $$;
