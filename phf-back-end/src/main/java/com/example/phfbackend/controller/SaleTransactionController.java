package com.example.phfbackend.controller;

import com.example.phfbackend.dto.SaleTransactionFilterCriteria;
import com.example.phfbackend.dto.SaleTransactionLineRequest;
import com.example.phfbackend.dto.SaleTransactionLineResponse;
import com.example.phfbackend.dto.SaleTransactionRequest;
import com.example.phfbackend.dto.SaleTransactionResponse;
import com.example.phfbackend.entities.sale.SaleTransaction;
import com.example.phfbackend.entities.sale.SaleTransactionLine;
import com.example.phfbackend.repository.InventoryBatchRepository;
import com.example.phfbackend.repository.PharmacyUserRepository;
import com.example.phfbackend.service.InventoryBatchService;
import com.example.phfbackend.service.SaleTransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/sales")
@RequiredArgsConstructor
public class SaleTransactionController {
    
    private final SaleTransactionService saleTransactionService;
    private final PharmacyUserRepository userRepository;
    private final InventoryBatchRepository inventoryBatchRepository;
    private final InventoryBatchService inventoryBatchService;
    
    @GetMapping
    public ResponseEntity<List<SaleTransactionResponse>> listSaleTransactions(
            @RequestParam(required = false) String searchTerm,
            @RequestParam(required = false) UUID cashierId,
            @RequestParam(required = false) OffsetDateTime startDate,
            @RequestParam(required = false) OffsetDateTime endDate) {
        SaleTransactionFilterCriteria criteria = SaleTransactionFilterCriteria.builder()
                .searchTerm(searchTerm)
                .cashierId(cashierId)
                .startDate(startDate)
                .endDate(endDate)
                .build();
        
        List<SaleTransaction> transactions = criteria.getSearchTerm() != null && !criteria.getSearchTerm().trim().isEmpty()
                ? saleTransactionService.search(criteria.getSearchTerm())
                : (criteria.getCashierId() != null || criteria.getStartDate() != null || criteria.getEndDate() != null
                        ? saleTransactionService.filterSaleTransactions(criteria)
                        : saleTransactionService.findRecentSales(50));
        
        List<SaleTransactionResponse> responses = transactions.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(responses);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<SaleTransactionResponse> getSaleTransaction(@PathVariable UUID id) {
        return saleTransactionService.findById(id)
                .map(transaction -> ResponseEntity.ok(toResponse(transaction)))
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<SaleTransactionResponse> createSaleTransaction(@Valid @RequestBody SaleTransactionRequest request) {
        var cashier = userRepository.findById(request.getCashierId())
                .orElseThrow(() -> new IllegalArgumentException("Cashier not found: " + request.getCashierId()));
        
        SaleTransaction transaction = SaleTransaction.newBuilder()
                .receiptNumber(request.getReceiptNumber())
                .soldAt(request.getSoldAt())
                .cashier(cashier)
                .totalDiscount(request.getTotalDiscount())
                .build();
        
        for (SaleTransactionLineRequest lineRequest : request.getLineItems()) {
            var batch = inventoryBatchRepository.findById(lineRequest.getInventoryBatchId())
                    .orElseThrow(() -> new IllegalArgumentException("Inventory batch not found: " + lineRequest.getInventoryBatchId()));
            
            SaleTransactionLine line = SaleTransactionLine.newBuilder()
                    .product(batch.getProduct())
                    .inventoryBatch(batch)
                    .quantity(lineRequest.getQuantity())
                    .unitPrice(lineRequest.getUnitPrice())
                    .build();
            
            transaction.addLine(line);
            
            // Deduct quantity from inventory
            inventoryBatchService.deductQuantity(batch.getId(), lineRequest.getQuantity());
        }
        
        SaleTransaction created = saleTransactionService.createSaleTransaction(transaction);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(created));
    }
    
    
    private SaleTransactionResponse toResponse(SaleTransaction transaction) {
        List<SaleTransactionLineResponse> lineResponses = transaction.getLineItems().stream()
                .map(line -> {
                    BigDecimal lineTotal = line.calculateLineTotal();
                    if (transaction.getTotalDiscount() != null) {
                        // Distribute discount proportionally (simplified)
                        lineTotal = lineTotal.subtract(transaction.getTotalDiscount()
                                .multiply(lineTotal).divide(transaction.calculateTotalAmount().add(transaction.getTotalDiscount()), 2, java.math.RoundingMode.HALF_UP));
                    }
                    
                    return SaleTransactionLineResponse.builder()
                            .id(line.getId())
                            .inventoryBatchId(line.getInventoryBatch() != null ? line.getInventoryBatch().getId() : null)
                            .batchNumber(line.getInventoryBatch() != null ? line.getInventoryBatch().getBatchNumber() : null)
                            .productId(line.getProduct().getId())
                            .productName(line.getProduct().getName())
                            .productSku(line.getProduct().getSku())
                            .lineNumber(line.getLineNumber())
                            .quantity(line.getQuantity())
                            .unitPrice(line.getUnitPrice())
                            .discount(null) // Individual line discount not stored
                            .lineTotal(lineTotal)
                            .build();
                })
                .collect(Collectors.toList());
        
        return SaleTransactionResponse.builder()
                .id(transaction.getId())
                .receiptNumber(transaction.getReceiptNumber())
                .soldAt(transaction.getSoldAt())
                .cashierId(transaction.getCashier().getId())
                .cashierName(transaction.getCashier().getFullName())
                .lineItems(lineResponses)
                .totalDiscount(transaction.getTotalDiscount())
                .totalAmount(transaction.calculateTotalAmount())
                .createdAt(transaction.getCreatedAt())
                .updatedAt(transaction.getUpdatedAt())
                .build();
    }
}

