package com.example.phfbackend.service.impl;

import com.example.phfbackend.entities.shared.SystemLog;
import com.example.phfbackend.repository.SystemLogRepository;
import com.example.phfbackend.service.SystemLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class SystemLogServiceImpl implements SystemLogService {
    
    private final SystemLogRepository systemLogRepository;
    
    @Override
    public SystemLog createLog(SystemLog log) {
        return systemLogRepository.save(log);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Optional<SystemLog> findById(UUID id) {
        return systemLogRepository.findById(id);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<SystemLog> findAll() {
        return systemLogRepository.findAllOrderByCreatedAtDesc();
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<SystemLog> findByAction(String action) {
        return systemLogRepository.findByAction(action);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<SystemLog> findByEntityType(String entityType) {
        return systemLogRepository.findByEntityType(entityType);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<SystemLog> findByUserId(UUID userId) {
        return systemLogRepository.findByUserId(userId);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<SystemLog> findByDateRange(OffsetDateTime startDate, OffsetDateTime endDate) {
        return systemLogRepository.findByCreatedAtBetween(startDate, endDate);
    }
}





