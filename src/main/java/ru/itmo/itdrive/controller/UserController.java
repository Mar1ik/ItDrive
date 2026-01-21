package ru.itmo.itdrive.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.itmo.itdrive.model.User;
import ru.itmo.itdrive.repository.UserRepository;
import ru.itmo.itdrive.service.UserService;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    
    private final UserService userService;
    private final UserRepository userRepository;

    @GetMapping("/{id}")
    public ResponseEntity<User> getUser(@PathVariable Long id) {
        User user = userService.getUserById(id);
        return ResponseEntity.ok(user);
    }

    @PutMapping("/{id}/role")
    public ResponseEntity<User> changeRole(@PathVariable Long id, @RequestParam String role) {
        User user = userService.getUserById(id);
        try {
            user.setRole(User.UserRole.valueOf(role.toUpperCase()));
            userRepository.save(user);
            return ResponseEntity.ok(user);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
