# ItDrive - Система шеринговых поездок

Информационная система для организации шеринговых поездок между корпусами университета ИТМО.

## Технологический стек

- **Backend**: Spring Boot 3.2.0, Spring Security, JWT
- **Frontend**: React 18.2, React Router, Axios, Vite
- **База данных**: PostgreSQL с PL/PGSQL
- **Сборка**: Maven (Backend), npm (Frontend)



### Запуск Backend

```bash
mvn clean install
mvn spring-boot:run
```

Backend API доступен по адресу: http://localhost:8080

### Запуск Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend приложение доступно по адресу: http://localhost:3000

## Структура проекта

```
ItDrive/
├── src/                    # Backend (Spring Boot)
│   ├── main/java/         # Java код
│   └── main/resources/    # Конфигурация и SQL скрипты
└──  frontend/              # Frontend (React)
    └── src/               # React компоненты и страницы
```

## Документация

- [Этап 1](https://docs.google.com/document/d/13v132S5NvClXKvdx7IG2uDvUJ1EH2hm01FPdq6Eryu8/edit?tab=t.0#heading=h.8ja68i3q11xb)
- [Этап 2](https://docs.google.com/document/d/1Ck0I_Pct5QGSF-rvRm6a2-eEG6dVDASNvfHTtFC9e4s/edit?tab=t.0#heading=h.8ja68i3q11xb)
- [Frontend README](frontend/README.md)

## Авторы

Прадед В. В., Дмитриев Т. А.  
Группа Р3306, 2025
