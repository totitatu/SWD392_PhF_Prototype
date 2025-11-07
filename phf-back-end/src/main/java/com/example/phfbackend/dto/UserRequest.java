package com.example.phfbackend.dto;

import com.example.phfbackend.entities.user.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UserRequest {
    @NotBlank(message = "Full name is required")
    private String fullName;
    
    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;
    
    private String passwordHash;
    
    @NotNull(message = "Role is required")
    private UserRole role;
    
    private Boolean active;
}


