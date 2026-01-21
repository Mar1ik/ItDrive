package ru.itmo.itdrive.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.itmo.itdrive.dto.RouteStatisticsResponse;
import ru.itmo.itdrive.dto.StatisticsResponse;
import ru.itmo.itdrive.model.Review;
import ru.itmo.itdrive.model.User;
import ru.itmo.itdrive.repository.ReviewRepository;
import ru.itmo.itdrive.repository.StatisticsRepository;
import ru.itmo.itdrive.repository.UserRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {
    
    private final StatisticsRepository statisticsRepository;
    private final UserRepository userRepository;
    private final UserService userService;
    private final ReviewRepository reviewRepository;

    @Transactional(readOnly = true)
    public StatisticsResponse getStatistics(LocalDate startDate, LocalDate endDate) {
        StatisticsRepository.TripStatisticsResult result = 
                statisticsRepository.getTripStatistics(startDate, endDate);
        
        return new StatisticsResponse(
                result.getTotalTrips(),
                result.getCompletedTrips(),
                result.getTotalPassengers(),
                result.getTotalRevenue()
        );
    }

    @Transactional(readOnly = true)
    public List<RouteStatisticsResponse> getPopularRoutes(Integer limit) {
        List<StatisticsRepository.PopularRouteResult> results = 
                statisticsRepository.getPopularRoutes(limit != null ? limit : 10);
        
        return results.stream()
                .map(r -> new RouteStatisticsResponse(
                        r.getFromBuildingName(),
                        r.getToBuildingName(),
                        r.getTripCount()
                ))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Transactional
    public void blockUser(Long userId) {
        userService.blockUser(userId);
    }

    @Transactional
    public void unblockUser(Long userId) {
        userService.unblockUser(userId);
    }

    @Transactional(readOnly = true)
    public List<Review> getAllReviews() {
        return reviewRepository.findAll();
    }
}
