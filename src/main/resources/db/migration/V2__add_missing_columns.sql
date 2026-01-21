-- Миграция для добавления недостающих полей из init.sql

-- Добавляем поля started_at и finished_at в таблицу trips (если их еще нет)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'trips' 
        AND column_name = 'started_at'
    ) THEN
        ALTER TABLE public.trips ADD COLUMN started_at TIMESTAMP;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'trips' 
        AND column_name = 'finished_at'
    ) THEN
        ALTER TABLE public.trips ADD COLUMN finished_at TIMESTAMP;
    END IF;
END $$;

-- Добавляем constraint на временные метки (если его еще нет)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = 'public' 
        AND table_name = 'trips' 
        AND constraint_name = 'chk_trip_times'
    ) THEN
        ALTER TABLE public.trips ADD CONSTRAINT chk_trip_times CHECK (
            (started_at IS NULL AND finished_at IS NULL) OR
            (started_at IS NOT NULL AND finished_at IS NULL) OR
            (started_at IS NOT NULL AND finished_at IS NOT NULL AND started_at <= finished_at)
        );
    END IF;
END $$;

-- Добавляем поле trip_id в таблицу reviews (если его еще нет)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'reviews' 
        AND column_name = 'trip_id'
    ) THEN
        ALTER TABLE public.reviews ADD COLUMN trip_id BIGINT REFERENCES public.trips(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Создаем индексы (если их еще нет)
CREATE INDEX IF NOT EXISTS idx_trips_started_at ON public.trips(started_at);
CREATE INDEX IF NOT EXISTS idx_reviews_trip_id ON public.reviews(trip_id);

-- Обновляем существующие записи reviews, устанавливая trip_id из booking
UPDATE public.reviews r
SET trip_id = b.trip_id
FROM public.bookings b
WHERE r.booking_id = b.id AND r.trip_id IS NULL;

-- Создаем или заменяем view trip_with_final_offer
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
