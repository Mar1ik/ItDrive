package ru.itmo.itdrive.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import ru.itmo.itdrive.model.Trip;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TripRepository extends JpaRepository<Trip, Long> {
    List<Trip> findByDriverId(Long driverId);
    
    @Query(value = "SELECT * FROM public.trips WHERE status = CAST(:status AS public.trip_status)", nativeQuery = true)
    List<Trip> findByStatus(@Param("status") String status);
    
    @Query(value = "SELECT * FROM public.trips WHERE from_building_id = :fromId AND to_building_id = :toId AND status = CAST(:status AS public.trip_status)", nativeQuery = true)
    List<Trip> findByFromBuildingIdAndToBuildingId(@Param("fromId") Long fromId, 
                                                    @Param("toId") Long toId,
                                                    @Param("status") String status);
    
    @Query(value = "SELECT public.create_trip(:p_driver_id, :p_from_building_id, :p_to_building_id, CAST(:p_departure_time AS TIMESTAMP), :p_max_passengers, CAST(:p_price AS NUMERIC(10,2)), CAST(:p_description AS TEXT))", nativeQuery = true)
    Long createTrip(@Param("p_driver_id") Long driverId,
                    @Param("p_from_building_id") Long fromBuildingId,
                    @Param("p_to_building_id") Long toBuildingId,
                    @Param("p_departure_time") LocalDateTime departureTime,
                    @Param("p_max_passengers") Integer maxPassengers,
                    @Param("p_price") BigDecimal price,
                    @Param("p_description") String description);
    
    @Query(value = "SELECT public.start_trip(:p_trip_id)", nativeQuery = true)
    Boolean startTrip(@Param("p_trip_id") Long tripId);
    
    @Query(value = "SELECT public.complete_trip(:p_trip_id)", nativeQuery = true)
    Boolean completeTrip(@Param("p_trip_id") Long tripId);
}
