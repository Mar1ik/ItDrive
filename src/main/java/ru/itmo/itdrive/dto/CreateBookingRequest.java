package ru.itmo.itdrive.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class CreateBookingRequest {
    @NotNull(message = "ID поездки обязателен")
    @Positive(message = "ID поездки должен быть положительным")
    private Long tripId;

    @NotNull(message = "Метод оплаты обязателен")
    private String paymentMethod;

    @Positive(message = "Количество мест должно быть положительным")
    private Integer seats = 1;
}
