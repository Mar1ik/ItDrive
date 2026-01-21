package ru.itmo.itdrive.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import ru.itmo.itdrive.repository.UserRepository;

@Component
@RequiredArgsConstructor
public class AdminInitializer {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @PostConstruct
    @Transactional
    public void initializeAdmin() {
        // Проверяем, существует ли уже администратор
        if (userRepository.findByEmail("admin@itdrive.ru").isEmpty()) {
            // Создаем дефолтного администратора
            String encodedPassword = passwordEncoder.encode("admin123");
            
            userRepository.createUser(
                    "admin@itdrive.ru",
                    encodedPassword,
                    "Администратор",
                    "Системы",
                    "ADMIN",
                    null
            );
            
            System.out.println("==========================================");
            System.out.println("Администратор создан:");
            System.out.println("Email: admin@itdrive.ru");
            System.out.println("Пароль: admin123");
            System.out.println("==========================================");
        }
    }
}
