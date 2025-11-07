package com.example.phfbackend.controller;

import com.example.phfbackend.dto.GeminiRequest;
import com.example.phfbackend.dto.GeminiResponse;
import com.example.phfbackend.dto.PurchaseOrderFilterCriteria;
import com.example.phfbackend.dto.PurchaseOrderLineRequest;
import com.example.phfbackend.dto.PurchaseOrderLineResponse;
import com.example.phfbackend.dto.PurchaseOrderRequest;
import com.example.phfbackend.dto.PurchaseOrderResponse;
import com.example.phfbackend.entities.purchase.PurchaseOrder;
import com.example.phfbackend.entities.purchase.PurchaseOrderLine;
import com.example.phfbackend.entities.purchase.PurchaseOrderStatus;
import com.example.phfbackend.repository.ProductRepository;
import com.example.phfbackend.repository.SupplierRepository;
import com.example.phfbackend.service.GeminiService;
import com.example.phfbackend.service.PurchaseOrderService;
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
@RequestMapping("/api/purchase-orders")
@RequiredArgsConstructor
public class PurchaseOrderController {
    
    private final PurchaseOrderService purchaseOrderService;
    private final SupplierRepository supplierRepository;
    private final ProductRepository productRepository;
    private final GeminiService geminiService;
    
    @GetMapping
    public ResponseEntity<List<PurchaseOrderResponse>> listPurchaseOrders(
            @RequestParam(required = false) String searchTerm,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) UUID supplierId,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate) {
        PurchaseOrderFilterCriteria criteria = PurchaseOrderFilterCriteria.builder()
                .searchTerm(searchTerm)
                .status(status != null ? PurchaseOrderStatus.valueOf(status) : null)
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
    public ResponseEntity<PurchaseOrderResponse> getPurchaseOrder(@PathVariable UUID id) {
        return purchaseOrderService.findById(id)
                .map(order -> ResponseEntity.ok(toResponse(order)))
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<PurchaseOrderResponse> createPurchaseOrder(@Valid @RequestBody PurchaseOrderRequest request) {
        var supplier = supplierRepository.findById(request.getSupplierId())
                .orElseThrow(() -> new IllegalArgumentException("Supplier not found: " + request.getSupplierId()));
        
        PurchaseOrder order = PurchaseOrder.newBuilder()
                .orderCode(request.getOrderCode())
                .supplier(supplier)
                .status(PurchaseOrderStatus.DRAFT)
                .orderDate(request.getOrderDate())
                .expectedDate(request.getExpectedDate())
                .build();
        
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
        
        PurchaseOrder created = purchaseOrderService.createPurchaseOrder(order);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(created));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<PurchaseOrderResponse> updatePurchaseOrder(@PathVariable UUID id, @Valid @RequestBody PurchaseOrderRequest request) {
        PurchaseOrder order = purchaseOrderService.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Purchase order not found: " + id));
        
        if (order.getStatus() != PurchaseOrderStatus.DRAFT) {
            throw new IllegalStateException("Only draft orders can be updated");
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
    
    @PostMapping("/{id}/send")
    public ResponseEntity<PurchaseOrderResponse> sendPurchaseOrder(
            @PathVariable UUID id,
            @RequestParam(required = false) LocalDate expectedDate) {
        PurchaseOrder order = purchaseOrderService.markOrdered(id, expectedDate);
        return ResponseEntity.ok(toResponse(order));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePurchaseOrder(@PathVariable UUID id) {
        purchaseOrderService.deletePurchaseOrder(id);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * UC30 - Thêm đơn đặt hàng nháp với Gemini
     * Chủ nhà thuốc thêm một đơn đặt hàng nháp với sự hỗ trợ của Gemini
     */
    @PostMapping("/create-with-gemini")
    public ResponseEntity<GeminiResponse> createPurchaseOrderWithGemini(@Valid @RequestBody GeminiRequest request) {
        try {
            String suggestion = geminiService.suggestPurchaseOrder(request.getUserInput());
            
            GeminiResponse response = GeminiResponse.builder()
                    .suggestion(suggestion)
                    .success(true)
                    .build();
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            GeminiResponse errorResponse = GeminiResponse.builder()
                    .success(false)
                    .errorMessage(e.getMessage())
                    .build();
            return ResponseEntity.status(500).body(errorResponse);
        }
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

