package ru.itmo.itdrive.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserStatisticsResponse {
    private Long totalBookings;
    private Long completedBookings;
    private Long cancelledBookings;
    private BigDecimal totalSpent;
    private Double averageRating;
    private Integer totalTrips;
}
