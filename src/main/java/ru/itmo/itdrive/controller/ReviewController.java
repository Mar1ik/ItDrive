package ru.itmo.itdrive.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.itmo.itdrive.dto.CreateReviewRequest;
import ru.itmo.itdrive.model.Review;
import ru.itmo.itdrive.service.ReviewService;
import ru.itmo.itdrive.service.UserService;
import ru.itmo.itdrive.util.SecurityUtil;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {
    
    private final ReviewService reviewService;
    private final UserService userService;

    @PostMapping
    public ResponseEntity<Review> createReview(@Valid @RequestBody CreateReviewRequest request) {
        Long reviewerId = SecurityUtil.getCurrentUserId(userService);
        if (reviewerId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Review review = reviewService.createReview(request, reviewerId);
        return ResponseEntity.status(HttpStatus.CREATED).body(review);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Review>> getReviewsByUser(@PathVariable Long userId) {
        List<Review> reviews = reviewService.getReviewsByUser(userId);
        return ResponseEntity.ok(reviews);
    }

    @GetMapping("/booking/{bookingId}/exists")
    public ResponseEntity<Boolean> checkReviewExists(@PathVariable Long bookingId) {
        Long userId = SecurityUtil.getCurrentUserId(userService);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Boolean exists = reviewService.reviewExists(bookingId, userId);
        return ResponseEntity.ok(exists);
    }
}
