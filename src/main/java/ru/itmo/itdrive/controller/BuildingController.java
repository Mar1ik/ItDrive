package ru.itmo.itdrive.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.itmo.itdrive.model.Building;
import ru.itmo.itdrive.repository.BuildingRepository;

import java.util.List;

@RestController
@RequestMapping("/api/buildings")
@RequiredArgsConstructor
public class BuildingController {

    private final BuildingRepository buildingRepository;

    @GetMapping
    public ResponseEntity<List<Building>> getAllBuildings() {
        // Всегда проверяем и добавляем недостающие корпуса и общежития
        initializeDefaultBuildings();
        
        List<Building> buildings = buildingRepository.findAll();
        return ResponseEntity.ok(buildings);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Building> getBuildingById(@PathVariable Long id) {
        return buildingRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    private void initializeDefaultBuildings() {
        // Создаем корпуса и общежития ITMO
        Building[] defaultBuildings = {
            // Учебные корпуса
            new Building(null, "Кронверкский пр., д. 49", 
                        "Кронверкский пр., д. 49, лит. А, Санкт-Петербург", 
                        59.9571, 30.3194),
            new Building(null, "Биржевая линия, д. 14-16", 
                        "Биржевая линия, д. 14-16, Санкт-Петербург", 
                        59.9452, 30.2869),
            new Building(null, "Ломоносова ул., д. 9", 
                        "Ломоносова ул., д. 9, лит. Б, Санкт-Петербург", 
                        59.9343, 30.3351),
            new Building(null, "Гривцова пер., д. 14-16", 
                        "Гривцова пер., д. 14-16, лит. А, Санкт-Петербург", 
                        59.9281, 30.3205),
            new Building(null, "Чайковского ул., д. 11/2", 
                        "Чайковского ул., д. 11/2, лит. А, Санкт-Петербург", 
                        59.9425, 30.3532),
            new Building(null, "Кадетская линия В.О., д. 3, к. 2", 
                        "Кадетская линия В.О., д. 3, к. 2, Санкт-Петербург", 
                        59.9435, 30.2908),
            new Building(null, "Газовая ул., д. 3", 
                        "Газовая ул., д. 3, Санкт-Петербург", 
                        59.9205, 30.3185),
            new Building(null, "Хрустальная ул., д. 14", 
                        "Хрустальная ул., д. 14, Санкт-Петербург", 
                        59.9634, 30.3724),
            new Building(null, "Малый пр. В.О., д. 5", 
                        "Малый пр. В.О., д. 5, Санкт-Петербург", 
                        59.9428, 30.2895),
            new Building(null, "Песочная наб., д. 14", 
                        "Песочная наб., д. 14, Санкт-Петербург", 
                        59.9558, 30.2956),
            
            // Общежития ИТМО
            new Building(null, "Общежитие Вяземский пер., д. 5-7", 
                        "Вяземский пер., д. 5-7, лит. А, Санкт-Петербург", 
                        59.9315, 30.3245),
            new Building(null, "Общежитие Ленсовета, д. 23", 
                        "ул. Ленсовета, д. 23, лит. А, Санкт-Петербург", 
                        59.8448, 30.3256),
            new Building(null, "Общежитие Белорусская, д. 6", 
                        "ул. Белорусская, д. 6, лит. А, Санкт-Петербург", 
                        59.9684, 30.3957),
            new Building(null, "Общежитие Альпийский пер., д. 15, к. 2", 
                        "Альпийский пер., д. 15, корп. 2, лит. А, Санкт-Петербург", 
                        59.9665, 30.3984),
            new Building(null, "Общежитие пр. Пятилеток, д. 13, к. 1", 
                        "пр. Пятилеток, д. 13, корп. 1, Санкт-Петербург", 
                        59.9678, 30.4021),
            new Building(null, "Общежитие пр. Большевиков, д. 77, к. 1", 
                        "пр. Большевиков, д. 77, корп. 1, Санкт-Петербург", 
                        59.9065, 30.4778),
            new Building(null, "Общежитие Бассейная, д. 8", 
                        "ул. Бассейная, д. 8 (МСГ), Санкт-Петербург", 
                        59.8445, 30.3287),
            new Building(null, "Общежитие Студенческая, д. 10", 
                        "ул. Студенческая, д. 10, Санкт-Петербург", 
                        59.8442, 30.3312),
            new Building(null, "Общежитие Ботаническая, д. 66, к. 2", 
                        "Ботаническая ул., д. 66, корп. 2, 3, Петергоф", 
                        59.8745, 29.8987),
            new Building(null, "Общежитие Новоизмайловский пр., д. 16", 
                        "Новоизмайловский пр., д. 16 (МСГ), Санкт-Петербург", 
                        59.8401, 30.3354)
        };

        for (Building building : defaultBuildings) {
            if (!buildingRepository.findByName(building.getName()).isPresent()) {
                buildingRepository.save(building);
            }
        }
    }
}
