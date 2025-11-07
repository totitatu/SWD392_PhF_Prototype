package com.example.phfbackend.controller;

import com.example.phfbackend.dto.response.SystemLogResponse;
import com.example.phfbackend.entities.shared.SystemLog;
import com.example.phfbackend.service.SystemLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/system-logs")
@RequiredArgsConstructor
public class SystemLogController {
    
    private final SystemLogService systemLogService;
    
    @GetMapping
    public ResponseEntity<List<SystemLogResponse>> listSystemLogs(
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) UUID userId,
            @RequestParam(required = false) OffsetDateTime startDate,
            @RequestParam(required = false) OffsetDateTime endDate) {
        
        List<SystemLog> logs;
        
        if (startDate != null && endDate != null) {
            logs = systemLogService.findByDateRange(startDate, endDate);
        } else if (action != null) {
            logs = systemLogService.findByAction(action);
        } else if (entityType != null) {
            logs = systemLogService.findByEntityType(entityType);
        } else if (userId != null) {
            logs = systemLogService.findByUserId(userId);
        } else {
            logs = systemLogService.findAll();
        }
        
        List<SystemLogResponse> responses = logs.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(responses);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<SystemLogResponse> getSystemLog(@PathVariable UUID id) {
        return systemLogService.findById(id)
                .map(log -> ResponseEntity.ok(toResponse(log)))
                .orElse(ResponseEntity.notFound().build());
    }
    
    private SystemLogResponse toResponse(SystemLog log) {
        return SystemLogResponse.builder()
                .id(log.getId())
                .action(log.getAction())
                .entityType(log.getEntityType())
                .entityId(log.getEntityId())
                .userId(log.getUserId())
                .userName(log.getUserName())
                .details(log.getDetails())
                .createdAt(log.getCreatedAt())
                .build();
    }
}



