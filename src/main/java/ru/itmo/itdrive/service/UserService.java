package ru.itmo.itdrive.service;

import org.springframework.context.annotation.Lazy;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.itmo.itdrive.dto.RegisterRequest;
import ru.itmo.itdrive.model.User;
import ru.itmo.itdrive.repository.UserRepository;

import java.math.BigDecimal;

@Service
public class UserService implements UserDetailsService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, @Lazy PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Пользователь не найден: " + email));
        
        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPassword())
                .authorities(user.getRole().name())
                .build();
    }

    @Transactional
    public User register(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Пользователь с таким email уже существует");
        }

        String encodedPassword = passwordEncoder.encode(request.getPassword());
        
        // Преобразуем пустую строку в null для phoneNumber
        String phoneNumber = request.getPhoneNumber();
        if (phoneNumber != null && phoneNumber.trim().isEmpty()) {
            phoneNumber = null;
        }
        
        Long userId = userRepository.createUser(
                request.getEmail(),
                encodedPassword,
                request.getFirstName(),
                request.getLastName(),
                request.getRole(),
                phoneNumber
        );

        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Ошибка при создании пользователя"));
    }

    @Transactional(readOnly = true)
    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));
    }

    @Transactional(readOnly = true)
    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));
    }

    @Transactional
    public Double updateUserRating(Long userId) {
        BigDecimal newRating = userRepository.updateUserRating(userId);
        return newRating.doubleValue();
    }

    @Transactional
    public void blockUser(Long userId) {
        getUserById(userId); // Проверяем существование пользователя
        // Используем нативный SQL для обновления только is_blocked, чтобы избежать проблем с ENUM
        userRepository.updateUserBlockedStatus(userId, true);
    }

    @Transactional
    public void unblockUser(Long userId) {
        getUserById(userId); // Проверяем существование пользователя
        // Используем нативный SQL для обновления только is_blocked, чтобы избежать проблем с ENUM
        userRepository.updateUserBlockedStatus(userId, false);
    }
}
