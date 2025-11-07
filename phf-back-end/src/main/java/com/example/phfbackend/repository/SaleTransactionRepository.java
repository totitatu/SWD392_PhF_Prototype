package com.example.phfbackend.repository;

import com.example.phfbackend.entities.sale.SaleTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SaleTransactionRepository extends JpaRepository<SaleTransaction, UUID> {
    Optional<SaleTransaction> findByReceiptNumber(String receiptNumber);
    
    List<SaleTransaction> findByCashierId(UUID cashierId);
    
    @Query("SELECT s FROM SaleTransaction s WHERE s.soldAt BETWEEN :startDate AND :endDate ORDER BY s.soldAt DESC")
    List<SaleTransaction> findBySoldAtBetween(@Param("startDate") OffsetDateTime startDate, @Param("endDate") OffsetDateTime endDate);
    
    Page<SaleTransaction> findAllByOrderBySoldAtDesc(Pageable pageable);
    
    @Query("SELECT s FROM SaleTransaction s WHERE s.receiptNumber LIKE %:term% OR s.cashier.fullName LIKE %:term%")
    List<SaleTransaction> searchByReceiptNumberOrCashierName(@Param("term") String term);
}

