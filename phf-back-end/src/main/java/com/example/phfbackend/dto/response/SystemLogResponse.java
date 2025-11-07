package com.example.phfbackend.dto;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class SystemLogResponse {
    private UUID id;
    private String action;
    private String entityType;
    private UUID entityId;
    private UUID userId;
    private String userName;
    private String details;
    private OffsetDateTime createdAt;
}


