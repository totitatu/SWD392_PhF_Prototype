package com.example.phfbackend.repository;

import com.example.phfbackend.entities.inventory.InventoryAdjustment;
import com.example.phfbackend.entities.inventory.InventoryAdjustmentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface InventoryAdjustmentRepository extends JpaRepository<InventoryAdjustment, UUID> {
    List<InventoryAdjustment> findByProductId(UUID productId);
    
    List<InventoryAdjustment> findByType(InventoryAdjustmentType type);
    
    List<InventoryAdjustment> findByPerformedById(UUID userId);
    
    @Query("SELECT a FROM InventoryAdjustment a WHERE a.createdAt BETWEEN :startDate AND :endDate ORDER BY a.createdAt DESC")
    List<InventoryAdjustment> findByCreatedAtBetween(@Param("startDate") OffsetDateTime startDate, @Param("endDate") OffsetDateTime endDate);
}




