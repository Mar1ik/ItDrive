-- Создание схемы базы данных для ItDrive

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

-- Индексы для оптимизации запросов
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

-- Представление для совместимости с init.sql (trip_with_final_offer)
-- В текущей реализации используется bookings вместо offers, поэтому view будет пустым
-- но структура соответствует оригинальной модели
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
