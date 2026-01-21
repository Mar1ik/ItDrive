-- Скрипт для создания функции cancel_trip, если она не существует
-- Выполните этот скрипт в базе данных, если возникает ошибка "function public.cancel_trip(bigint) does not exist"

SET search_path TO public;

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
