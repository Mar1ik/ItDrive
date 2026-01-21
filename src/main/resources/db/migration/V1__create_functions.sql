-- PL/PGSQL функции для уровня хранения данных

-- Создать схему public если не существует
CREATE SCHEMA IF NOT EXISTS public;
GRANT ALL ON SCHEMA public TO PUBLIC;

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
