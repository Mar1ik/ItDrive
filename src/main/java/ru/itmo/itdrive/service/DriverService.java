package ru.itmo.itdrive.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.itmo.itdrive.dto.UpdateDriverCarRequest;
import ru.itmo.itdrive.model.Driver;
import ru.itmo.itdrive.model.User;
import ru.itmo.itdrive.repository.DriverRepository;
import ru.itmo.itdrive.repository.UserRepository;

@Service
@RequiredArgsConstructor
public class DriverService {

    private final DriverRepository driverRepository;
    private final UserRepository userRepository;

    @Transactional
    public Driver getOrCreateDriver(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));

        if (user.getRole() != User.UserRole.DRIVER) {
            throw new IllegalArgumentException("Пользователь не является водителем");
        }

        return driverRepository.findByUserId(userId)
                .orElseGet(() -> {
                    // Создаем запись водителя, если ее нет
                    Driver driver = new Driver();
                    driver.setUser(user);
                    driver.setCarModel("Не указано");
                    driver.setCarNumber("Не указано");
                    driver.setCarSeats(4);
                    driver.setCarColor(null);
                    return driverRepository.save(driver);
                });
    }

    @Transactional
    public Driver updateDriverCar(Long userId, UpdateDriverCarRequest request) {
        Driver driver = getOrCreateDriver(userId);

        driver.setCarModel(request.getCarModel());
        driver.setCarNumber(request.getCarNumber());
        driver.setCarSeats(request.getCarSeats());
        driver.setCarColor(request.getCarColor());

        return driverRepository.save(driver);
    }

    @Transactional(readOnly = true)
    public Driver getDriverByUserId(Long userId) {
        return driverRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Информация о водителе не найдена"));
    }
}
