package ru.itmo.itdrive.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.itmo.itdrive.dto.AuthenticationRequest;
import ru.itmo.itdrive.dto.AuthenticationResponse;
import ru.itmo.itdrive.dto.RegisterRequest;
import ru.itmo.itdrive.exception.UserBlockedException;
import ru.itmo.itdrive.model.User;
import ru.itmo.itdrive.util.JwtUtil;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {
    
    private final UserService userService;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthenticationResponse register(RegisterRequest request) {
        User user = userService.register(request);
        
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId());
        claims.put("role", user.getRole().name());
        
        UserDetails userDetails = userService.loadUserByUsername(user.getEmail());
        String token = jwtUtil.generateToken(userDetails, claims);
        
        return new AuthenticationResponse(
                token,
                user.getId(),
                user.getEmail(),
                user.getRole().name()
        );
    }

    @Transactional(readOnly = true)
    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );
        
        UserDetails userDetails = userService.loadUserByUsername(request.getEmail());
        User user = userService.getUserByEmail(request.getEmail());
        
        if (user.getIsBlocked()) {
            throw new UserBlockedException("Ваш аккаунт заблокирован. Обратитесь к администратору по адресу admin@itdrive.ru");
        }
        
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId());
        claims.put("role", user.getRole().name());
        
        String token = jwtUtil.generateToken(userDetails, claims);
        
        return new AuthenticationResponse(
                token,
                user.getId(),
                user.getEmail(),
                user.getRole().name()
        );
    }
}
