# Настройка Google Maps API для ItDrive

Это руководство поможет вам настроить Google Maps API для отображения карт и маршрутов в приложении ItDrive.

## Шаг 1: Создание проекта в Google Cloud

1. Перейдите на [Google Cloud Console](https://console.cloud.google.com/)
2. Войдите в свой аккаунт Google
3. Создайте новый проект или выберите существующий
4. Запомните название проекта для дальнейшего использования

## Шаг 2: Включение необходимых API

В Google Cloud Console перейдите в раздел **APIs & Services > Library** и включите следующие API:

1. **Maps JavaScript API** - для отображения карт
2. **Directions API** - для построения маршрутов
3. **Places API** (опционально) - для автозаполнения адресов

Для каждого API:
- Нажмите на название API
- Нажмите кнопку **Enable** (Включить)

## Шаг 3: Создание API ключа

1. Перейдите в раздел **APIs & Services > Credentials**
2. Нажмите **+ CREATE CREDENTIALS** > **API key**
3. Скопируйте созданный API ключ
4. **Важно:** Сохраните ключ в безопасном месте

## Шаг 4: Настройка ограничений API ключа

Для безопасности рекомендуется настроить ограничения:

1. В разделе **Credentials** нажмите на созданный API ключ
2. В разделе **API restrictions**:
   - Выберите **Restrict key**
   - Отметьте только нужные API:
     - Maps JavaScript API
     - Directions API
     - Places API (если включен)
3. В разделе **Application restrictions**:
   - Выберите **HTTP referrers (web sites)**
   - Добавьте разрешенные домены:
     - `localhost:3000/*` (для разработки)
     - `localhost:5173/*` (для Vite dev server)
     - `your-domain.com/*` (для production)
4. Нажмите **Save**

## Шаг 5: Добавление API ключа в проект

1. Откройте файл `frontend/index.html`
2. Найдите строку:
   ```html
   <script
     src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places,directions"
     async
     defer
   ></script>
   ```
3. Замените `YOUR_API_KEY` на ваш реальный API ключ:
   ```html
   <script
     src="https://maps.googleapis.com/maps/api/js?key=AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q&libraries=places,directions"
     async
     defer
   ></script>
   ```

## Шаг 6: Проверка работы

1. Запустите фронтенд приложения:
   ```bash
   cd frontend
   npm run dev
   ```
2. Войдите в систему как водитель или пассажир
3. Откройте страницу создания поездки или поиска поездок
4. Убедитесь, что карта отображается корректно

## Устранение проблем

### Карта не загружается

- Проверьте, что API ключ правильно вставлен в `index.html`
- Убедитесь, что все необходимые API включены в Google Cloud Console
- Проверьте ограничения API ключа (должен быть разрешен `localhost`)
- Откройте консоль браузера (F12) и проверьте ошибки

### Ошибка "This API project is not authorized to use this API"

- Убедитесь, что вы включили все необходимые API в Google Cloud Console
- Проверьте, что в ограничениях API ключа выбраны правильные API

### Ошибка "RefererNotAllowedMapError"

- Проверьте настройки ограничений HTTP referrers
- Убедитесь, что ваш домен (например, `localhost:3000`) добавлен в список разрешенных

### Лимиты квоты

- Google Maps API имеет бесплатные квоты (например, 28,000 запросов в месяц для Maps JavaScript API)
- Для production приложения рассмотрите возможность настройки биллинга в Google Cloud Console
- Следите за использованием через Google Cloud Console

## Стоимость

Google Maps предоставляет бесплатный кредит в размере $200 в месяц. Для большинства небольших приложений этого достаточно.

Подробнее о ценах: https://mapsplatform.google.com/pricing/

## Дополнительные ресурсы

- [Документация Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)
- [Документация Directions API](https://developers.google.com/maps/documentation/directions)
- [Google Maps Platform](https://mapsplatform.google.com/)
