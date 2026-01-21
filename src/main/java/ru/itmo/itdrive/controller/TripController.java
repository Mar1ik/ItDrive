package ru.itmo.itdrive.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.itmo.itdrive.dto.CreateTripRequest;
import ru.itmo.itdrive.dto.TripSearchRequest;
import ru.itmo.itdrive.model.Trip;
import ru.itmo.itdrive.service.TripService;
import ru.itmo.itdrive.service.UserService;
import ru.itmo.itdrive.util.SecurityUtil;

import java.util.List;

@RestController
@RequestMapping("/api/trips")
@RequiredArgsConstructor
public class TripController {
    
    private final TripService tripService;
    private final UserService userService;

    @PostMapping
    public ResponseEntity<Trip> createTrip(@Valid @RequestBody CreateTripRequest request) {
        Long driverId = SecurityUtil.getCurrentUserId(userService);
        if (driverId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Trip trip = tripService.createTrip(request, driverId);
        return ResponseEntity.status(HttpStatus.CREATED).body(trip);
    }

    @GetMapping
    public ResponseEntity<List<Trip>> searchTrips(@ModelAttribute TripSearchRequest request) {
        List<Trip> trips = tripService.searchTrips(request);
        return ResponseEntity.ok(trips);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Trip> getTrip(@PathVariable Long id) {
        Trip trip = tripService.getTripById(id);
        return ResponseEntity.ok(trip);
    }

    @GetMapping("/driver/{driverId}")
    public ResponseEntity<List<Trip>> getDriverTrips(@PathVariable Long driverId) {
        List<Trip> trips = tripService.getTripsByDriver(driverId);
        return ResponseEntity.ok(trips);
    }

    @PutMapping("/{id}/start")
    public ResponseEntity<Void> startTrip(@PathVariable Long id) {
        Long driverId = SecurityUtil.getCurrentUserId(userService);
        if (driverId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        tripService.startTrip(id, driverId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<Void> completeTrip(@PathVariable Long id) {
        Long driverId = SecurityUtil.getCurrentUserId(userService);
        if (driverId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        tripService.completeTrip(id, driverId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancelTrip(@PathVariable Long id) {
        Long driverId = SecurityUtil.getCurrentUserId(userService);
        if (driverId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        tripService.cancelTrip(id, driverId);
        return ResponseEntity.ok().build();
    }
}
