package ru.itmo.itdrive.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DriverStatisticsResponse {
    private Long totalTrips;
    private Long completedTrips;
    private Long cancelledTrips;
    private Long totalPassengers;
    private BigDecimal totalEarnings;
    private Double averageRating;
    private Integer totalTripsCount;
}
