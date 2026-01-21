# ItDrive - Система шеринговых поездок

Информационная система для организации шеринговых поездок между корпусами университета ИТМО.

## Технологический стек

- **Backend**: Spring Boot 3.2.0, Spring Security, JWT
- **Frontend**: React 18.2, React Router, Axios, Vite
- **База данных**: PostgreSQL с PL/PGSQL
- **Сборка**: Maven (Backend), npm (Frontend)

## Быстрый старт

### 1. Настройка базы данных

Создайте базу данных PostgreSQL:
```sql
CREATE DATABASE "tikhon-pc";
```

Выполните схему БД:
```bash
psql -U tikhon-pc -d tikhon-pc -f src/main/resources/db/schema.sql
```

Создайте функции:
```bash
psql -U tikhon-pc -d tikhon-pc -f src/main/resources/db/migration/V1__create_functions.sql
```

### 2. Конфигурация

Настройте `src/main/resources/application.yml`:
```yaml
spring:
  datasource:
    druid:
      url: jdbc:postgresql://localhost:5432/tikhon-pc
      username: tikhon-pc
      password: 123
```

### 3. Запуск Backend

```bash
mvn clean install
mvn spring-boot:run
```

Backend API доступен по адресу: http://localhost:8080

### 4. Запуск Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend приложение доступно по адресу: http://localhost:3000

## API эндпоинты

### Авторизация
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Авторизация

### Поездки
- `POST /api/trips` - Создать поездку
- `GET /api/trips` - Поиск поездок
- `GET /api/trips/{id}` - Получить поездку
- `PUT /api/trips/{id}/start` - Начать поездку
- `PUT /api/trips/{id}/complete` - Завершить поездку
- `DELETE /api/trips/{id}` - Отменить поездку

### Бронирования
- `POST /api/bookings` - Создать бронирование
- `GET /api/bookings/passenger/{passengerId}` - Бронирования пассажира
- `PUT /api/bookings/{id}/confirm` - Подтвердить бронирование
- `DELETE /api/bookings/{id}` - Отменить бронирование

### Отзывы
- `POST /api/reviews` - Создать отзыв
- `GET /api/reviews/user/{userId}` - Отзывы о пользователе

### Администрирование
- `GET /api/admin/statistics` - Статистика системы
- `GET /api/admin/routes/popular` - Популярные маршруты
- `PUT /api/admin/users/{id}/block` - Заблокировать пользователя

## Структура проекта

```
ItDrive/
├── src/                    # Backend (Spring Boot)
│   ├── main/java/         # Java код
│   └── main/resources/    # Конфигурация и SQL скрипты
├── frontend/              # Frontend (React)
│   └── src/               # React компоненты и страницы
└── docs/                  # Документация
```

## Документация

- [Диаграмма классов](docs/class-diagram.md)
- [Отчет по этапу 3](docs/etap3-report.md)
- [Итоговый отчет](docs/final-report.md)
- [Frontend README](frontend/README.md)

## Авторы

Прадед В. В., Дмитриев Т. А.  
Группа Р3306, 2025
