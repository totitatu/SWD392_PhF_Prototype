package com.example.phfbackend.repository;

import com.example.phfbackend.entities.inventory.InventoryBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface InventoryBatchRepository extends JpaRepository<InventoryBatch, UUID> {
    List<InventoryBatch> findByProductId(UUID productId);
    
    @Query("SELECT b FROM InventoryBatch b WHERE b.product.id = :productId AND b.quantityOnHand > 0 ORDER BY b.expiryDate ASC")
    List<InventoryBatch> findAvailableBatchesByProductOrderByExpiry(@Param("productId") UUID productId);
    
    @Query("SELECT b FROM InventoryBatch b WHERE b.expiryDate <= :thresholdDate AND b.quantityOnHand > 0")
    List<InventoryBatch> findExpiringSoon(@Param("thresholdDate") LocalDate thresholdDate);
    
    @Query("SELECT b FROM InventoryBatch b WHERE b.expiryDate < :asOfDate AND b.quantityOnHand > 0")
    List<InventoryBatch> findExpired(@Param("asOfDate") LocalDate asOfDate);
    
    @Query("SELECT b FROM InventoryBatch b WHERE b.product.id = :productId AND b.quantityOnHand <= :threshold")
    List<InventoryBatch> findLowStockBatches(@Param("productId") UUID productId, @Param("threshold") int threshold);
    
    @Query("SELECT b FROM InventoryBatch b WHERE b.batchNumber LIKE %:term% OR b.product.name LIKE %:term%")
    List<InventoryBatch> searchByBatchNumberOrProductName(@Param("term") String term);
}


