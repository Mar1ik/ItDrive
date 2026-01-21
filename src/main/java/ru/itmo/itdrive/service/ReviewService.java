package ru.itmo.itdrive.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.itmo.itdrive.dto.CreateReviewRequest;
import ru.itmo.itdrive.model.Booking;
import ru.itmo.itdrive.model.Review;
import ru.itmo.itdrive.repository.BookingRepository;
import ru.itmo.itdrive.repository.ReviewRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {
    
    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;

    @Transactional
    public Review createReview(CreateReviewRequest request, Long reviewerId) {
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new IllegalArgumentException("Бронирование не найдено"));
        
        if (!booking.getStatus().equals(Booking.BookingStatus.COMPLETED)) {
            throw new IllegalArgumentException("Отзыв можно оставить только после завершения поездки");
        }

        // Определяем, о ком отзыв (водитель о пассажире или пассажир о водителе)
        Long reviewedId;
        if (booking.getTrip().getDriver().getId().equals(reviewerId)) {
            reviewedId = booking.getPassenger().getId();
        } else if (booking.getPassenger().getId().equals(reviewerId)) {
            reviewedId = booking.getTrip().getDriver().getId();
        } else {
            throw new IllegalArgumentException("Вы не можете оставить отзыв для этой поездки");
        }

        // Проверка, что отзыв еще не оставлен
        if (reviewRepository.findByBookingIdAndReviewerId(request.getBookingId(), reviewerId).isPresent()) {
            throw new IllegalArgumentException("Вы уже оставили отзыв для этой поездки");
        }

        // Убеждаемся, что comment не null (для корректной работы с PostgreSQL)
        String comment = (request.getComment() != null && !request.getComment().trim().isEmpty())
                ? request.getComment().trim()
                : "";

        Long reviewId = reviewRepository.createReview(
                request.getBookingId(),
                reviewerId,
                reviewedId,
                request.getRating(),
                comment
        );

        // Рейтинг обновляется автоматически в функции create_review

        return reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Ошибка при создании отзыва"));
    }

    @Transactional(readOnly = true)
    public List<Review> getReviewsByUser(Long userId) {
        return reviewRepository.findByReviewedId(userId);
    }

    @Transactional(readOnly = true)
    public Review getReviewById(Long id) {
        return reviewRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Отзыв не найден"));
    }

    @Transactional(readOnly = true)
    public Boolean reviewExists(Long bookingId, Long reviewerId) {
        return reviewRepository.findByBookingIdAndReviewerId(bookingId, reviewerId).isPresent();
    }
}
