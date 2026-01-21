package ru.itmo.itdrive.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import ru.itmo.itdrive.model.Booking;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByTripId(Long tripId);
    
    List<Booking> findByPassengerId(Long passengerId);
    
    Optional<Booking> findByTripIdAndPassengerId(Long tripId, Long passengerId);
    
    @Query(value = "SELECT public.create_booking(:p_trip_id, :p_passenger_id, CAST(:p_price AS NUMERIC(10,2)), CAST(:p_payment_method AS VARCHAR(50)), CAST(:p_seats AS INTEGER))", nativeQuery = true)
    Long createBooking(@Param("p_trip_id") Long tripId,
                      @Param("p_passenger_id") Long passengerId,
                      @Param("p_price") BigDecimal price,
                      @Param("p_payment_method") String paymentMethod,
                      @Param("p_seats") Integer seats);
    
    @Query(value = "SELECT public.confirm_booking(:p_booking_id)", nativeQuery = true)
    Boolean confirmBooking(@Param("p_booking_id") Long bookingId);
    
    @Query(value = "SELECT public.cancel_booking(:p_booking_id)", nativeQuery = true)
    Boolean cancelBooking(@Param("p_booking_id") Long bookingId);
}
