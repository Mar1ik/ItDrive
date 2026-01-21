# Исправление ошибки "no schema has been selected"

Если вы получаете ошибку "no schema has been selected to create in" при выполнении SQL скриптов, есть несколько решений:

## Решение 1: Использовать командную строку (рекомендуется)

Вместо выполнения через IDE, выполните скрипты через командную строку:

```bash
# Выполните схему БД
psql -U tikhon-pc -d tikhon-pc -f src/main/resources/db/schema.sql

# Выполните функции
psql -U tikhon-pc -d tikhon-pc -f src/main/resources/db/migration/V1__create_functions.sql
```

## Решение 2: В DataGrip/IntelliJ IDEA

1. Откройте Database tool window (View → Tool Windows → Database)
2. Подключитесь к базе данных `tikhon-pc`
3. Убедитесь, что в настройках подключения выбрана схема `public`
4. Выполните скрипт через контекстное меню (правая кнопка → Run)

Или установите схему вручную перед выполнением:

```sql
SET search_path TO public;
-- Затем выполните остальной скрипт
```

## Решение 3: Выполнить вручную в psql

1. Подключитесь к базе данных:
```bash
psql -U tikhon-pc -d tikhon-pc
```

2. Установите схему:
```sql
SET search_path TO public;
```

3. Скопируйте и вставьте содержимое `schema.sql`

4. Выполните функции:
```sql
-- Скопируйте и вставьте содержимое V1__create_functions.sql
```

## Решение 4: Использовать Hibernate для создания таблиц (временно)

Поскольку вы уже изменили `ddl-auto: update`, Hibernate автоматически создаст таблицы при запуске приложения. Это временное решение для тестирования.

После успешного запуска верните обратно `ddl-auto: none` и создайте таблицы вручную правильным способом.

## Проверка после выполнения

После выполнения скриптов проверьте:

```bash
psql -U tikhon-pc -d tikhon-pc -c "\dt"
```

Должны увидеть все таблицы:
- users
- drivers  
- buildings
- trips
- bookings
- reviews
- payments
