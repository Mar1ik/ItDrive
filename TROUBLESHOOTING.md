# Решение проблем запуска ItDrive

## Проблема: Unable to start web server

Эта ошибка может возникать по нескольким причинам:

### 1. База данных не создана или не доступна

**Решение:**

1. Убедитесь, что PostgreSQL запущен:
```bash
# Проверьте статус PostgreSQL
# На macOS:
brew services list | grep postgresql

# На Linux:
sudo systemctl status postgresql
```

2. Создайте базу данных:
```sql
CREATE DATABASE "tikhon-pc";
```

3. Проверьте подключение:
```bash
psql -U tikhon-pc -d tikhon-pc
```

### 2. Таблицы не созданы

**Решение:**

Выполните SQL скрипты для создания таблиц:

```bash
psql -U tikhon-pc -d tikhon-pc -f src/main/resources/db/schema.sql
```

И создайте функции:

```bash
psql -U tikhon-pc -d tikhon-pc -f src/main/resources/db/migration/V1__create_functions.sql
```

### 3. Порт 8080 уже занят

**Решение:**

1. Найдите процесс, использующий порт 8080:
```bash
# На macOS/Linux:
lsof -i :8080
# или
netstat -an | grep 8080
```

2. Остановите процесс или измените порт в `application.yml`:
```yaml
server:
  port: 8081  # или другой свободный порт
```

### 4. Неправильные учетные данные БД

**Решение:**

Проверьте `application.yml` и убедитесь, что указаны правильные:
- URL базы данных
- Имя пользователя (username)
- Пароль (password)

Также можно использовать переменные окружения:
```bash
export DB_USERNAME=your_username
export DB_PASSWORD=your_password
```

### 5. Отсутствуют зависимости

**Решение:**

Пересоберите проект:
```bash
mvn clean install
```

### 6. Проблемы с Druid Connection Pool

**Решение:**

Если проблема связана с пулом соединений, попробуйте временно отключить Druid и использовать стандартный пул HikariCP. Для этого измените `application.yml`:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/tikhon-pc
    username: ${DB_USERNAME:tikhon-pc}
    password: ${DB_PASSWORD:123}
    driver-class-name: org.postgresql.Driver
```

И удалите из `pom.xml` зависимость `druid-spring-boot-3-starter` (или закомментируйте).

## Быстрая проверка

Выполните следующие команды для диагностики:

1. Проверьте подключение к БД:
```bash
psql -U tikhon-pc -d tikhon-pc -c "SELECT 1;"
```

2. Проверьте наличие таблиц:
```bash
psql -U tikhon-pc -d tikhon-pc -c "\dt"
```

3. Проверьте, свободен ли порт:
```bash
lsof -i :8080
```

4. Проверьте логи приложения - там должна быть более детальная информация об ошибке.

## Логи приложения

Для более детальной диагностики включите детальные логи в `application.yml`:

```yaml
logging:
  level:
    org.springframework: DEBUG
    org.hibernate: DEBUG
    ru.itmo.itdrive: DEBUG
```

## Альтернативное решение: использование H2 для тестирования

Если PostgreSQL вызывает проблемы, можно временно использовать H2 (in-memory БД) для тестирования:

1. Добавьте в `pom.xml`:
```xml
<dependency>
    <groupId>com.h2database</groupId>
    <artifactId>h2</artifactId>
    <scope>runtime</scope>
</dependency>
```

2. Измените `application.yml`:
```yaml
spring:
  datasource:
    url: jdbc:h2:mem:testdb
    driver-class-name: org.h2.Driver
    username: sa
    password: 
  
  h2:
    console:
      enabled: true
  
  jpa:
    hibernate:
      ddl-auto: create-drop
```

**Внимание:** H2 использует другую синтаксис SQL, поэтому PL/PGSQL функции работать не будут. Это только для тестирования базовой функциональности.
