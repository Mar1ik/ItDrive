package ru.itmo.itdrive.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.itmo.itdrive.dto.RouteStatisticsResponse;
import ru.itmo.itdrive.dto.StatisticsResponse;
import ru.itmo.itdrive.model.Review;
import ru.itmo.itdrive.model.User;
import ru.itmo.itdrive.service.AdminService;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {
    
    private final AdminService adminService;

    @GetMapping("/statistics")
    public ResponseEntity<StatisticsResponse> getStatistics(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        StatisticsResponse statistics = adminService.getStatistics(startDate, endDate);
        return ResponseEntity.ok(statistics);
    }

    @GetMapping("/routes/popular")
    public ResponseEntity<List<RouteStatisticsResponse>> getPopularRoutes(
            @RequestParam(defaultValue = "10") Integer limit
    ) {
        List<RouteStatisticsResponse> routes = adminService.getPopularRoutes(limit);
        return ResponseEntity.ok(routes);
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = adminService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    @PutMapping("/users/{id}/block")
    public ResponseEntity<Void> blockUser(@PathVariable Long id) {
        adminService.blockUser(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/users/{id}/unblock")
    public ResponseEntity<Void> unblockUser(@PathVariable Long id) {
        adminService.unblockUser(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/reviews")
    public ResponseEntity<List<Review>> getAllReviews() {
        List<Review> reviews = adminService.getAllReviews();
        return ResponseEntity.ok(reviews);
    }
}
