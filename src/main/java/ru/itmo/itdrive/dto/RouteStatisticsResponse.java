package ru.itmo.itdrive.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RouteStatisticsResponse {
    private String fromBuildingName;
    private String toBuildingName;
    private Long tripCount;
}
