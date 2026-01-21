package ru.itmo.itdrive.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class CreateReviewRequest {
    @NotNull(message = "ID бронирования обязателен")
    @Positive(message = "ID бронирования должен быть положительным")
    private Long bookingId;

    @NotNull(message = "Рейтинг обязателен")
    @Min(value = 1, message = "Рейтинг должен быть от 1 до 5")
    @Max(value = 5, message = "Рейтинг должен быть от 1 до 5")
    private Integer rating;

    private String comment;
}
