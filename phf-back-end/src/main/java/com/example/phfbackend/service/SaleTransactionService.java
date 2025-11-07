package com.example.phfbackend.service;

import com.example.phfbackend.entities.sale.SaleTransaction;
import com.example.phfbackend.repository.SaleTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class SaleTransactionService {
    
    private final SaleTransactionRepository saleTransactionRepository;
    
    public SaleTransaction createSaleTransaction(SaleTransaction transaction) {
        if (saleTransactionRepository.findByReceiptNumber(transaction.getReceiptNumber()).isPresent()) {
            throw new IllegalArgumentException("Sale transaction with receipt number " + transaction.getReceiptNumber() + " already exists");
        }
        return saleTransactionRepository.save(transaction);
    }
    
    @Transactional(readOnly = true)
    public Optional<SaleTransaction> findById(UUID id) {
        return saleTransactionRepository.findById(id);
    }
    
    @Transactional(readOnly = true)
    public Optional<SaleTransaction> findByReceiptNumber(String receiptNumber) {
        return saleTransactionRepository.findByReceiptNumber(receiptNumber);
    }
    
    @Transactional(readOnly = true)
    public List<SaleTransaction> findAll() {
        return saleTransactionRepository.findAll();
    }
    
    @Transactional(readOnly = true)
    public List<SaleTransaction> findByCashierId(UUID cashierId) {
        return saleTransactionRepository.findByCashierId(cashierId);
    }
    
    @Transactional(readOnly = true)
    public List<SaleTransaction> findRecentSales(int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        Page<SaleTransaction> page = saleTransactionRepository.findAllByOrderBySoldAtDesc(pageable);
        return page.getContent();
    }
    
    @Transactional(readOnly = true)
    public List<SaleTransaction> findByDateRange(OffsetDateTime startDate, OffsetDateTime endDate) {
        return saleTransactionRepository.findBySoldAtBetween(startDate, endDate);
    }
    
    @Transactional(readOnly = true)
    public List<SaleTransaction> search(String term) {
        return saleTransactionRepository.searchByReceiptNumberOrCashierName(term);
    }
}


