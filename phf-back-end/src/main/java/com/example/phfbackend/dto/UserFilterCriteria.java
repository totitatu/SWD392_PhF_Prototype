package com.example.phfbackend.dto;

import com.example.phfbackend.entities.user.UserRole;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserFilterCriteria {
    private String searchTerm;
    private UserRole role;
    private Boolean active;
}


