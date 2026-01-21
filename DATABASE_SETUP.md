# Инструкция по настройке базы данных

## Шаг 1: Установка и запуск PostgreSQL

Убедитесь, что PostgreSQL установлен и запущен:

**macOS:**
```bash
# Проверка статуса PostgreSQL
brew services list | grep postgresql

# Если не запущен, запустите:
brew services start postgresql
```

**Linux:**
```bash
# Проверка статуса
sudo systemctl status postgresql

# Если не запущен, запустите:
sudo systemctl start postgresql
```

## Шаг 2: Создание базы данных

Откройте терминал и подключитесь к PostgreSQL:

```bash
psql -U postgres
```

Если у вас другой пользователь (например, `tikhon-pc`), используйте:
```bash
psql -U tikhon-pc
```

Затем создайте базу данных:

```sql
CREATE DATABASE "tikhon-pc";
```

Или если база данных уже существует, можно выйти из psql:
```sql
\q
```

## Шаг 3: Выполнение скриптов

### Вариант 1: Через командную строку (рекомендуется)

**Выполните первый скрипт (создание схемы БД):**

```bash
psql -U tikhon-pc -d tikhon-pc -f src/main/resources/db/schema.sql
```

**Выполните второй скрипт (создание PL/PGSQL функций):**

```bash
psql -U tikhon-pc -d tikhon-pc -f src/main/resources/db/migration/V1__create_functions.sql
```

### Вариант 2: Через psql интерактивно

1. Подключитесь к базе данных:
```bash
psql -U tikhon-pc -d tikhon-pc
```

2. Скопируйте и вставьте содержимое файла `src/main/resources/db/schema.sql` в psql

3. Затем скопируйте и вставьте содержимое файла `src/main/resources/db/migration/V1__create_functions.sql`

### Вариант 3: Через IDE (IntelliJ IDEA / DataGrip)

1. Откройте файл `src/main/resources/db/schema.sql`
2. Подключитесь к базе данных через Database tool window
3. Выполните скрипт (Ctrl+Enter или кнопка Execute)
4. Повторите для `src/main/resources/db/migration/V1__create_functions.sql`

## Шаг 4: Проверка

Проверьте, что все таблицы созданы:

```bash
psql -U tikhon-pc -d tikhon-pc -c "\dt"
```

Вы должны увидеть список таблиц:
- users
- drivers
- buildings
- trips
- bookings
- reviews
- payments

Проверьте функции:

```bash
psql -U tikhon-pc -d tikhon-pc -c "\df"
```

Вы должны увидеть список функций:
- create_user
- update_user_rating
- create_trip
- create_booking
- и другие...

## Возможные проблемы

### Проблема: "role tikhon-pc does not exist"

**Решение:** Создайте пользователя PostgreSQL:
```sql
CREATE USER tikhon-pc WITH PASSWORD '123';
ALTER USER tikhon-pc CREATEDB;
```

### Проблема: "password authentication failed"

**Решение:** Проверьте пароль в `application.yml`. По умолчанию используется пароль `123`.

Если нужен другой пароль, измените его в PostgreSQL:
```sql
ALTER USER tikhon-pc WITH PASSWORD 'ваш_пароль';
```

И обновите `application.yml`:
```yaml
spring:
  datasource:
    druid:
      password: ${DB_PASSWORD:ваш_пароль}
```

### Проблема: "database tikhon-pc already exists"

**Решение:** Это нормально. Если нужно пересоздать базу:
```sql
DROP DATABASE "tikhon-pc";
CREATE DATABASE "tikhon-pc";
```

## Полный скрипт для быстрой настройки

Если хотите выполнить все одной командой:

```bash
# 1. Создать базу (если не существует)
createdb -U tikhon-pc tikhon-pc

# 2. Выполнить схему БД
psql -U tikhon-pc -d tikhon-pc -f src/main/resources/db/schema.sql

# 3. Выполнить функции
psql -U tikhon-pc -d tikhon-pc -f src/main/resources/db/migration/V1__create_functions.sql
```

## После выполнения скриптов

После успешного выполнения скриптов вы можете запустить Spring Boot приложение:

```bash
mvn spring-boot:run
```

Приложение должно успешно подключиться к базе данных.
