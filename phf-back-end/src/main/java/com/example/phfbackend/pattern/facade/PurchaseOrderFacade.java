package com.example.phfbackend.pattern.facade;

import com.example.phfbackend.dto.request.PurchaseOrderLineRequest;
import com.example.phfbackend.dto.request.PurchaseOrderRequest;
import com.example.phfbackend.dto.response.PurchaseOrderResponse;
import com.example.phfbackend.entities.inventory.InventoryBatch;
import com.example.phfbackend.entities.product.Product;
import com.example.phfbackend.entities.purchase.PurchaseOrder;
import com.example.phfbackend.entities.purchase.PurchaseOrderLine;
import com.example.phfbackend.entities.purchase.PurchaseOrderStatus;
import com.example.phfbackend.entities.shared.SystemLog;
import com.example.phfbackend.entities.supplier.Supplier;
import com.example.phfbackend.service.InventoryBatchService;
import com.example.phfbackend.service.ProductService;
import com.example.phfbackend.service.PurchaseOrderService;
import com.example.phfbackend.service.SupplierService;
import com.example.phfbackend.service.SystemLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Facade Pattern - PurchaseOrderFacade
 * 
 * Đơn giản hóa interface cho việc tạo và quản lý Purchase Orders.
 * Facade này che giấu sự phức tạp của việc tương tác với nhiều services:
 * - SupplierService: Validate supplier
 * - ProductService: Validate products
 * - PurchaseOrderService: Tạo và quản lý purchase orders
 * - InventoryBatchService: Tạo inventory khi nhận hàng
 * - SystemLogService: Log các hoạt động
 * 
 * Client chỉ cần gọi một method đơn giản thay vì phải gọi nhiều services riêng lẻ.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class PurchaseOrderFacade {
    
    private final SupplierService supplierService;
    private final ProductService productService;
    private final PurchaseOrderService purchaseOrderService;
    private final InventoryBatchService inventoryBatchService;
    private final SystemLogService systemLogService;
    
    /**
     * Facade Method: Tạo Purchase Order với đầy đủ validation và logging
     * 
     * Đơn giản hóa quy trình tạo purchase order từ nhiều bước:
     * 1. Validate supplier
     * 2. Validate products
     * 3. Tạo purchase order entity
     * 4. Thêm line items
     * 5. Lưu purchase order
     * 6. Log activity
     * 
     * @param request PurchaseOrderRequest từ client
     * @param userId ID của user tạo order
     * @return PurchaseOrderResponse
     */
    public PurchaseOrderResponse createPurchaseOrderWithValidation(
            PurchaseOrderRequest request,
            UUID userId) {
        
        // Step 1: Validate supplier
        Supplier supplier = supplierService.findById(request.getSupplierId())
                .orElseThrow(() -> new IllegalArgumentException(
                    "Supplier not found: " + request.getSupplierId()));
        
        if (!supplier.isActive()) {
            throw new IllegalStateException(
                "Cannot create purchase order with inactive supplier: " + supplier.getName());
        }
        
        // Step 2: Validate all products in line items
        List<Product> products = validateProducts(request.getLineItems());
        
        // Step 3: Create purchase order entity
        PurchaseOrder order = PurchaseOrder.newBuilder()
                .orderCode(request.getOrderCode())
                .supplier(supplier)
                .status(PurchaseOrderStatus.DRAFT)
                .orderDate(request.getOrderDate())
                .expectedDate(request.getExpectedDate())
                .build();
        
        // Step 4: Add line items with validation
        for (PurchaseOrderLineRequest lineRequest : request.getLineItems()) {
            Product product = products.stream()
                    .filter(p -> p.getId().equals(lineRequest.getProductId()))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException(
                        "Product not found: " + lineRequest.getProductId()));
            
            // Validate product is active
            if (!product.isActive()) {
                throw new IllegalStateException(
                    "Cannot add inactive product to purchase order: " + product.getName());
            }
            
            PurchaseOrderLine line = PurchaseOrderLine.newBuilder()
                    .product(product)
                    .quantity(lineRequest.getQuantity())
                    .unitCost(lineRequest.getUnitCost())
                    .build();
            
            order.addLine(line);
        }
        
        // Step 5: Save purchase order
        PurchaseOrder saved = purchaseOrderService.createPurchaseOrder(order);
        
        // Step 6: Log activity
        logPurchaseOrderAction(
            userId,
            "PURCHASE_ORDER_CREATED",
            saved.getId(),
            "Created purchase order: " + saved.getOrderCode() + 
            " with " + saved.getLineItems().size() + " line items");
        
        // Step 7: Convert to response
        return toPurchaseOrderResponse(saved);
    }
    
    /**
     * Facade Method: Nhận hàng và tự động tạo inventory
     * 
     * Đơn giản hóa quy trình nhận hàng:
     * 1. Mark order as received (State Pattern)
     * 2. Tạo inventory batches cho tất cả line items
     * 3. Log activity
     * 
     * @param orderId Purchase Order ID
     * @param userId ID của user nhận hàng
     * @return PurchaseOrderResponse
     */
    public PurchaseOrderResponse receivePurchaseOrder(UUID orderId, UUID userId) {
        // Step 1: Mark as received (sẽ tự động tạo inventory trong service)
        PurchaseOrder order = purchaseOrderService.markReceived(orderId);
        
        // Step 2: Log activity
        logPurchaseOrderAction(
            userId,
            "PURCHASE_ORDER_RECEIVED",
            order.getId(),
            "Received purchase order: " + order.getOrderCode() + 
            ". Created " + order.getLineItems().size() + " inventory batches");
        
        // Step 3: Convert to response
        return toPurchaseOrderResponse(order);
    }
    
    /**
     * Facade Method: Gửi đơn hàng (chuyển từ DRAFT sang ORDERED)
     * 
     * @param orderId Purchase Order ID
     * @param expectedDate Ngày dự kiến nhận hàng
     * @param userId ID của user gửi đơn hàng
     * @return PurchaseOrderResponse
     */
    public PurchaseOrderResponse sendPurchaseOrder(
            UUID orderId,
            LocalDate expectedDate,
            UUID userId) {
        
        // Step 1: Mark as ordered
        PurchaseOrder order = purchaseOrderService.markOrdered(orderId, expectedDate);
        
        // Step 2: Log activity
        logPurchaseOrderAction(
            userId,
            "PURCHASE_ORDER_SENT",
            order.getId(),
            "Sent purchase order: " + order.getOrderCode() + 
            " to supplier: " + order.getSupplier().getName());
        
        // Step 3: Convert to response
        return toPurchaseOrderResponse(order);
    }
    
    /**
     * Facade Method: Hủy đơn hàng
     * 
     * @param orderId Purchase Order ID
     * @param userId ID của user hủy đơn hàng
     * @param reason Lý do hủy
     * @return PurchaseOrderResponse
     */
    public PurchaseOrderResponse cancelPurchaseOrder(
            UUID orderId,
            UUID userId,
            String reason) {
        
        // Step 1: Cancel order
        PurchaseOrder order = purchaseOrderService.cancelOrder(orderId);
        
        // Step 2: Log activity
        logPurchaseOrderAction(
            userId,
            "PURCHASE_ORDER_CANCELLED",
            order.getId(),
            "Cancelled purchase order: " + order.getOrderCode() + 
            (reason != null ? ". Reason: " + reason : ""));
        
        // Step 3: Convert to response
        return toPurchaseOrderResponse(order);
    }
    
    /**
     * Facade Method: Lấy purchase order với đầy đủ thông tin
     * 
     * @param orderId Purchase Order ID
     * @return PurchaseOrderResponse
     */
    @Transactional(readOnly = true)
    public PurchaseOrderResponse getPurchaseOrder(UUID orderId) {
        PurchaseOrder order = purchaseOrderService.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException(
                    "Purchase order not found: " + orderId));
        
        return toPurchaseOrderResponse(order);
    }
    
    /**
     * Helper: Validate tất cả products trong line items
     */
    private List<Product> validateProducts(List<PurchaseOrderLineRequest> lineItems) {
        return lineItems.stream()
                .map(lineRequest -> {
                    Product product = productService.findById(lineRequest.getProductId())
                            .orElseThrow(() -> new IllegalArgumentException(
                                "Product not found: " + lineRequest.getProductId()));
                    
                    if (!product.isActive()) {
                        throw new IllegalStateException(
                            "Product is not active: " + product.getName());
                    }
                    
                    return product;
                })
                .collect(Collectors.toList());
    }
    
    /**
     * Helper: Log purchase order action
     */
    private void logPurchaseOrderAction(
            UUID userId,
            String action,
            UUID orderId,
            String details) {
        
        SystemLog log = SystemLog.newBuilder()
                .action(action)
                .entityType("PurchaseOrder")
                .entityId(orderId)
                .userId(userId)
                .details(details)
                .createdAt(OffsetDateTime.now())
                .build();
        
        systemLogService.createLog(log);
    }
    
    /**
     * Helper: Convert PurchaseOrder entity to PurchaseOrderResponse DTO
     */
    private PurchaseOrderResponse toPurchaseOrderResponse(PurchaseOrder order) {
        List<com.example.phfbackend.dto.response.PurchaseOrderLineResponse> lineResponses = 
            order.getLineItems().stream()
                .map(line -> com.example.phfbackend.dto.response.PurchaseOrderLineResponse.builder()
                        .id(line.getId())
                        .productId(line.getProduct().getId())
                        .productName(line.getProduct().getName())
                        .productSku(line.getProduct().getSku())
                        .lineNumber(line.getLineNumber())
                        .quantity(line.getQuantity())
                        .unitCost(line.getUnitCost())
                        .lineTotal(line.getUnitCost().multiply(
                            BigDecimal.valueOf(line.getQuantity())))
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

