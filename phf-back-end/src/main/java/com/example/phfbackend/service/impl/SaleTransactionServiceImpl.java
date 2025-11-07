package com.example.phfbackend.service.impl;

import com.example.phfbackend.dto.SaleTransactionFilterCriteria;
import com.example.phfbackend.entities.sale.SaleTransaction;
import com.example.phfbackend.repository.SaleTransactionRepository;
import com.example.phfbackend.service.SaleTransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Transactional
public class SaleTransactionServiceImpl implements SaleTransactionService {
    
    private final SaleTransactionRepository saleTransactionRepository;
    
    @Override
    public SaleTransaction createSaleTransaction(SaleTransaction transaction) {
        if (saleTransactionRepository.findByReceiptNumber(transaction.getReceiptNumber()).isPresent()) {
            throw new IllegalArgumentException("Sale transaction with receipt number " + transaction.getReceiptNumber() + " already exists");
        }
        return saleTransactionRepository.save(transaction);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Optional<SaleTransaction> findById(UUID id) {
        return saleTransactionRepository.findByIdWithRelations(id);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Optional<SaleTransaction> findByReceiptNumber(String receiptNumber) {
        return saleTransactionRepository.findByReceiptNumberWithRelations(receiptNumber);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<SaleTransaction> findAll() {
        return saleTransactionRepository.findAllWithRelations();
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<SaleTransaction> findByCashierId(UUID cashierId) {
        return saleTransactionRepository.findByCashierIdWithRelations(cashierId);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<SaleTransaction> findRecentSales(int limit) {
        List<SaleTransaction> all = saleTransactionRepository.findRecentSalesWithRelations();
        return all.stream().limit(limit).toList();
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<SaleTransaction> findByDateRange(OffsetDateTime startDate, OffsetDateTime endDate) {
        return saleTransactionRepository.findBySoldAtBetweenWithRelations(startDate, endDate);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<SaleTransaction> search(String term) {
        return saleTransactionRepository.searchByReceiptNumberOrCashierNameWithRelations(term);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<SaleTransaction> filterSaleTransactions(SaleTransactionFilterCriteria criteria) {
        // Use findAllWithRelations to get all transactions with relations loaded
        Stream<SaleTransaction> stream = saleTransactionRepository.findAllWithRelations().stream();
        
        if (criteria.getSearchTerm() != null && !criteria.getSearchTerm().trim().isEmpty()) {
            String term = criteria.getSearchTerm().trim().toLowerCase();
            stream = stream.filter(transaction -> 
                transaction.getReceiptNumber().toLowerCase().contains(term) ||
                transaction.getCashier().getFullName().toLowerCase().contains(term)
            );
        }
        
        if (criteria.getCashierId() != null) {
            stream = stream.filter(transaction -> transaction.getCashier().getId().equals(criteria.getCashierId()));
        }
        
        if (criteria.getStartDate() != null) {
            stream = stream.filter(transaction -> !transaction.getSoldAt().isBefore(criteria.getStartDate()));
        }
        
        if (criteria.getEndDate() != null) {
            stream = stream.filter(transaction -> !transaction.getSoldAt().isAfter(criteria.getEndDate()));
        }
        
        return stream.sorted((a, b) -> b.getSoldAt().compareTo(a.getSoldAt())).toList();
    }
}



