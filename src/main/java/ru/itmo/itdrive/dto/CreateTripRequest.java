package ru.itmo.itdrive.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateTripRequest {
    @NotNull(message = "Корпус отправления обязателен")
    @Positive(message = "ID корпуса должен быть положительным")
    private Long fromBuildingId;

    @NotNull(message = "Корпус назначения обязателен")
    @Positive(message = "ID корпуса должен быть положительным")
    private Long toBuildingId;

    @NotNull(message = "Количество мест обязательно")
    @Positive(message = "Количество мест должно быть положительным")
    private Integer maxPassengers;

    @NotNull(message = "Цена обязательна")
    @Positive(message = "Цена должна быть положительной")
    private BigDecimal price;

    private String description;
}
