# Проверка базы данных

Если вы получаете ошибку "column u1_0.created_at does not exist", выполните следующие шаги для проверки:

## Шаг 1: Проверьте, что таблицы существуют

```bash
psql -U tikhon-pc -d tikhon-pc -c "\dt"
```

Должны увидеть список таблиц:
- users
- drivers
- buildings
- trips
- bookings
- reviews
- payments

## Шаг 2: Проверьте структуру таблицы users

```bash
psql -U tikhon-pc -d tikhon-pc -c "\d users"
```

Должны увидеть колонки:
- id
- email
- password
- first_name
- last_name
- role
- phone_number
- rating
- total_trips
- is_blocked
- created_at  ← Должна быть эта колонка!
- updated_at

## Шаг 3: Если таблица не существует или колонки неправильные

Выполните скрипт создания схемы заново:

```bash
psql -U tikhon-pc -d tikhon-pc -f src/main/resources/db/schema.sql
```

## Шаг 4: Если нужно пересоздать таблицу

```bash
psql -U tikhon-pc -d tikhon-pc
```

Затем в psql:

```sql
-- Удалить таблицу (осторожно - удалит все данные!)
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS trips CASCADE;
DROP TABLE IF EXISTS drivers CASCADE;
DROP TABLE IF EXISTS buildings CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Выполнить схему заново
\i src/main/resources/db/schema.sql

-- Или скопировать и вставить содержимое schema.sql
```

## Шаг 5: Перезапустите приложение

После проверки/исправления БД перезапустите Spring Boot приложение:

```bash
mvn spring-boot:run
```
