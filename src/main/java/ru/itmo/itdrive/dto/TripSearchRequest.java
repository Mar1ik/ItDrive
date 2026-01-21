package ru.itmo.itdrive.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class TripSearchRequest {
    private Long fromBuildingId;
    private Long toBuildingId;
    private LocalDateTime departureTimeFrom;
    private LocalDateTime departureTimeTo;
    private Integer maxPrice;
}
