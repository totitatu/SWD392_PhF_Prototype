package com.example.phfbackend.controller;

import com.example.phfbackend.dto.request.InventoryBatchRequest;
import com.example.phfbackend.dto.response.InventoryBatchResponse;
import com.example.phfbackend.dto.InventoryFilterCriteria;
import com.example.phfbackend.entities.inventory.InventoryBatch;
import com.example.phfbackend.repository.ProductRepository;
import com.example.phfbackend.service.InventoryBatchService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {
    
    private final InventoryBatchService inventoryBatchService;
    private final ProductRepository productRepository;
    
    @GetMapping
    public ResponseEntity<List<InventoryBatchResponse>> listInventoryBatches(
            @RequestParam(required = false) String searchTerm,
            @RequestParam(required = false) UUID productId,
            @RequestParam(required = false) Boolean active) {
        InventoryFilterCriteria criteria = InventoryFilterCriteria.builder()
                .searchTerm(searchTerm)
                .productId(productId)
                .active(active)
                .build();
        
        List<InventoryBatch> batches = criteria.getSearchTerm() != null && !criteria.getSearchTerm().trim().isEmpty()
                ? inventoryBatchService.search(criteria.getSearchTerm())
                : (criteria.getProductId() != null || criteria.getActive() != null
                        ? inventoryBatchService.filterInventoryBatches(criteria)
                        : inventoryBatchService.findAll());
        
        List<InventoryBatchResponse> responses = batches.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(responses);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<InventoryBatchResponse> getInventoryBatch(@PathVariable UUID id) {
        return inventoryBatchService.findById(id)
                .map(batch -> ResponseEntity.ok(toResponse(batch)))
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<InventoryBatchResponse> createInventoryBatch(@Valid @RequestBody InventoryBatchRequest request) {
        var product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("Product not found: " + request.getProductId()));
        
        InventoryBatch batch = InventoryBatch.newBuilder()
                .product(product)
                .batchNumber(request.getBatchNumber())
                .quantityOnHand(request.getQuantityOnHand())
                .costPrice(request.getCostPrice())
                .receivedDate(request.getReceivedDate())
                .expiryDate(request.getExpiryDate())
                .sellingPrice(request.getSellingPrice())
                .active(request.getActive() != null ? request.getActive() : true)
                .build();
        
        InventoryBatch created = inventoryBatchService.createBatch(batch);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(created));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<InventoryBatchResponse> updateInventoryBatch(@PathVariable UUID id, @Valid @RequestBody InventoryBatchRequest request) {
        InventoryBatch updatedBatch = InventoryBatch.newBuilder()
                .sellingPrice(request.getSellingPrice())
                .build();
        
        InventoryBatch batch = inventoryBatchService.updateBatch(id, updatedBatch);
        return ResponseEntity.ok(toResponse(batch));
    }
    
    @DeleteMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivateInventoryBatch(@PathVariable UUID id) {
        inventoryBatchService.deactivateBatch(id);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/alerts/low-stock")
    public ResponseEntity<List<InventoryBatchResponse>> getLowStockAlerts(
            @RequestParam UUID productId,
            @RequestParam int threshold) {
        List<InventoryBatch> batches = inventoryBatchService.findByProductId(productId);
        List<InventoryBatch> lowStockBatches = batches.stream()
                .filter(batch -> batch.getQuantityOnHand() <= threshold)
                .collect(Collectors.toList());
        
        List<InventoryBatchResponse> responses = lowStockBatches.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(responses);
    }
    
    @GetMapping("/alerts/near-expiry")
    public ResponseEntity<List<InventoryBatchResponse>> getNearExpiryAlerts(
            @RequestParam int days) {
        LocalDate thresholdDate = LocalDate.now().plusDays(days);
        List<InventoryBatch> batches = inventoryBatchService.findExpiringSoon(thresholdDate);
        
        List<InventoryBatchResponse> responses = batches.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(responses);
    }
    
    /**
     * UC37 - Thêm kho hàng (từ đơn đặt hàng)
     * Chủ nhà thuốc thêm mặt hàng vào kho từ một đơn đặt hàng
     */
    @PostMapping("/from-purchase-order/{purchaseOrderId}")
    public ResponseEntity<List<InventoryBatchResponse>> addInventoryFromPurchaseOrder(
            @PathVariable UUID purchaseOrderId) {
        // This would:
        // 1. Get purchase order by ID
        // 2. Check if status is RECEIVED
        // 3. For each line item, create inventory batch
        // 4. Return created batches
        
        // Placeholder implementation
        return ResponseEntity.ok(List.of());
    }
    
    private InventoryBatchResponse toResponse(InventoryBatch batch) {
        return InventoryBatchResponse.builder()
                .id(batch.getId())
                .productId(batch.getProduct().getId())
                .productName(batch.getProduct().getName())
                .productSku(batch.getProduct().getSku())
                .batchNumber(batch.getBatchNumber())
                .quantityOnHand(batch.getQuantityOnHand())
                .costPrice(batch.getCostPrice())
                .sellingPrice(batch.getSellingPrice())
                .receivedDate(batch.getReceivedDate())
                .expiryDate(batch.getExpiryDate())
                .active(batch.isActive())
                .createdAt(batch.getCreatedAt())
                .updatedAt(batch.getUpdatedAt())
                .build();
    }
}

