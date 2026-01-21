package ru.itmo.itdrive.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import ru.itmo.itdrive.model.Review;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByReviewedId(Long reviewedId);
    
    List<Review> findByBookingId(Long bookingId);
    
    Optional<Review> findByBookingIdAndReviewerId(Long bookingId, Long reviewerId);
    
    @Query(value = "SELECT public.create_review(:p_booking_id, :p_reviewer_id, :p_reviewed_id, :p_rating, CAST(:p_comment AS TEXT))", nativeQuery = true)
    Long createReview(@Param("p_booking_id") Long bookingId,
                     @Param("p_reviewer_id") Long reviewerId,
                     @Param("p_reviewed_id") Long reviewedId,
                     @Param("p_rating") Integer rating,
                     @Param("p_comment") String comment);
}
