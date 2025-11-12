package com.example.phfbackend.repository;

import com.example.phfbackend.entities.inventory.InventoryBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InventoryBatchRepository extends JpaRepository<InventoryBatch, UUID> {
    @Query("SELECT b FROM InventoryBatch b JOIN FETCH b.product WHERE b.product.id = :productId")
    List<InventoryBatch> findByProductId(@Param("productId") UUID productId);
    
    @Query("SELECT b FROM InventoryBatch b JOIN FETCH b.product WHERE b.product.id = :productId AND b.quantityOnHand > 0 AND b.active = true AND b.expiryDate >= :currentDate ORDER BY b.expiryDate ASC")
    List<InventoryBatch> findAvailableBatchesByProductOrderByExpiry(@Param("productId") UUID productId, @Param("currentDate") LocalDate currentDate);
    
    @Query("SELECT b FROM InventoryBatch b JOIN FETCH b.product WHERE b.expiryDate <= :thresholdDate AND b.quantityOnHand > 0")
    List<InventoryBatch> findExpiringSoon(@Param("thresholdDate") LocalDate thresholdDate);
    
    @Query("SELECT b FROM InventoryBatch b JOIN FETCH b.product WHERE b.expiryDate < :asOfDate AND b.quantityOnHand > 0")
    List<InventoryBatch> findExpired(@Param("asOfDate") LocalDate asOfDate);
    
    @Query("SELECT b FROM InventoryBatch b JOIN FETCH b.product WHERE b.product.id = :productId AND b.quantityOnHand <= :threshold")
    List<InventoryBatch> findLowStockBatches(@Param("productId") UUID productId, @Param("threshold") int threshold);
    
    @Query("SELECT b FROM InventoryBatch b JOIN FETCH b.product WHERE b.batchNumber LIKE CONCAT('%', :term, '%') OR b.product.name LIKE CONCAT('%', :term, '%')")
    List<InventoryBatch> searchByBatchNumberOrProductName(@Param("term") String term);
    
    @Query("SELECT b FROM InventoryBatch b JOIN FETCH b.product")
    List<InventoryBatch> findAllWithProduct();
    
    @Query("SELECT b FROM InventoryBatch b JOIN FETCH b.product WHERE b.id = :id")
    Optional<InventoryBatch> findByIdWithProduct(@Param("id") UUID id);
}


