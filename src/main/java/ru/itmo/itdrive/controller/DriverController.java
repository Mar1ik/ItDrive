package ru.itmo.itdrive.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.itmo.itdrive.dto.UpdateDriverCarRequest;
import ru.itmo.itdrive.model.Driver;
import ru.itmo.itdrive.service.DriverService;
import ru.itmo.itdrive.service.UserService;
import ru.itmo.itdrive.util.SecurityUtil;

@RestController
@RequestMapping("/api/driver")
@RequiredArgsConstructor
public class DriverController {

    private final DriverService driverService;
    private final UserService userService;

    @GetMapping("/car")
    public ResponseEntity<Driver> getDriverCar() {
        Long userId = SecurityUtil.getCurrentUserId(userService);
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }
        try {
            Driver driver = driverService.getDriverByUserId(userId);
            return ResponseEntity.ok(driver);
        } catch (IllegalArgumentException e) {
            // Если записи нет, создаем дефолтную
            Driver driver = driverService.getOrCreateDriver(userId);
            return ResponseEntity.ok(driver);
        }
    }

    @PutMapping("/car")
    public ResponseEntity<Driver> updateDriverCar(@RequestBody UpdateDriverCarRequest request) {
        Long userId = SecurityUtil.getCurrentUserId(userService);
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }
        Driver driver = driverService.updateDriverCar(userId, request);
        return ResponseEntity.ok(driver);
    }
}
