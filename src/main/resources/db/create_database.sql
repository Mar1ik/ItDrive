-- ============================================================================
-- Единый DDL скрипт для создания базы данных ItDrive
-- Включает все таблицы, индексы, функции, триггеры и представления
-- ============================================================================

-- ============================================================================
-- 1. СОЗДАНИЕ СХЕМЫ И ТИПОВ ДАННЫХ
-- ============================================================================

-- Создать схему public если не существует
CREATE SCHEMA IF NOT EXISTS public;
GRANT ALL ON SCHEMA public TO PUBLIC;

-- Типы данных (создаются только если не существуют)
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('DRIVER', 'PASSENGER', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.trip_status AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.booking_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.booking_payment_method AS ENUM ('CARD', 'CASH');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.payment_status AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 2. ОСНОВНЫЕ ТАБЛИЦЫ (для текущей функциональности)
-- ============================================================================

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS public.users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    role public.user_role NOT NULL,
    phone_number VARCHAR(50),
    rating NUMERIC(3,2) DEFAULT 5.0,
    total_trips INTEGER DEFAULT 0,
    is_blocked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- Таблица корпусов
CREATE TABLE IF NOT EXISTS public.buildings (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    address VARCHAR(500) NOT NULL,
    latitude NUMERIC(10,8),
    longitude NUMERIC(11,8)
);

-- Таблица водителей
CREATE TABLE IF NOT EXISTS public.drivers (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    car_model VARCHAR(255) NOT NULL,
    car_number VARCHAR(50) NOT NULL,
    car_seats INTEGER NOT NULL,
    car_color VARCHAR(50),
    experience INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- Таблица поездок
CREATE TABLE IF NOT EXISTS public.trips (
    id BIGSERIAL PRIMARY KEY,
    driver_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    from_building_id BIGINT NOT NULL REFERENCES public.buildings(id),
    to_building_id BIGINT NOT NULL REFERENCES public.buildings(id),
    departure_time TIMESTAMP NOT NULL,
    started_at TIMESTAMP,
    finished_at TIMESTAMP,
    max_passengers INTEGER NOT NULL,
    available_seats INTEGER NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    status public.trip_status NOT NULL DEFAULT 'SCHEDULED',
    description TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT chk_trip_times CHECK (
        (started_at IS NULL AND finished_at IS NULL) OR
        (started_at IS NOT NULL AND finished_at IS NULL) OR
        (started_at IS NOT NULL AND finished_at IS NOT NULL AND started_at <= finished_at)
    )
);

-- Таблица бронирований
CREATE TABLE IF NOT EXISTS public.bookings (
    id BIGSERIAL PRIMARY KEY,
    trip_id BIGINT NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    passenger_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status public.booking_status NOT NULL DEFAULT 'PENDING',
    price NUMERIC(10,2) NOT NULL,
    payment_method public.booking_payment_method NOT NULL,
    seats INTEGER DEFAULT 1,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- Таблица отзывов
CREATE TABLE IF NOT EXISTS public.reviews (
    id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    trip_id BIGINT REFERENCES public.trips(id) ON DELETE SET NULL,
    reviewer_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reviewed_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP NOT NULL
);

-- Таблица платежей
CREATE TABLE IF NOT EXISTS public.payments (
    id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    status public.payment_status NOT NULL DEFAULT 'PENDING',
    payment_method public.booking_payment_method NOT NULL,
    transaction_id VARCHAR(255),
    created_at TIMESTAMP NOT NULL
);

-- ============================================================================
-- 3. ДОПОЛНИТЕЛЬНЫЕ ТАБЛИЦЫ ИЗ init.sql (для соответствия оригинальной модели)
-- ============================================================================

-- Таблица person (базовая сущность пользователя)
CREATE TABLE IF NOT EXISTS public.person (
    id        BIGSERIAL PRIMARY KEY,
    name      TEXT NOT NULL,
    email     TEXT UNIQUE,
    phone     TEXT UNIQUE,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- Таблица admin (связь с person)
CREATE TABLE IF NOT EXISTS public.admin (
    id        BIGSERIAL PRIMARY KEY,
    person_id BIGINT NOT NULL REFERENCES public.person(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Таблица car (автомобили)
CREATE TABLE IF NOT EXISTS public.car (
    id     BIGSERIAL PRIMARY KEY,
    firm   TEXT,
    number TEXT UNIQUE,
    color  TEXT
);

-- Таблица location (локации)
CREATE TABLE IF NOT EXISTS public.location (
    id      BIGSERIAL PRIMARY KEY,
    x       DOUBLE PRECISION NOT NULL,
    y       DOUBLE PRECISION NOT NULL,
    address TEXT
);

-- Таблица driver (связь person + car) - для соответствия init.sql
CREATE TABLE IF NOT EXISTS public.driver (
    id          BIGSERIAL PRIMARY KEY,
    person_id   BIGINT NOT NULL UNIQUE REFERENCES public.person(id) ON DELETE CASCADE,
    car_id      BIGINT REFERENCES public.car(id) ON DELETE SET NULL,
    experience  INTEGER DEFAULT 0
);

-- Таблица passenger (связь с person)
CREATE TABLE IF NOT EXISTS public.passenger (
    id        BIGSERIAL PRIMARY KEY,
    person_id BIGINT NOT NULL UNIQUE REFERENCES public.person(id) ON DELETE CASCADE
);

-- Таблица offer (предложения для поездок)
CREATE TABLE IF NOT EXISTS public.offer (
    id                  BIGSERIAL PRIMARY KEY,
    trip_id             BIGINT NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    max_count_passenger INTEGER NOT NULL DEFAULT 1 CHECK (max_count_passenger >= 1),
    total_cost          INTEGER DEFAULT 0,
    is_final            BOOLEAN DEFAULT FALSE NOT NULL,
    created_at          TIMESTAMPTZ DEFAULT now()
);

-- Таблица offer_passengers (junction table для offer и passenger)
CREATE TABLE IF NOT EXISTS public.offer_passengers (
    offer_id     BIGINT NOT NULL REFERENCES public.offer(id) ON DELETE CASCADE,
    passenger_id BIGINT NOT NULL REFERENCES public.passenger(id) ON DELETE CASCADE,
    added_at     TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (offer_id, passenger_id)
);

-- Таблица itmo_buildings (связь с location)
CREATE TABLE IF NOT EXISTS public.itmo_buildings (
    id          BIGSERIAL PRIMARY KEY,
    location_id BIGINT REFERENCES public.location(id) ON DELETE SET NULL,
    name        TEXT
);

-- ============================================================================
-- 4. ИНДЕКСЫ
-- ============================================================================

-- Индексы для основных таблиц
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_trips_driver_id ON public.trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON public.trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_departure_time ON public.trips(departure_time);
CREATE INDEX IF NOT EXISTS idx_trips_started_at ON public.trips(started_at);
CREATE INDEX IF NOT EXISTS idx_bookings_trip_id ON public.bookings(trip_id);
CREATE INDEX IF NOT EXISTS idx_bookings_passenger_id ON public.bookings(passenger_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed_id ON public.reviews(reviewed_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON public.reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_trip_id ON public.reviews(trip_id);

-- Индексы для дополнительных таблиц из init.sql
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

-- ============================================================================
-- 5. PL/PGSQL ФУНКЦИИ
-- ============================================================================

-- Функция создания пользователя
CREATE OR REPLACE FUNCTION public.create_user(
    p_email VARCHAR(255),
    p_password VARCHAR(255),
    p_first_name VARCHAR(255),
    p_last_name VARCHAR(255),
    p_role VARCHAR(50),
    p_phone_number VARCHAR(50) DEFAULT NULL
) RETURNS BIGINT AS $$
DECLARE
    v_user_id BIGINT;
BEGIN
    INSERT INTO public.users (email, password, first_name, last_name, role, phone_number, rating, total_trips, is_blocked, created_at, updated_at)
    VALUES (p_email, p_password, p_first_name, p_last_name, p_role::public.user_role, p_phone_number, 5.0, 0, false, NOW(), NOW())
    RETURNING id INTO v_user_id;
    
    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;

-- Функция обновления рейтинга пользователя
CREATE OR REPLACE FUNCTION public.update_user_rating(
    p_user_id BIGINT
) RETURNS NUMERIC AS $$
DECLARE
    v_avg_rating NUMERIC;
BEGIN
    SELECT COALESCE(AVG(rating), 5.0) INTO v_avg_rating
    FROM public.reviews
    WHERE reviewed_id = p_user_id;
    
    UPDATE public.users
    SET rating = v_avg_rating, updated_at = NOW()
    WHERE id = p_user_id;
    
    RETURN v_avg_rating;
END;
$$ LANGUAGE plpgsql;

-- Функция создания поездки
CREATE OR REPLACE FUNCTION public.create_trip(
    p_driver_id BIGINT,
    p_from_building_id BIGINT,
    p_to_building_id BIGINT,
    p_departure_time TIMESTAMP,
    p_max_passengers INTEGER,
    p_price NUMERIC(10,2),
    p_description TEXT DEFAULT NULL
) RETURNS BIGINT AS $$
DECLARE
    v_trip_id BIGINT;
    v_description TEXT;
BEGIN
    -- Преобразуем пустую строку в NULL
    IF p_description IS NULL OR TRIM(p_description) = '' THEN
        v_description := NULL;
    ELSE
        v_description := TRIM(p_description);
    END IF;
    
    INSERT INTO public.trips (driver_id, from_building_id, to_building_id, departure_time, 
                      max_passengers, available_seats, price, status, description, 
                      created_at, updated_at)
    VALUES (p_driver_id, p_from_building_id, p_to_building_id, p_departure_time,
            p_max_passengers, p_max_passengers, p_price, 'SCHEDULED', v_description,
            NOW(), NOW())
    RETURNING id INTO v_trip_id;
    
    RETURN v_trip_id;
END;
$$ LANGUAGE plpgsql;

-- Функция создания бронирования
CREATE OR REPLACE FUNCTION public.create_booking(
    p_trip_id BIGINT,
    p_passenger_id BIGINT,
    p_price NUMERIC(10,2),
    p_payment_method VARCHAR(50),
    p_seats INTEGER DEFAULT 1
) RETURNS BIGINT AS $$
DECLARE
    v_booking_id BIGINT;
    v_available_seats INTEGER;
    v_seats INTEGER;
BEGIN
    -- Убеждаемся, что seats не NULL
    IF p_seats IS NULL OR p_seats < 1 THEN
        v_seats := 1;
    ELSE
        v_seats := p_seats;
    END IF;
    
    -- Проверка доступности мест
    SELECT available_seats INTO v_available_seats
    FROM public.trips
    WHERE id = p_trip_id AND status = 'SCHEDULED';
    
    IF v_available_seats IS NULL THEN
        RAISE EXCEPTION 'Поездка не найдена или уже началась';
    END IF;
    
    IF v_available_seats < v_seats THEN
        RAISE EXCEPTION 'Недостаточно свободных мест';
    END IF;
    
    -- Создание бронирования
    INSERT INTO public.bookings (trip_id, passenger_id, status, price, payment_method, seats, created_at, updated_at)
    VALUES (p_trip_id, p_passenger_id, 'PENDING', p_price, p_payment_method::public.booking_payment_method, v_seats, NOW(), NOW())
    RETURNING id INTO v_booking_id;
    
    -- Обновление доступных мест
    UPDATE public.trips
    SET available_seats = available_seats - p_seats, updated_at = NOW()
    WHERE id = p_trip_id;
    
    RETURN v_booking_id;
END;
$$ LANGUAGE plpgsql;

-- Функция подтверждения бронирования водителем
CREATE OR REPLACE FUNCTION public.confirm_booking(
    p_booking_id BIGINT
) RETURNS BOOLEAN AS $$
DECLARE
    v_trip_id BIGINT;
BEGIN
    UPDATE public.bookings
    SET status = 'CONFIRMED', updated_at = NOW()
    WHERE id = p_booking_id AND status = 'PENDING'
    RETURNING trip_id INTO v_trip_id;
    
    IF v_trip_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Функция отмены бронирования
CREATE OR REPLACE FUNCTION public.cancel_booking(
    p_booking_id BIGINT
) RETURNS BOOLEAN AS $$
DECLARE
    v_trip_id BIGINT;
    v_seats INTEGER;
    v_old_status VARCHAR(50);
BEGIN
    -- Получаем информацию о бронировании
    SELECT trip_id, seats, status INTO v_trip_id, v_seats, v_old_status
    FROM public.bookings
    WHERE id = p_booking_id;
    
    IF v_trip_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Отменяем бронирование
    UPDATE public.bookings
    SET status = 'CANCELLED', updated_at = NOW()
    WHERE id = p_booking_id;
    
    -- Возвращаем места обратно в поездку (если было подтверждено)
    IF v_old_status = 'CONFIRMED' THEN
        UPDATE public.trips
        SET available_seats = available_seats + v_seats, updated_at = NOW()
        WHERE id = v_trip_id;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Функция начала поездки
CREATE OR REPLACE FUNCTION public.start_trip(
    p_trip_id BIGINT
) RETURNS BOOLEAN AS $$
BEGIN
    -- Обновляем статус поездки и устанавливаем started_at
    UPDATE public.trips
    SET status = 'IN_PROGRESS', started_at = NOW(), updated_at = NOW()
    WHERE id = p_trip_id AND status = 'SCHEDULED';
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Обновляем статусы всех бронирований с PENDING на CONFIRMED
    UPDATE public.bookings
    SET status = 'CONFIRMED', updated_at = NOW()
    WHERE trip_id = p_trip_id AND status = 'PENDING';
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Функция завершения поездки
CREATE OR REPLACE FUNCTION public.complete_trip(
    p_trip_id BIGINT
) RETURNS BOOLEAN AS $$
BEGIN
    -- Обновляем статус поездки и устанавливаем finished_at
    UPDATE public.trips
    SET status = 'COMPLETED', finished_at = NOW(), updated_at = NOW()
    WHERE id = p_trip_id AND status = 'IN_PROGRESS';
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Обновляем статус всех бронирований (как подтвержденных, так и ожидающих подтверждения)
    UPDATE public.bookings
    SET status = 'COMPLETED', updated_at = NOW()
    WHERE trip_id = p_trip_id AND status IN ('CONFIRMED', 'PENDING');
    
    -- Обновляем счетчик поездок для водителя и пассажиров
    UPDATE public.users
    SET total_trips = total_trips + 1, updated_at = NOW()
    WHERE id IN (
        SELECT driver_id FROM public.trips WHERE id = p_trip_id
        UNION
        SELECT passenger_id FROM public.bookings WHERE trip_id = p_trip_id AND status = 'COMPLETED'
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Функция отмены поездки
CREATE OR REPLACE FUNCTION public.cancel_trip(
    p_trip_id BIGINT
) RETURNS BOOLEAN AS $$
DECLARE
    v_total_seats INTEGER;
BEGIN
    -- Проверяем, что поездка существует и еще не завершена/отменена
    IF NOT EXISTS (
        SELECT 1 FROM public.trips 
        WHERE id = p_trip_id 
        AND status NOT IN ('COMPLETED', 'CANCELLED')
    ) THEN
        RETURN FALSE;
    END IF;
    
    -- Вычисляем общее количество забронированных мест
    SELECT COALESCE(SUM(seats), 0) INTO v_total_seats
    FROM public.bookings
    WHERE trip_id = p_trip_id AND status IN ('PENDING', 'CONFIRMED');
    
    -- Обновляем статус поездки
    UPDATE public.trips
    SET status = 'CANCELLED', updated_at = NOW()
    WHERE id = p_trip_id;
    
    -- Возвращаем все забронированные места
    IF v_total_seats > 0 THEN
        UPDATE public.trips
        SET available_seats = available_seats + v_total_seats, updated_at = NOW()
        WHERE id = p_trip_id;
    END IF;
    
    -- Отменяем все бронирования для этой поездки
    UPDATE public.bookings
    SET status = 'CANCELLED', updated_at = NOW()
    WHERE trip_id = p_trip_id AND status IN ('PENDING', 'CONFIRMED');
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Функция создания отзыва
CREATE OR REPLACE FUNCTION public.create_review(
    p_booking_id BIGINT,
    p_reviewer_id BIGINT,
    p_reviewed_id BIGINT,
    p_rating INTEGER,
    p_comment TEXT DEFAULT NULL
) RETURNS BIGINT AS $$
DECLARE
    v_review_id BIGINT;
    v_comment TEXT;
    v_trip_id BIGINT;
BEGIN
    -- Проверка рейтинга
    IF p_rating < 1 OR p_rating > 5 THEN
        RAISE EXCEPTION 'Рейтинг должен быть от 1 до 5';
    END IF;
    
    -- Преобразуем пустую строку в NULL
    IF p_comment IS NULL OR TRIM(p_comment) = '' THEN
        v_comment := NULL;
    ELSE
        v_comment := TRIM(p_comment);
    END IF;
    
    -- Получаем trip_id из booking для совместимости с init.sql
    SELECT trip_id INTO v_trip_id
    FROM public.bookings
    WHERE id = p_booking_id;
    
    INSERT INTO public.reviews (booking_id, trip_id, reviewer_id, reviewed_id, rating, comment, created_at)
    VALUES (p_booking_id, v_trip_id, p_reviewer_id, p_reviewed_id, p_rating, v_comment, NOW())
    RETURNING id INTO v_review_id;
    
    -- Обновляем рейтинг пользователя
    PERFORM public.update_user_rating(p_reviewed_id);
    
    RETURN v_review_id;
END;
$$ LANGUAGE plpgsql;

-- Функция получения статистики поездок
CREATE OR REPLACE FUNCTION public.get_trip_statistics(
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
) RETURNS TABLE(
    total_trips BIGINT,
    completed_trips BIGINT,
    total_passengers BIGINT,
    total_revenue NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_trips,
        COUNT(*) FILTER (WHERE t.status = 'COMPLETED')::BIGINT as completed_trips,
        COALESCE(COUNT(DISTINCT b.passenger_id) FILTER (WHERE b.status = 'COMPLETED'), 0)::BIGINT as total_passengers,
        COALESCE(SUM(b.price) FILTER (WHERE b.status = 'COMPLETED'), 0) as total_revenue
    FROM public.trips t
    LEFT JOIN public.bookings b ON t.id = b.trip_id
    WHERE (p_start_date IS NULL OR DATE(t.created_at) >= p_start_date)
      AND (p_end_date IS NULL OR DATE(t.created_at) <= p_end_date);
END;
$$ LANGUAGE plpgsql;

-- Функция получения популярных маршрутов
CREATE OR REPLACE FUNCTION public.get_popular_routes(
    p_limit INTEGER DEFAULT 10
) RETURNS TABLE(
    from_building_name VARCHAR(255),
    to_building_name VARCHAR(255),
    trip_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b1.name as from_building_name,
        b2.name as to_building_name,
        COUNT(*)::BIGINT as trip_count
    FROM public.trips t
    JOIN public.buildings b1 ON t.from_building_id = b1.id
    JOIN public.buildings b2 ON t.to_building_id = b2.id
    WHERE t.status = 'COMPLETED'
    GROUP BY b1.name, b2.name
    ORDER BY trip_count DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. ТРИГГЕРЫ
-- ============================================================================

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

-- ============================================================================
-- 7. ПРЕДСТАВЛЕНИЯ (VIEWS)
-- ============================================================================

-- Представление для совместимости с init.sql (trip_with_final_offer)
CREATE OR REPLACE VIEW public.trip_with_final_offer AS
SELECT 
    t.id,
    t.driver_id,
    t.from_building_id AS start_id,
    t.to_building_id AS finish_id,
    t.started_at,
    t.finished_at,
    t.departure_time,
    t.max_passengers,
    t.available_seats,
    t.price,
    t.status,
    t.description,
    t.created_at,
    t.updated_at,
    NULL::BIGINT AS final_offer_id  -- В текущей модели нет offers, поэтому NULL
FROM public.trips t;

-- ============================================================================
-- КОНЕЦ СКРИПТА
-- ============================================================================
