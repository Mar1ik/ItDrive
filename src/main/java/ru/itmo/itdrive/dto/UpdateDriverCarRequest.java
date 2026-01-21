package ru.itmo.itdrive.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class UpdateDriverCarRequest {
    @NotBlank(message = "Модель автомобиля обязательна")
    private String carModel;

    @NotBlank(message = "Номер автомобиля обязателен")
    private String carNumber;

    @NotNull(message = "Количество мест обязательно")
    @Positive(message = "Количество мест должно быть положительным")
    private Integer carSeats;

    private String carColor;
}
