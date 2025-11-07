package com.example.phfbackend.service;

import com.example.phfbackend.entities.inventory.InventoryBatch;
import com.example.phfbackend.repository.InventoryBatchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class InventoryBatchService {
    
    private final InventoryBatchRepository inventoryBatchRepository;
    
    public InventoryBatch createBatch(InventoryBatch batch) {
        return inventoryBatchRepository.save(batch);
    }
    
    @Transactional(readOnly = true)
    public Optional<InventoryBatch> findById(UUID id) {
        return inventoryBatchRepository.findById(id);
    }
    
    @Transactional(readOnly = true)
    public List<InventoryBatch> findByProductId(UUID productId) {
        return inventoryBatchRepository.findByProductId(productId);
    }
    
    @Transactional(readOnly = true)
    public List<InventoryBatch> findAvailableBatchesByProductOrderByExpiry(UUID productId) {
        return inventoryBatchRepository.findAvailableBatchesByProductOrderByExpiry(productId);
    }
    
    @Transactional(readOnly = true)
    public List<InventoryBatch> findExpiringSoon(LocalDate thresholdDate) {
        return inventoryBatchRepository.findExpiringSoon(thresholdDate);
    }
    
    @Transactional(readOnly = true)
    public List<InventoryBatch> findExpired(LocalDate asOfDate) {
        return inventoryBatchRepository.findExpired(asOfDate);
    }
    
    @Transactional(readOnly = true)
    public List<InventoryBatch> search(String term) {
        return inventoryBatchRepository.searchByBatchNumberOrProductName(term);
    }
    
    public InventoryBatch receiveAdditionalQuantity(UUID id, int quantity) {
        InventoryBatch batch = inventoryBatchRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Inventory batch not found: " + id));
        batch.receiveAdditionalQuantity(quantity);
        return inventoryBatchRepository.save(batch);
    }
    
    public InventoryBatch deductQuantity(UUID id, int quantity) {
        InventoryBatch batch = inventoryBatchRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Inventory batch not found: " + id));
        batch.deductQuantity(quantity);
        return inventoryBatchRepository.save(batch);
    }
}


