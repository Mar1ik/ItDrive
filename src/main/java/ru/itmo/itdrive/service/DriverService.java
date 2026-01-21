package ru.itmo.itdrive.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.itmo.itdrive.dto.DriverStatisticsResponse;
import ru.itmo.itdrive.dto.UpdateDriverCarRequest;
import ru.itmo.itdrive.model.Booking;
import ru.itmo.itdrive.model.Driver;
import ru.itmo.itdrive.model.Trip;
import ru.itmo.itdrive.model.User;
import ru.itmo.itdrive.repository.BookingRepository;
import ru.itmo.itdrive.repository.DriverRepository;
import ru.itmo.itdrive.repository.TripRepository;
import ru.itmo.itdrive.repository.UserRepository;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DriverService {

    private final DriverRepository driverRepository;
    private final UserRepository userRepository;
    private final TripRepository tripRepository;
    private final BookingRepository bookingRepository;

    @Transactional
    public Driver getOrCreateDriver(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));

        if (user.getRole() != User.UserRole.DRIVER) {
            throw new IllegalArgumentException("Пользователь не является водителем");
        }

        return driverRepository.findByUserId(userId)
                .orElseGet(() -> {
                    // Создаем запись водителя, если ее нет
                    Driver driver = new Driver();
                    driver.setUser(user);
                    driver.setCarModel("Не указано");
                    driver.setCarNumber("Не указано");
                    driver.setCarSeats(4);
                    driver.setCarColor(null);
                    return driverRepository.save(driver);
                });
    }

    @Transactional
    public Driver updateDriverCar(Long userId, UpdateDriverCarRequest request) {
        Driver driver = getOrCreateDriver(userId);

        driver.setCarModel(request.getCarModel());
        driver.setCarNumber(request.getCarNumber());
        driver.setCarSeats(request.getCarSeats());
        driver.setCarColor(request.getCarColor());

        return driverRepository.save(driver);
    }

    @Transactional(readOnly = true)
    public Driver getDriverByUserId(Long userId) {
        return driverRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Информация о водителе не найдена"));
    }

    @Transactional(readOnly = true)
    public DriverStatisticsResponse getDriverStatistics(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));
        
        List<Trip> trips = tripRepository.findByDriverId(userId);
        
        long totalTrips = trips.size();
        long completedTrips = trips.stream()
                .filter(t -> t.getStatus() == Trip.TripStatus.COMPLETED)
                .count();
        long cancelledTrips = trips.stream()
                .filter(t -> t.getStatus() == Trip.TripStatus.CANCELLED)
                .count();
        
        // Подсчитываем количество уникальных пассажиров
        long totalPassengers = trips.stream()
                .flatMap(trip -> bookingRepository.findByTripId(trip.getId()).stream())
                .filter(booking -> booking.getStatus() == Booking.BookingStatus.COMPLETED)
                .map(Booking::getPassenger)
                .distinct()
                .count();
        
        // Подсчитываем заработок водителя (сумма всех завершенных бронирований в его поездках)
        BigDecimal totalEarnings = trips.stream()
                .filter(t -> t.getStatus() == Trip.TripStatus.COMPLETED)
                .flatMap(trip -> bookingRepository.findByTripId(trip.getId()).stream())
                .filter(booking -> booking.getStatus() == Booking.BookingStatus.COMPLETED)
                .map(Booking::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        Double averageRating = user.getRating();
        Integer totalTripsCount = user.getTotalTrips();
        
        return new DriverStatisticsResponse(
                totalTrips,
                completedTrips,
                cancelledTrips,
                totalPassengers,
                totalEarnings,
                averageRating,
                totalTripsCount
        );
    }
}
