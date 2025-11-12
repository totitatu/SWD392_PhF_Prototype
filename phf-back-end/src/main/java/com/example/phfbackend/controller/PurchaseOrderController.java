package com.example.phfbackend.controller;

import com.example.phfbackend.dto.PurchaseOrderFilterCriteria;
import com.example.phfbackend.dto.request.PurchaseOrderLineRequest;
import com.example.phfbackend.dto.response.PurchaseOrderLineResponse;
import com.example.phfbackend.dto.request.PurchaseOrderRequest;
import com.example.phfbackend.dto.response.PurchaseOrderResponse;
import com.example.phfbackend.entities.purchase.PurchaseOrder;
import com.example.phfbackend.entities.purchase.PurchaseOrderLine;
import com.example.phfbackend.entities.purchase.PurchaseOrderStatus;
import com.example.phfbackend.pattern.facade.PurchaseOrderFacade;
import com.example.phfbackend.repository.ProductRepository;
import com.example.phfbackend.repository.SupplierRepository;
import com.example.phfbackend.service.PurchaseOrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/purchase-orders")
@RequiredArgsConstructor
public class PurchaseOrderController {
    
    private final PurchaseOrderService purchaseOrderService;
    private final PurchaseOrderFacade purchaseOrderFacade;
    private final SupplierRepository supplierRepository;
    private final ProductRepository productRepository;
    
    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<List<PurchaseOrderResponse>> listPurchaseOrders(
            @RequestParam(required = false) String searchTerm,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) UUID supplierId,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate) {
        PurchaseOrderStatus statusEnum = null;
        if (status != null && !status.trim().isEmpty()) {
            try {
                // Convert to uppercase to match enum values
                statusEnum = PurchaseOrderStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                // Invalid status value, will be ignored
            }
        }
        
        PurchaseOrderFilterCriteria criteria = PurchaseOrderFilterCriteria.builder()
                .searchTerm(searchTerm)
                .status(statusEnum)
                .supplierId(supplierId)
                .startDate(startDate)
                .endDate(endDate)
                .build();
        
        List<PurchaseOrder> orders = criteria.getSearchTerm() != null && !criteria.getSearchTerm().trim().isEmpty()
                ? purchaseOrderService.search(criteria.getSearchTerm())
                : (criteria.getStatus() != null || criteria.getSupplierId() != null || 
                   criteria.getStartDate() != null || criteria.getEndDate() != null
                        ? purchaseOrderService.filterPurchaseOrders(criteria)
                        : purchaseOrderService.findAll());
        
        List<PurchaseOrderResponse> responses = orders.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(responses);
    }
    
    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<PurchaseOrderResponse> getPurchaseOrder(@PathVariable UUID id) {
        return purchaseOrderService.findById(id)
                .map(order -> ResponseEntity.ok(toResponse(order)))
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<PurchaseOrderResponse> createPurchaseOrder(
            @Valid @RequestBody PurchaseOrderRequest request,
            @RequestHeader(value = "X-User-Id", required = false) UUID userId) {
        
        // Sử dụng Facade Pattern để đơn giản hóa việc tạo purchase order
        // Facade sẽ xử lý: validation, tạo order, logging
        PurchaseOrderResponse response = purchaseOrderFacade
                .createPurchaseOrderWithValidation(request, userId);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    @PutMapping("/{id}/status")
    @Transactional
    public ResponseEntity<?> updateOrderStatus(
            @PathVariable UUID id,
            @RequestParam String status) {
        try {
            // Kiểm tra order hiện tại trước khi thay đổi status
            PurchaseOrder currentOrder = purchaseOrderService.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Purchase order not found: " + id));
            
            // Không cho phép thay đổi status từ RECEIVED hoặc CANCELLED
            if (currentOrder.getStatus() == PurchaseOrderStatus.RECEIVED || 
                currentOrder.getStatus() == PurchaseOrderStatus.CANCELLED) {
                return ResponseEntity.badRequest()
                    .body(java.util.Map.of(
                        "error", "Cannot change status from " + currentOrder.getStatus(),
                        "message", "Order is already in final state and cannot be modified"
                    ));
            }
            
            // Validate status parameter
            PurchaseOrderStatus statusEnum;
            try {
                statusEnum = PurchaseOrderStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest()
                    .body(java.util.Map.of(
                        "error", "Invalid status",
                        "message", "Status must be one of: DRAFT, ORDERED, RECEIVED, CANCELLED"
                    ));
            }
            
            // Validate transition: không cho phép chuyển sang DRAFT
            if (statusEnum == PurchaseOrderStatus.DRAFT) {
                return ResponseEntity.badRequest()
                    .body(java.util.Map.of(
                        "error", "Invalid status transition",
                        "message", "Cannot change status to DRAFT"
                    ));
            }
            
            // Validate transition: không cho phép cancel từ RECEIVED
            if (statusEnum == PurchaseOrderStatus.CANCELLED && 
                currentOrder.getStatus() == PurchaseOrderStatus.RECEIVED) {
                return ResponseEntity.badRequest()
                    .body(java.util.Map.of(
                        "error", "Invalid status transition",
                        "message", "Cannot cancel a RECEIVED order. Order is already completed."
                    ));
            }
            
            purchaseOrderService.updateStatus(id, statusEnum);
            
            // Fetch the updated order with all relations loaded
            PurchaseOrder order = purchaseOrderService.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Purchase order not found: " + id));
            return ResponseEntity.ok(toResponse(order));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(java.util.Map.of(
                    "error", "Invalid request",
                    "message", e.getMessage()
                ));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest()
                .body(java.util.Map.of(
                    "error", "Invalid state transition",
                    "message", e.getMessage()
                ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(java.util.Map.of(
                    "error", "Internal server error",
                    "message", "An unexpected error occurred: " + e.getMessage()
                ));
        }
    }
    
    @PostMapping("/{id}/send")
    public ResponseEntity<PurchaseOrderResponse> sendPurchaseOrder(
            @PathVariable UUID id,
            @RequestParam(required = false) LocalDate expectedDate,
            @RequestHeader(value = "X-User-Id", required = false) UUID userId) {
        
        // Sử dụng Facade Pattern để gửi purchase order với logging
        PurchaseOrderResponse response = purchaseOrderFacade
                .sendPurchaseOrder(id, expectedDate, userId);
        
        return ResponseEntity.ok(response);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<PurchaseOrderResponse> updatePurchaseOrder(@PathVariable UUID id, @Valid @RequestBody PurchaseOrderRequest request) {
        PurchaseOrder order = purchaseOrderService.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Purchase order not found: " + id));
        
        // State Pattern: Sử dụng state để kiểm tra có thể update không
        com.example.phfbackend.pattern.state.PurchaseOrderState currentState = 
            com.example.phfbackend.pattern.state.PurchaseOrderStateFactory.getState(order.getStatus());
        if (!currentState.canUpdate()) {
            throw new IllegalStateException("Cannot update order with status: " + order.getStatus());
        }
        
        var supplier = supplierRepository.findById(request.getSupplierId())
                .orElseThrow(() -> new IllegalArgumentException("Supplier not found: " + request.getSupplierId()));
        
        order.getLineItems().clear();
        for (PurchaseOrderLineRequest lineRequest : request.getLineItems()) {
            var product = productRepository.findById(lineRequest.getProductId())
                    .orElseThrow(() -> new IllegalArgumentException("Product not found: " + lineRequest.getProductId()));
            
            PurchaseOrderLine line = PurchaseOrderLine.newBuilder()
                    .product(product)
                    .quantity(lineRequest.getQuantity())
                    .unitCost(lineRequest.getUnitCost())
                    .build();
            
            order.addLine(line);
        }
        
        PurchaseOrder updated = purchaseOrderService.createPurchaseOrder(order);
        return ResponseEntity.ok(toResponse(updated));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePurchaseOrder(@PathVariable UUID id) {
        purchaseOrderService.deletePurchaseOrder(id);
        return ResponseEntity.noContent().build();
    }
    
    private PurchaseOrderResponse toResponse(PurchaseOrder order) {
        List<PurchaseOrderLineResponse> lineResponses = order.getLineItems().stream()
                .map(line -> PurchaseOrderLineResponse.builder()
                        .id(line.getId())
                        .productId(line.getProduct().getId())
                        .productName(line.getProduct().getName())
                        .productSku(line.getProduct().getSku())
                        .lineNumber(line.getLineNumber())
                        .quantity(line.getQuantity())
                        .unitCost(line.getUnitCost())
                        .lineTotal(line.getUnitCost().multiply(java.math.BigDecimal.valueOf(line.getQuantity())))
                        .build())
                .collect(Collectors.toList());
        
        return PurchaseOrderResponse.builder()
                .id(order.getId())
                .orderCode(order.getOrderCode())
                .supplierId(order.getSupplier().getId())
                .supplierName(order.getSupplier().getName())
                .status(order.getStatus())
                .orderDate(order.getOrderDate())
                .expectedDate(order.getExpectedDate())
                .lineItems(lineResponses)
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }
}

