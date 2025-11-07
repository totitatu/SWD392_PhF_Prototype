package com.example.phfbackend.service;

import com.example.phfbackend.dto.InventoryFilterCriteria;
import com.example.phfbackend.entities.inventory.InventoryBatch;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InventoryBatchService {
    InventoryBatch createBatch(InventoryBatch batch);
    
    Optional<InventoryBatch> findById(UUID id);
    
    List<InventoryBatch> findByProductId(UUID productId);
    
    List<InventoryBatch> findAvailableBatchesByProductOrderByExpiry(UUID productId);
    
    List<InventoryBatch> findExpiringSoon(LocalDate thresholdDate);
    
    List<InventoryBatch> findExpired(LocalDate asOfDate);
    
    List<InventoryBatch> findAll();
    
    List<InventoryBatch> search(String term);
    
    List<InventoryBatch> filterInventoryBatches(InventoryFilterCriteria criteria);
    
    InventoryBatch receiveAdditionalQuantity(UUID id, int quantity);
    
    InventoryBatch deductQuantity(UUID id, int quantity);
    
    InventoryBatch updateBatch(UUID id, InventoryBatch updatedBatch);
    
    void deactivateBatch(UUID id);
    
    void activateBatch(UUID id);
}
