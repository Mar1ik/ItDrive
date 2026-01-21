package ru.itmo.itdrive.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StatisticsResponse {
    private Long totalTrips;
    private Long completedTrips;
    private Long totalPassengers;
    private BigDecimal totalRevenue;
}
