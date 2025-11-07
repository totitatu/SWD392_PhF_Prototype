package com.example.phfbackend.service;

import com.example.phfbackend.dto.SaleTransactionFilterCriteria;
import com.example.phfbackend.entities.sale.SaleTransaction;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SaleTransactionService {
    SaleTransaction createSaleTransaction(SaleTransaction transaction);
    
    Optional<SaleTransaction> findById(UUID id);
    
    Optional<SaleTransaction> findByReceiptNumber(String receiptNumber);
    
    List<SaleTransaction> findAll();
    
    List<SaleTransaction> findByCashierId(UUID cashierId);
    
    List<SaleTransaction> findRecentSales(int limit);
    
    List<SaleTransaction> findByDateRange(OffsetDateTime startDate, OffsetDateTime endDate);
    
    List<SaleTransaction> search(String term);
    
    List<SaleTransaction> filterSaleTransactions(SaleTransactionFilterCriteria criteria);
}
