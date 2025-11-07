package com.example.phfbackend.service.impl;

import com.example.phfbackend.dto.SaleTransactionFilterCriteria;
import com.example.phfbackend.entities.sale.SaleTransaction;
import com.example.phfbackend.repository.SaleTransactionRepository;
import com.example.phfbackend.service.SaleTransactionService;
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
        return saleTransactionRepository.findById(id);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Optional<SaleTransaction> findByReceiptNumber(String receiptNumber) {
        return saleTransactionRepository.findByReceiptNumber(receiptNumber);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<SaleTransaction> findAll() {
        return saleTransactionRepository.findAll();
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<SaleTransaction> findByCashierId(UUID cashierId) {
        return saleTransactionRepository.findByCashierId(cashierId);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<SaleTransaction> findRecentSales(int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        Page<SaleTransaction> page = saleTransactionRepository.findAllByOrderBySoldAtDesc(pageable);
        return page.getContent();
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<SaleTransaction> findByDateRange(OffsetDateTime startDate, OffsetDateTime endDate) {
        return saleTransactionRepository.findBySoldAtBetween(startDate, endDate);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<SaleTransaction> search(String term) {
        return saleTransactionRepository.searchByReceiptNumberOrCashierName(term);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<SaleTransaction> filterSaleTransactions(SaleTransactionFilterCriteria criteria) {
        Stream<SaleTransaction> stream = saleTransactionRepository.findAll().stream();
        
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


