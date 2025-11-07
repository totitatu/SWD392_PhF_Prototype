package com.example.phfbackend.repository;

import com.example.phfbackend.entities.shared.SystemLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface SystemLogRepository extends JpaRepository<SystemLog, UUID> {
    List<SystemLog> findByAction(String action);
    
    List<SystemLog> findByEntityType(String entityType);
    
    List<SystemLog> findByUserId(UUID userId);
    
    @Query("SELECT l FROM SystemLog l WHERE l.createdAt BETWEEN :startDate AND :endDate ORDER BY l.createdAt DESC")
    List<SystemLog> findByCreatedAtBetween(@Param("startDate") OffsetDateTime startDate, @Param("endDate") OffsetDateTime endDate);
    
    @Query("SELECT l FROM SystemLog l ORDER BY l.createdAt DESC")
    List<SystemLog> findAllOrderByCreatedAtDesc();
}



