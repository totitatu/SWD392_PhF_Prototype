package com.example.phfbackend.service;

import com.example.phfbackend.entities.shared.SystemLog;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SystemLogService {
    SystemLog createLog(SystemLog log);
    
    Optional<SystemLog> findById(UUID id);
    
    List<SystemLog> findAll();
    
    List<SystemLog> findByAction(String action);
    
    List<SystemLog> findByEntityType(String entityType);
    
    List<SystemLog> findByUserId(UUID userId);
    
    List<SystemLog> findByDateRange(OffsetDateTime startDate, OffsetDateTime endDate);
}
