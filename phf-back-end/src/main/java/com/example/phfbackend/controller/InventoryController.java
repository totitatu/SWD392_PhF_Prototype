package com.example.phfbackend.controller;

import com.example.phfbackend.dto.request.InventoryBatchRequest;
import com.example.phfbackend.dto.response.AlertResponse;
import com.example.phfbackend.dto.response.InventoryBatchResponse;
import com.example.phfbackend.dto.InventoryFilterCriteria;
import com.example.phfbackend.entities.inventory.InventoryBatch;
import com.example.phfbackend.repository.ProductRepository;
import com.example.phfbackend.service.InventoryBatchService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {
    
    private final InventoryBatchService inventoryBatchService;
    private final ProductRepository productRepository;
    
    @GetMapping
    @Transactional(readOnly = true)
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
    @Transactional
    public ResponseEntity<InventoryBatchResponse> updateInventoryBatch(@PathVariable UUID id, @Valid @RequestBody InventoryBatchRequest request) {
        InventoryBatch batch = inventoryBatchService.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Inventory batch not found: " + id));
        
        // Verify product hasn't changed (cannot change product of existing batch)
        if (!batch.getProduct().getId().equals(request.getProductId())) {
            throw new IllegalStateException("Cannot change product of an existing inventory batch");
        }
        
        // Create updated batch with all fields for service to process
        InventoryBatch updatedBatch = InventoryBatch.newBuilder()
                .product(batch.getProduct())
                .batchNumber(request.getBatchNumber())
                .quantityOnHand(request.getQuantityOnHand())
                .costPrice(request.getCostPrice())
                .receivedDate(request.getReceivedDate())
                .expiryDate(request.getExpiryDate())
                .sellingPrice(request.getSellingPrice())
                .active(batch.isActive())
                .build();
        
        inventoryBatchService.updateBatch(id, updatedBatch);
        // Fetch the updated batch with product loaded
        InventoryBatch updated = inventoryBatchService.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Inventory batch not found: " + id));
        return ResponseEntity.ok(toResponse(updated));
    }
    
    @DeleteMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivateInventoryBatch(@PathVariable UUID id) {
        inventoryBatchService.deactivateBatch(id);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * UC41 - Gửi cảnh báo hết hàng
     * UC42 - Gửi cảnh báo sắp hết hạn
     * Get all alerts (low stock and expiry) using product configuration
     * Uses reorderLevel/minStock from Product for low stock alerts
     * Uses expiryAlertDays from Product for expiry alerts
     */
    @GetMapping("/alerts")
    @Transactional(readOnly = true)
    public ResponseEntity<List<AlertResponse>> getAllAlerts() {
        List<InventoryBatch> allBatches = inventoryBatchService.findAll();
        LocalDate currentDate = LocalDate.now();
        List<AlertResponse> alerts = new ArrayList<>();
        
        // Group batches by product to calculate total stock per product
        Map<UUID, List<InventoryBatch>> batchesByProduct = allBatches.stream()
                .filter(batch -> batch.isActive() && batch.getQuantityOnHand() > 0)
                .collect(Collectors.groupingBy(batch -> batch.getProduct().getId()));
        
        // Check low stock alerts using product configuration
        for (Map.Entry<UUID, List<InventoryBatch>> entry : batchesByProduct.entrySet()) {
            UUID productId = entry.getKey();
            List<InventoryBatch> batches = entry.getValue();
            
            if (batches.isEmpty()) continue;
            
            InventoryBatch firstBatch = batches.get(0);
            var product = firstBatch.getProduct();
            
            // Calculate total stock for this product
            int totalStock = batches.stream()
                    .mapToInt(InventoryBatch::getQuantityOnHand)
                    .sum();
            
            // Use reorderLevel or minStock from product configuration
            Integer threshold = product.getReorderLevel() != null 
                    ? product.getReorderLevel() 
                    : product.getMinStock();
            
            // If threshold is configured and stock is below threshold, create alert
            if (threshold != null && totalStock <= threshold) {
                alerts.add(AlertResponse.builder()
                        .type("low-stock")
                        .severity(totalStock == 0 ? "critical" : "warning")
                        .productId(productId)
                        .productName(product.getName())
                        .productSku(product.getSku())
                        .currentStock(totalStock)
                        .threshold(threshold)
                        .message(String.format("Low stock alert: %s (Current: %d, Threshold: %d)", 
                                product.getName(), totalStock, threshold))
                        .build());
            }
        }
        
        // Check expiry alerts using product configuration
        for (InventoryBatch batch : allBatches) {
            if (!batch.isActive() || batch.getQuantityOnHand() <= 0) continue;
            if (batch.isExpired(currentDate)) continue; // Skip expired batches
            
            var product = batch.getProduct();
            Integer expiryAlertDays = product.getExpiryAlertDays();
            
            // If expiry alert days is configured, check if batch is within alert period
            if (expiryAlertDays != null && expiryAlertDays > 0) {
                LocalDate alertThreshold = currentDate.plusDays(expiryAlertDays);
                
                if (batch.getExpiryDate().isBefore(alertThreshold) || 
                    batch.getExpiryDate().isEqual(alertThreshold)) {
                    
                    long daysUntilExpiry = java.time.temporal.ChronoUnit.DAYS.between(
                            currentDate, batch.getExpiryDate());
                    
                    String severity = daysUntilExpiry <= 0 ? "critical" : 
                                     (daysUntilExpiry <= 7 ? "critical" : "warning");
                    
                    alerts.add(AlertResponse.builder()
                            .type("expiry")
                            .severity(severity)
                            .productId(product.getId())
                            .productName(product.getName())
                            .productSku(product.getSku())
                            .inventoryBatchId(batch.getId())
                            .batchNumber(batch.getBatchNumber())
                            .expiryDate(batch.getExpiryDate())
                            .daysUntilExpiry((int) daysUntilExpiry)
                            .message(String.format("Expiry alert: %s (Batch %s) expires in %d days", 
                                    product.getName(), batch.getBatchNumber(), daysUntilExpiry))
                            .build());
                }
            }
        }
        
        return ResponseEntity.ok(alerts);
    }
    
    /**
     * UC41 - Gửi cảnh báo hết hàng
     * Get low stock alerts for a specific product using product's reorderLevel/minStock
     * If productId is provided, uses product configuration. Otherwise uses provided threshold.
     */
    @GetMapping("/alerts/low-stock")
    @Transactional(readOnly = true)
    public ResponseEntity<List<InventoryBatchResponse>> getLowStockAlerts(
            @RequestParam(required = false) UUID productId,
            @RequestParam(required = false) Integer threshold) {
        
        if (productId != null) {
            // Use product configuration
            List<InventoryBatch> batches = inventoryBatchService.findByProductId(productId);
            if (batches.isEmpty()) {
                return ResponseEntity.ok(List.of());
            }
            
            var product = batches.get(0).getProduct();
            Integer productThreshold = product.getReorderLevel() != null 
                    ? product.getReorderLevel() 
                    : product.getMinStock();
            
            if (productThreshold == null) {
                // Product doesn't have threshold configured
                return ResponseEntity.ok(List.of());
            }
            
            // Calculate total stock for this product
            int totalStock = batches.stream()
                    .filter(batch -> batch.isActive() && batch.getQuantityOnHand() > 0)
                    .mapToInt(InventoryBatch::getQuantityOnHand)
                    .sum();
            
            if (totalStock <= productThreshold) {
                List<InventoryBatchResponse> responses = batches.stream()
                        .filter(batch -> batch.isActive() && batch.getQuantityOnHand() > 0)
                        .map(this::toResponse)
                        .collect(Collectors.toList());
                return ResponseEntity.ok(responses);
            }
            
            return ResponseEntity.ok(List.of());
        } else if (threshold != null) {
            // Use provided threshold (backward compatibility)
            List<InventoryBatch> allBatches = inventoryBatchService.findAll();
            List<InventoryBatch> lowStockBatches = allBatches.stream()
                    .filter(batch -> batch.isActive() && batch.getQuantityOnHand() > 0)
                    .filter(batch -> batch.getQuantityOnHand() <= threshold)
                    .collect(Collectors.toList());
            
            List<InventoryBatchResponse> responses = lowStockBatches.stream()
                    .map(this::toResponse)
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(responses);
        } else {
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * UC42 - Gửi cảnh báo sắp hết hạn
     * Get near expiry alerts using product's expiryAlertDays configuration
     * If days parameter is provided, uses it. Otherwise uses product configuration.
     */
    @GetMapping("/alerts/near-expiry")
    @Transactional(readOnly = true)
    public ResponseEntity<List<InventoryBatchResponse>> getNearExpiryAlerts(
            @RequestParam(required = false) Integer days) {
        
        List<InventoryBatch> allBatches = inventoryBatchService.findAll();
        LocalDate currentDate = LocalDate.now();
        List<InventoryBatch> expiringBatches = new ArrayList<>();
        
        for (InventoryBatch batch : allBatches) {
            if (!batch.isActive() || batch.getQuantityOnHand() <= 0) continue;
            if (batch.isExpired(currentDate)) continue;
            
            var product = batch.getProduct();
            Integer expiryAlertDays = days != null ? days : product.getExpiryAlertDays();
            
            if (expiryAlertDays != null && expiryAlertDays > 0) {
                LocalDate thresholdDate = currentDate.plusDays(expiryAlertDays);
                
                if (batch.getExpiryDate().isBefore(thresholdDate) || 
                    batch.getExpiryDate().isEqual(thresholdDate)) {
                    expiringBatches.add(batch);
                }
            } else if (days != null) {
                // Fallback to provided days if product doesn't have configuration
                LocalDate thresholdDate = currentDate.plusDays(days);
                if (batch.getExpiryDate().isBefore(thresholdDate) || 
                    batch.getExpiryDate().isEqual(thresholdDate)) {
                    expiringBatches.add(batch);
                }
            }
        }
        
        List<InventoryBatchResponse> responses = expiringBatches.stream()
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

