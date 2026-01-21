package ru.itmo.itdrive.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.itmo.itdrive.dto.CreateBookingRequest;
import ru.itmo.itdrive.model.Booking;
import ru.itmo.itdrive.service.BookingService;
import ru.itmo.itdrive.service.UserService;
import ru.itmo.itdrive.util.SecurityUtil;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {
    
    private final BookingService bookingService;
    private final UserService userService;

    @PostMapping
    public ResponseEntity<Booking> createBooking(@Valid @RequestBody CreateBookingRequest request) {
        Long passengerId = SecurityUtil.getCurrentUserId(userService);
        if (passengerId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Booking booking = bookingService.createBooking(request, passengerId);
        return ResponseEntity.status(HttpStatus.CREATED).body(booking);
    }

    @GetMapping("/passenger/{passengerId}")
    public ResponseEntity<List<Booking>> getBookingsByPassenger(@PathVariable Long passengerId) {
        List<Booking> bookings = bookingService.getBookingsByPassenger(passengerId);
        return ResponseEntity.ok(bookings);
    }

    @GetMapping("/trip/{tripId}")
    public ResponseEntity<List<Booking>> getBookingsByTrip(@PathVariable Long tripId) {
        List<Booking> bookings = bookingService.getBookingsByTrip(tripId);
        return ResponseEntity.ok(bookings);
    }

    @PutMapping("/{id}/confirm")
    public ResponseEntity<Void> confirmBooking(@PathVariable Long id) {
        Long driverId = SecurityUtil.getCurrentUserId(userService);
        if (driverId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        bookingService.confirmBooking(id, driverId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancelBooking(@PathVariable Long id) {
        Long userId = SecurityUtil.getCurrentUserId(userService);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        bookingService.cancelBooking(id, userId);
        return ResponseEntity.ok().build();
    }
}
