package com.example.phfbackend.controller;

import com.example.phfbackend.dto.SaleTransactionFilterCriteria;
import com.example.phfbackend.dto.request.SaleTransactionLineRequest;
import com.example.phfbackend.dto.response.SaleTransactionLineResponse;
import com.example.phfbackend.dto.request.SaleTransactionRequest;
import com.example.phfbackend.dto.response.SaleTransactionResponse;
import com.example.phfbackend.entities.product.ProductCategory;
import com.example.phfbackend.entities.sale.PaymentMethod;
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
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
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
    @Transactional(readOnly = true)
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
    @Transactional(readOnly = true)
    public ResponseEntity<SaleTransactionResponse> getSaleTransaction(@PathVariable UUID id) {
        return saleTransactionService.findById(id)
                .map(transaction -> ResponseEntity.ok(toResponse(transaction)))
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * UC46 - Generate Receipt
     * Pharmacy staff finalizes the sale by generating an official receipt.
     * If the sale contains prescribed drugs, a prescription image must be uploaded.
     */
    @PostMapping
    @Transactional
    public ResponseEntity<SaleTransactionResponse> createSaleTransaction(@Valid @RequestBody SaleTransactionRequest request) {
        // PRE-1: Check cart is not empty (validated by @NotEmpty on lineItems)
        if (request.getLineItems() == null || request.getLineItems().isEmpty()) {
            throw new IllegalArgumentException("Shopping cart is not empty");
        }
        
        var cashier = userRepository.findById(request.getCashierId())
                .orElseThrow(() -> new IllegalArgumentException("Cashier not found: " + request.getCashierId()));
        
        // Generate unique receipt ID if not provided
        String receiptNumber = request.getReceiptNumber();
        if (receiptNumber == null || receiptNumber.trim().isEmpty()) {
            receiptNumber = generateReceiptNumber();
        }
        
        // Prescription image is optional (no longer required for prescription products)
        
        SaleTransaction transaction = SaleTransaction.newBuilder()
                .receiptNumber(receiptNumber)
                .soldAt(request.getSoldAt() != null ? request.getSoldAt() : OffsetDateTime.now())
                .cashier(cashier)
                .totalDiscount(request.getTotalDiscount())
                .paymentMethod(request.getPaymentMethod())
                .prescriptionImageUrl(request.getPrescriptionImageUrl())
                .customerEmail(request.getCustomerEmail())
                .build();
        
        for (SaleTransactionLineRequest lineRequest : request.getLineItems()) {
            // Use findByIdWithProduct to eager load Product entity
            var batch = inventoryBatchRepository.findByIdWithProduct(lineRequest.getInventoryBatchId())
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
        
        // A1: Email receipt (if requested)
        if (Boolean.TRUE.equals(request.getEmailReceipt()) && request.getCustomerEmail() != null) {
            // TODO: Implement email receipt functionality
            // For now, just log that email was requested
        }
        
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(created));
    }
    
    /**
     * Generate unique receipt number (UC46 - Normal Flow step 4)
     * Format: REC-YYYYMMDD-HHMMSS-XXXX
     */
    private String generateReceiptNumber() {
        OffsetDateTime now = OffsetDateTime.now();
        String dateTime = now.format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss"));
        String random = String.format("%04d", (int)(Math.random() * 10000));
        return "REC-" + dateTime + "-" + random;
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
                .paymentMethod(transaction.getPaymentMethod())
                .prescriptionImageUrl(transaction.getPrescriptionImageUrl())
                .customerEmail(transaction.getCustomerEmail())
                .createdAt(transaction.getCreatedAt())
                .updatedAt(transaction.getUpdatedAt())
                .build();
    }
}

