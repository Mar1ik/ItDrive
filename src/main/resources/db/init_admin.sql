-- Скрипт для ручного создания дефолтного администратора
-- ПАРАМЕТРЫ ПО УМОЛЧАНИЮ:
-- Email: admin@itdrive.ru
-- Пароль: admin123

-- ВАЖНО: 
-- 1. Пароли хешируются с помощью BCrypt, поэтому нельзя просто вставить пароль напрямую
-- 2. Приложение автоматически создает администратора при первом запуске (см. AdminInitializer.java)
-- 3. Этот скрипт нужен только если вы хотите создать админа вручную через SQL

-- Если вы хотите создать админа через SQL, используйте функцию create_user:
-- SELECT public.create_user(
--     'admin@itdrive.ru',           -- email
--     '$2a$10$...',                 -- BCrypt хеш пароля (сгенерируйте через Java код или онлайн генератор)
--     'Администратор',              -- имя
--     'Системы',                    -- фамилия
--     'ADMIN',                      -- роль
--     NULL                          -- телефон (необязательно)
-- );

-- Пример создания через прямую вставку (НЕ РЕКОМЕНДУЕТСЯ - используйте функцию create_user):
-- INSERT INTO public.users (email, password, first_name, last_name, role, phone_number, rating, total_trips, is_blocked, created_at, updated_at)
-- VALUES (
--     'admin@itdrive.ru',
--     '$2a$10$...', -- ВАЖНО: Замените на реальный BCrypt хеш пароля!
--     'Администратор',
--     'Системы',
--     'ADMIN',
--     NULL,
--     5.0,
--     0,
--     false,
--     NOW(),
--     NOW()
-- );

-- Проверка существования админа:
-- SELECT * FROM public.users WHERE email = 'admin@itdrive.ru' AND role = 'ADMIN';
