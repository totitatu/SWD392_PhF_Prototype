package com.example.phfbackend.dto;

import com.example.phfbackend.entities.user.UserRole;
import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class UserResponse {
    private UUID id;
    private String fullName;
    private String email;
    private UserRole role;
    private boolean active;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}


