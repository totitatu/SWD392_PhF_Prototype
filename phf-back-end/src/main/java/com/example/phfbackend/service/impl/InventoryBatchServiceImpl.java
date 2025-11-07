package com.example.phfbackend.service.impl;

import com.example.phfbackend.dto.InventoryFilterCriteria;
import com.example.phfbackend.entities.inventory.InventoryBatch;
import com.example.phfbackend.repository.InventoryBatchRepository;
import com.example.phfbackend.service.InventoryBatchService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Transactional
public class InventoryBatchServiceImpl implements InventoryBatchService {
    
    private final InventoryBatchRepository inventoryBatchRepository;
    
    @Override
    public InventoryBatch createBatch(InventoryBatch batch) {
        return inventoryBatchRepository.save(batch);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Optional<InventoryBatch> findById(UUID id) {
        return inventoryBatchRepository.findById(id);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<InventoryBatch> findByProductId(UUID productId) {
        return inventoryBatchRepository.findByProductId(productId);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<InventoryBatch> findAvailableBatchesByProductOrderByExpiry(UUID productId) {
        return inventoryBatchRepository.findAvailableBatchesByProductOrderByExpiry(productId);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<InventoryBatch> findExpiringSoon(LocalDate thresholdDate) {
        return inventoryBatchRepository.findExpiringSoon(thresholdDate);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<InventoryBatch> findExpired(LocalDate asOfDate) {
        return inventoryBatchRepository.findExpired(asOfDate);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<InventoryBatch> findAll() {
        return inventoryBatchRepository.findAll();
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<InventoryBatch> search(String term) {
        return inventoryBatchRepository.searchByBatchNumberOrProductName(term);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<InventoryBatch> filterInventoryBatches(InventoryFilterCriteria criteria) {
        Stream<InventoryBatch> stream = inventoryBatchRepository.findAll().stream();
        
        if (criteria.getSearchTerm() != null && !criteria.getSearchTerm().trim().isEmpty()) {
            String term = criteria.getSearchTerm().trim().toLowerCase();
            stream = stream.filter(batch -> 
                batch.getBatchNumber().toLowerCase().contains(term) ||
                batch.getProduct().getName().toLowerCase().contains(term)
            );
        }
        
        if (criteria.getProductId() != null) {
            stream = stream.filter(batch -> batch.getProduct().getId().equals(criteria.getProductId()));
        }
        
        if (criteria.getActive() != null) {
            stream = stream.filter(batch -> batch.isActive() == criteria.getActive());
        }
        
        return stream.toList();
    }
    
    @Override
    public InventoryBatch receiveAdditionalQuantity(UUID id, int quantity) {
        InventoryBatch batch = inventoryBatchRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Inventory batch not found: " + id));
        batch.receiveAdditionalQuantity(quantity);
        return inventoryBatchRepository.save(batch);
    }
    
    @Override
    public InventoryBatch deductQuantity(UUID id, int quantity) {
        InventoryBatch batch = inventoryBatchRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Inventory batch not found: " + id));
        batch.deductQuantity(quantity);
        return inventoryBatchRepository.save(batch);
    }
    
    @Override
    public InventoryBatch updateBatch(UUID id, InventoryBatch updatedBatch) {
        InventoryBatch batch = inventoryBatchRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Inventory batch not found: " + id));
        if (updatedBatch.getSellingPrice() != null) {
            batch.updateSellingPrice(updatedBatch.getSellingPrice());
        }
        return inventoryBatchRepository.save(batch);
    }
    
    @Override
    public void deactivateBatch(UUID id) {
        InventoryBatch batch = inventoryBatchRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Inventory batch not found: " + id));
        batch.deactivate();
        inventoryBatchRepository.save(batch);
    }
    
    @Override
    public void activateBatch(UUID id) {
        InventoryBatch batch = inventoryBatchRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Inventory batch not found: " + id));
        batch.activate();
        inventoryBatchRepository.save(batch);
    }
}


