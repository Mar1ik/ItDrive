package ru.itmo.itdrive.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.itmo.itdrive.dto.CreateBookingRequest;
import ru.itmo.itdrive.model.Booking;
import ru.itmo.itdrive.model.Trip;
import ru.itmo.itdrive.repository.BookingRepository;
import ru.itmo.itdrive.repository.TripRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingService {
    
    private final BookingRepository bookingRepository;
    private final TripRepository tripRepository;

    @Transactional
    public Booking createBooking(CreateBookingRequest request, Long passengerId) {
        Trip trip = tripRepository.findById(request.getTripId())
                .orElseThrow(() -> new IllegalArgumentException("Поездка не найдена"));
        
        if (!trip.getStatus().equals(Trip.TripStatus.SCHEDULED)) {
            throw new IllegalArgumentException("Невозможно забронировать место в поездке, которая уже началась");
        }
        
        if (trip.getDriver().getId().equals(passengerId)) {
            throw new IllegalArgumentException("Водитель не может забронировать место в своей поездке");
        }
        
        if (trip.getAvailableSeats() < (request.getSeats() != null ? request.getSeats() : 1)) {
            throw new IllegalArgumentException("Недостаточно свободных мест");
        }

        // Проверка существующего бронирования
        if (bookingRepository.findByTripIdAndPassengerId(request.getTripId(), passengerId).isPresent()) {
            throw new IllegalArgumentException("Вы уже забронировали место в этой поездке");
        }

        // Убеждаемся, что seats всегда число, не NULL
        Integer seats = request.getSeats() != null && request.getSeats() > 0 ? request.getSeats() : 1;
        
        Long bookingId = bookingRepository.createBooking(
                request.getTripId(),
                passengerId,
                trip.getPrice().multiply(java.math.BigDecimal.valueOf(seats)),
                request.getPaymentMethod(),
                seats
        );

        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Ошибка при создании бронирования"));
    }

    @Transactional
    public void confirmBooking(Long bookingId, Long driverId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Бронирование не найдено"));
        
        Trip trip = booking.getTrip();
        if (!trip.getDriver().getId().equals(driverId)) {
            throw new IllegalArgumentException("Только водитель может подтвердить бронирование");
        }

        Boolean result = bookingRepository.confirmBooking(bookingId);
        if (!result) {
            throw new RuntimeException("Ошибка при подтверждении бронирования");
        }
    }

    @Transactional
    public void cancelBooking(Long bookingId, Long userId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Бронирование не найдено"));
        
        Trip trip = booking.getTrip();
        if (!booking.getPassenger().getId().equals(userId) && !trip.getDriver().getId().equals(userId)) {
            throw new IllegalArgumentException("Вы не можете отменить это бронирование");
        }

        Boolean result = bookingRepository.cancelBooking(bookingId);
        if (!result) {
            throw new RuntimeException("Ошибка при отмене бронирования");
        }
    }

    @Transactional(readOnly = true)
    public List<Booking> getBookingsByPassenger(Long passengerId) {
        return bookingRepository.findByPassengerId(passengerId);
    }

    @Transactional(readOnly = true)
    public List<Booking> getBookingsByTrip(Long tripId) {
        return bookingRepository.findByTripId(tripId);
    }

    @Transactional(readOnly = true)
    public Booking getBookingById(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Бронирование не найдено"));
    }
}
