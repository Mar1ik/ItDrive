# Диаграмма классов системы ItDrive

## Уровень модели данных (Model)

### User (Пользователь)
- id: Long
- email: String
- password: String
- firstName: String
- lastName: String
- role: UserRole (DRIVER, PASSENGER, ADMIN)
- phoneNumber: String
- rating: Double
- totalTrips: Integer
- isBlocked: Boolean
- createdAt: LocalDateTime
- updatedAt: LocalDateTime

### Driver (Водитель)
- id: Long
- user: User (OneToOne)
- carModel: String
- carNumber: String
- carSeats: Integer
- carColor: String
- createdAt: LocalDateTime
- updatedAt: LocalDateTime

### Building (Корпус)
- id: Long
- name: String
- address: String
- latitude: Double
- longitude: Double

### Trip (Поездка)
- id: Long
- driver: User (ManyToOne)
- fromBuilding: Building (ManyToOne)
- toBuilding: Building (ManyToOne)
- departureTime: LocalDateTime
- maxPassengers: Integer
- availableSeats: Integer
- price: BigDecimal
- status: TripStatus (SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED)
- description: String
- createdAt: LocalDateTime
- updatedAt: LocalDateTime

### Booking (Бронирование)
- id: Long
- trip: Trip (ManyToOne)
- passenger: User (ManyToOne)
- status: BookingStatus (PENDING, CONFIRMED, CANCELLED, COMPLETED)
- price: BigDecimal
- paymentMethod: PaymentMethod (CARD, CASH)
- seats: Integer
- createdAt: LocalDateTime
- updatedAt: LocalDateTime

### Review (Отзыв)
- id: Long
- booking: Booking (ManyToOne)
- reviewer: User (ManyToOne)
- reviewed: User (ManyToOne)
- rating: Integer
- comment: String
- createdAt: LocalDateTime

### Payment (Оплата)
- id: Long
- booking: Booking (ManyToOne)
- amount: BigDecimal
- status: PaymentStatus (PENDING, COMPLETED, FAILED, REFUNDED)
- paymentMethod: PaymentMethod (CARD, CASH)
- transactionId: String
- createdAt: LocalDateTime

## Уровень хранения данных (Repository)

### UserRepository extends JpaRepository<User, Long>
- findByEmail(String email): Optional<User>
- findByRole(UserRole role): List<User>

### DriverRepository extends JpaRepository<Driver, Long>
- findByUserId(Long userId): Optional<Driver>

### BuildingRepository extends JpaRepository<Building, Long>
- findByName(String name): Optional<Building>

### TripRepository extends JpaRepository<Trip, Long>
- findByDriverId(Long driverId): List<Trip>
- findByStatus(TripStatus status): List<Trip>
- findByFromBuildingIdAndToBuildingId(Long fromId, Long toId): List<Trip>

### BookingRepository extends JpaRepository<Booking, Long>
- findByTripId(Long tripId): List<Booking>
- findByPassengerId(Long passengerId): List<Booking>
- findByTripIdAndPassengerId(Long tripId, Long passengerId): Optional<Booking>

### ReviewRepository extends JpaRepository<Review, Long>
- findByReviewedId(Long reviewedId): List<Review>

### PaymentRepository extends JpaRepository<Payment, Long>
- findByBookingId(Long bookingId): Optional<Payment>

## Уровень бизнес-логики (Service)

### UserService
- register(RegisterRequest): User
- authenticate(AuthenticationRequest): AuthenticationResponse
- getUserById(Long): User
- updateUserRating(Long): Double
- blockUser(Long): void
- unblockUser(Long): void

### DriverService
- registerDriver(DriverRegistrationRequest): Driver
- getDriverInfo(Long): Driver
- updateDriverInfo(Long, DriverUpdateRequest): Driver

### TripService
- createTrip(CreateTripRequest): Trip
- getTripsByDriver(Long): List<Trip>
- searchTrips(TripSearchRequest): List<Trip>
- getTripById(Long): Trip
- startTrip(Long): void
- completeTrip(Long): void
- cancelTrip(Long): void

### BookingService
- createBooking(CreateBookingRequest): Booking
- confirmBooking(Long): void
- cancelBooking(Long): void
- getBookingsByPassenger(Long): List<Booking>
- getBookingsByTrip(Long): List<Booking>

### ReviewService
- createReview(CreateReviewRequest): Review
- getReviewsByUser(Long): List<Review>

### PaymentService
- processPayment(PaymentRequest): Payment
- getPaymentByBooking(Long): Payment

### AdminService
- getStatistics(StatisticsRequest): StatisticsResponse
- getPopularRoutes(Integer): List<RouteStatistics>
- getAllUsers(): List<User>
- blockUser(Long): void

## Уровень представления (Controller)

### AuthController
- POST /api/auth/register - Регистрация
- POST /api/auth/login - Авторизация

### UserController
- GET /api/users/{id} - Получить пользователя
- PUT /api/users/{id} - Обновить профиль
- PUT /api/users/{id}/role - Изменить роль

### DriverController
- POST /api/drivers/register - Регистрация водителя
- GET /api/drivers/{id} - Информация о водителе
- PUT /api/drivers/{id} - Обновить данные водителя

### TripController
- POST /api/trips - Создать поездку
- GET /api/trips - Поиск поездок
- GET /api/trips/{id} - Получить поездку
- GET /api/trips/driver/{driverId} - Поездки водителя
- PUT /api/trips/{id}/start - Начать поездку
- PUT /api/trips/{id}/complete - Завершить поездку
- DELETE /api/trips/{id} - Отменить поездку

### BookingController
- POST /api/bookings - Создать бронирование
- GET /api/bookings/passenger/{passengerId} - Бронирования пассажира
- GET /api/bookings/trip/{tripId} - Бронирования поездки
- PUT /api/bookings/{id}/confirm - Подтвердить бронирование
- DELETE /api/bookings/{id} - Отменить бронирование

### ReviewController
- POST /api/reviews - Создать отзыв
- GET /api/reviews/user/{userId} - Отзывы о пользователе

### PaymentController
- POST /api/payments - Обработать платеж
- GET /api/payments/booking/{bookingId} - Получить платеж

### AdminController
- GET /api/admin/statistics - Статистика
- GET /api/admin/routes/popular - Популярные маршруты
- GET /api/admin/users - Все пользователи
- PUT /api/admin/users/{id}/block - Заблокировать пользователя

## Вспомогательные классы

### JwtUtil
- generateToken(UserDetails): String
- extractUsername(String): String
- validateToken(String): Boolean

### SecurityConfig
- configure(HttpSecurity): void
- passwordEncoder(): PasswordEncoder
- authenticationProvider(): AuthenticationProvider

### DTOs (Data Transfer Objects)
- RegisterRequest
- AuthenticationRequest
- AuthenticationResponse
- CreateTripRequest
- TripSearchRequest
- CreateBookingRequest
- CreateReviewRequest
- PaymentRequest
- StatisticsResponse
- RouteStatistics
