package ru.itmo.itdrive.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.itmo.itdrive.dto.CreateTripRequest;
import ru.itmo.itdrive.dto.TripSearchRequest;
import ru.itmo.itdrive.model.Building;
import ru.itmo.itdrive.model.Trip;
import ru.itmo.itdrive.repository.BuildingRepository;
import ru.itmo.itdrive.repository.TripRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TripService {
    
    private final TripRepository tripRepository;
    private final BuildingRepository buildingRepository;

    @Transactional
    public Trip createTrip(CreateTripRequest request, Long driverId) {
        Building fromBuilding = buildingRepository.findById(request.getFromBuildingId())
                .orElseThrow(() -> new IllegalArgumentException("Корпус отправления не найден"));
        
        Building toBuilding = buildingRepository.findById(request.getToBuildingId())
                .orElseThrow(() -> new IllegalArgumentException("Корпус назначения не найден"));
        
        if (fromBuilding.getId().equals(toBuilding.getId())) {
            throw new IllegalArgumentException("Корпуса отправления и назначения не могут совпадать");
        }

        // Время отправления устанавливается автоматически (текущее время + 1 час)
        LocalDateTime departureTime = LocalDateTime.now().plusHours(1);

        // Передаем пустую строку вместо null, чтобы PostgreSQL мог определить тип
        // Функция сама преобразует пустую строку в NULL
        String description = (request.getDescription() != null && !request.getDescription().trim().isEmpty())
                ? request.getDescription().trim()
                : "";

        Long tripId = tripRepository.createTrip(
                driverId,
                request.getFromBuildingId(),
                request.getToBuildingId(),
                departureTime,
                request.getMaxPassengers(),
                request.getPrice(),
                description
        );

        return tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Ошибка при создании поездки"));
    }

    @Transactional(readOnly = true)
    public List<Trip> getTripsByDriver(Long driverId) {
        return tripRepository.findByDriverId(driverId);
    }

    @Transactional(readOnly = true)
    public Trip getTripById(Long id) {
        return tripRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Поездка не найдена"));
    }

    @Transactional(readOnly = true)
    public List<Trip> searchTrips(TripSearchRequest request) {
        List<Trip> trips;
        
        if (request.getFromBuildingId() != null && request.getToBuildingId() != null) {
            trips = tripRepository.findByFromBuildingIdAndToBuildingId(
                    request.getFromBuildingId(),
                    request.getToBuildingId(),
                    Trip.TripStatus.SCHEDULED.name()
            );
        } else {
            trips = tripRepository.findByStatus(Trip.TripStatus.SCHEDULED.name());
        }

        // Фильтрация по времени отправления
        if (request.getDepartureTimeFrom() != null) {
            LocalDateTime from = request.getDepartureTimeFrom();
            trips = trips.stream()
                    .filter(t -> !t.getDepartureTime().isBefore(from))
                    .collect(Collectors.toList());
        }

        if (request.getDepartureTimeTo() != null) {
            LocalDateTime to = request.getDepartureTimeTo();
            trips = trips.stream()
                    .filter(t -> !t.getDepartureTime().isAfter(to))
                    .collect(Collectors.toList());
        }

        // Фильтрация по цене
        if (request.getMaxPrice() != null) {
            trips = trips.stream()
                    .filter(t -> t.getPrice().compareTo(java.math.BigDecimal.valueOf(request.getMaxPrice())) <= 0)
                    .collect(Collectors.toList());
        }

        return trips;
    }

    @Transactional
    public void startTrip(Long tripId, Long driverId) {
        Trip trip = getTripById(tripId);
        
        if (!trip.getDriver().getId().equals(driverId)) {
            throw new IllegalArgumentException("Только водитель может начать поездку");
        }
        
        if (trip.getStatus() != Trip.TripStatus.SCHEDULED) {
            throw new IllegalArgumentException("Поездка не может быть начата");
        }

        Boolean result = tripRepository.startTrip(tripId);
        if (!result) {
            throw new RuntimeException("Ошибка при начале поездки");
        }
    }

    @Transactional
    public void completeTrip(Long tripId, Long driverId) {
        Trip trip = getTripById(tripId);
        
        if (!trip.getDriver().getId().equals(driverId)) {
            throw new IllegalArgumentException("Только водитель может завершить поездку");
        }
        
        if (trip.getStatus() != Trip.TripStatus.IN_PROGRESS) {
            throw new IllegalArgumentException("Поездка должна быть в процессе");
        }

        Boolean result = tripRepository.completeTrip(tripId);
        if (!result) {
            throw new RuntimeException("Ошибка при завершении поездки");
        }
    }

    @Transactional
    public void cancelTrip(Long tripId, Long driverId) {
        Trip trip = getTripById(tripId);
        
        if (!trip.getDriver().getId().equals(driverId)) {
            throw new IllegalArgumentException("Только водитель может отменить поездку");
        }
        
        if (trip.getStatus() == Trip.TripStatus.COMPLETED || trip.getStatus() == Trip.TripStatus.CANCELLED) {
            throw new IllegalArgumentException("Невозможно отменить завершенную или уже отмененную поездку");
        }

        trip.setStatus(Trip.TripStatus.CANCELLED);
        tripRepository.save(trip);
    }
}
