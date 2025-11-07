package com.example.phfbackend.controller;

import com.example.phfbackend.dto.UserFilterCriteria;
import com.example.phfbackend.dto.request.UserRequest;
import com.example.phfbackend.dto.response.UserResponse;
import com.example.phfbackend.entities.user.PharmacyUser;
import com.example.phfbackend.entities.user.UserRole;
import com.example.phfbackend.service.PharmacyUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class PharmacyUserController {
    
    private final PharmacyUserService userService;
    
    @GetMapping
    public ResponseEntity<List<UserResponse>> listUsers(
            @RequestParam(required = false) String searchTerm,
            @RequestParam(required = false) UserRole role,
            @RequestParam(required = false) Boolean active) {
        UserFilterCriteria criteria = UserFilterCriteria.builder()
                .searchTerm(searchTerm)
                .role(role)
                .active(active)
                .build();
        
        List<PharmacyUser> users = criteria.getSearchTerm() != null && !criteria.getSearchTerm().trim().isEmpty()
                ? userService.search(criteria.getSearchTerm())
                : (criteria.getRole() != null || criteria.getActive() != null
                        ? userService.filterUsers(criteria)
                        : userService.findAll());
        
        List<UserResponse> responses = users.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(responses);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUser(@PathVariable UUID id) {
        return userService.findById(id)
                .map(user -> ResponseEntity.ok(toResponse(user)))
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody UserRequest request) {
        PharmacyUser user = PharmacyUser.newBuilder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .passwordHash(request.getPasswordHash())
                .role(request.getRole())
                .active(request.getActive() != null ? request.getActive() : true)
                .build();
        
        PharmacyUser created = userService.createUser(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(created));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> updateUser(@PathVariable UUID id, @Valid @RequestBody UserRequest request) {
        PharmacyUser updatedUser = PharmacyUser.newBuilder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .passwordHash(request.getPasswordHash())
                .role(request.getRole())
                .active(request.getActive())
                .build();
        
        PharmacyUser user = userService.updateUser(id, updatedUser);
        return ResponseEntity.ok(toResponse(user));
    }
    
    @DeleteMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivateUser(@PathVariable UUID id) {
        userService.deactivateUser(id);
        return ResponseEntity.noContent().build();
    }
    
    private UserResponse toResponse(PharmacyUser user) {
        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole())
                .active(user.isActive())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}


