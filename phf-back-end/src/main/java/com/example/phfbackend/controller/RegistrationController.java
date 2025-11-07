package com.example.phfbackend.controller;

import com.example.phfbackend.dto.request.RegistrationRequest;
import com.example.phfbackend.dto.response.UserResponse;
import com.example.phfbackend.entities.user.PharmacyUser;
import com.example.phfbackend.service.PharmacyUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class RegistrationController {
    
    private final PharmacyUserService userService;
    private final PasswordEncoder passwordEncoder;
    
    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegistrationRequest request) {
        // Check if user already exists
        if (userService.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("User with email " + request.getEmail() + " already exists");
        }
        
        // Hash password
        String passwordHash = passwordEncoder.encode(request.getPassword());
        
        PharmacyUser user = PharmacyUser.newBuilder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .passwordHash(passwordHash)
                .role(request.getRole())
                .active(true)
                .build();
        
        PharmacyUser created = userService.createUser(user);
        
        UserResponse response = UserResponse.builder()
                .id(created.getId())
                .fullName(created.getFullName())
                .email(created.getEmail())
                .role(created.getRole())
                .active(created.isActive())
                .createdAt(created.getCreatedAt())
                .updatedAt(created.getUpdatedAt())
                .build();
        
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}



