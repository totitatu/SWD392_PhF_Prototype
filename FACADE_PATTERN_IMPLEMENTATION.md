# Facade Pattern Implementation - PurchaseOrderFacade

## 📋 Tổng quan

Facade Pattern là một Structural Design Pattern cung cấp một interface đơn giản hóa cho một hệ thống phức tạp gồm nhiều subsystems, classes, hoặc libraries. Trong hệ thống quản lý nhà thuốc, Facade Pattern được áp dụng để đơn giản hóa việc tạo và quản lý Purchase Orders.

## 🎯 Vấn đề giải quyết

### Vấn đề: Quá nhiều dependencies và complexity

Khi tạo một Purchase Order, client code phải tương tác với nhiều services:

```java
// ❌ Bad: Client phải biết và gọi nhiều services
@PostMapping
public ResponseEntity<PurchaseOrderResponse> createPurchaseOrder(
        @Valid @RequestBody PurchaseOrderRequest request) {
    
    // Step 1: Validate supplier
    var supplier = supplierRepository.findById(request.getSupplierId())
        .orElseThrow(() -> new IllegalArgumentException("Supplier not found"));
    
    if (!supplier.isActive()) {
        throw new IllegalStateException("Supplier is not active");
    }
    
    // Step 2: Validate products
    for (PurchaseOrderLineRequest lineRequest : request.getLineItems()) {
        var product = productRepository.findById(lineRequest.getProductId())
            .orElseThrow(() -> new IllegalArgumentException("Product not found"));
        
        if (!product.isActive()) {
            throw new IllegalStateException("Product is not active");
        }
    }
    
    // Step 3: Create purchase order
    PurchaseOrder order = PurchaseOrder.newBuilder()
        .orderCode(request.getOrderCode())
        .supplier(supplier)
        .status(PurchaseOrderStatus.DRAFT)
        .orderDate(request.getOrderDate())
        .expectedDate(request.getExpectedDate())
        .build();
    
    // Step 4: Add line items
    for (PurchaseOrderLineRequest lineRequest : request.getLineItems()) {
        var product = productRepository.findById(lineRequest.getProductId())
            .orElseThrow();
        
        PurchaseOrderLine line = PurchaseOrderLine.newBuilder()
            .product(product)
            .quantity(lineRequest.getQuantity())
            .unitCost(lineRequest.getUnitCost())
            .build();
        
        order.addLine(line);
    }
    
    // Step 5: Save
    PurchaseOrder created = purchaseOrderService.createPurchaseOrder(order);
    
    // Step 6: Log activity
    SystemLog log = SystemLog.newBuilder()
        .action("PURCHASE_ORDER_CREATED")
        .entityType("PurchaseOrder")
        .entityId(created.getId())
        .userId(userId)
        .details("Created purchase order: " + created.getOrderCode())
        .build();
    systemLogService.createLog(log);
    
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(toResponse(created));
}
```

**Vấn đề:**
- ❌ Client code phức tạp, dài dòng
- ❌ Phải biết nhiều services và repositories
- ❌ Logic business rải rác trong controller
- ❌ Khó test và maintain
- ❌ Dễ quên các bước (như logging)
- ❌ Tight coupling giữa controller và nhiều services

## ✅ Giải pháp: Facade Pattern

Facade Pattern đơn giản hóa interface bằng cách cung cấp một lớp facade che giấu sự phức tạp:

```java
// ✅ Good: Client chỉ cần gọi một method
@PostMapping
public ResponseEntity<PurchaseOrderResponse> createPurchaseOrder(
        @Valid @RequestBody PurchaseOrderRequest request,
        @RequestHeader("X-User-Id") UUID userId) {
    
    PurchaseOrderResponse response = purchaseOrderFacade
        .createPurchaseOrderWithValidation(request, userId);
    
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
}
```

## 🏗️ Cấu trúc PurchaseOrderFacade

### 1. Facade Class

```java
@Service
@RequiredArgsConstructor
@Transactional
public class PurchaseOrderFacade {
    
    // Dependencies - các subsystems được che giấu
    private final SupplierService supplierService;
    private final ProductService productService;
    private final PurchaseOrderService purchaseOrderService;
    private final InventoryBatchService inventoryBatchService;
    private final SystemLogService systemLogService;
    
    // Facade methods - simplified interface
    public PurchaseOrderResponse createPurchaseOrderWithValidation(...);
    public PurchaseOrderResponse receivePurchaseOrder(...);
    public PurchaseOrderResponse sendPurchaseOrder(...);
    public PurchaseOrderResponse cancelPurchaseOrder(...);
    public PurchaseOrderResponse getPurchaseOrder(...);
}
```

### 2. Subsystems (Các services được che giấu)

- **SupplierService**: Validate và quản lý suppliers
- **ProductService**: Validate và quản lý products
- **PurchaseOrderService**: CRUD operations cho purchase orders
- **InventoryBatchService**: Tạo inventory batches khi nhận hàng
- **SystemLogService**: Logging các hoạt động

## 📝 Implementation Chi tiết

### Method 1: createPurchaseOrderWithValidation

**Mục đích**: Tạo purchase order với đầy đủ validation và logging

```java
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
    
    // Step 2: Validate all products
    List<Product> products = validateProducts(request.getLineItems());
    
    // Step 3: Create purchase order entity
    PurchaseOrder order = PurchaseOrder.newBuilder()
            .orderCode(request.getOrderCode())
            .supplier(supplier)
            .status(PurchaseOrderStatus.DRAFT)
            .orderDate(request.getOrderDate())
            .expectedDate(request.getExpectedDate())
            .build();
    
    // Step 4: Add line items
    for (PurchaseOrderLineRequest lineRequest : request.getLineItems()) {
        Product product = products.stream()
                .filter(p -> p.getId().equals(lineRequest.getProductId()))
                .findFirst()
                .orElseThrow();
        
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
        "Created purchase order: " + saved.getOrderCode());
    
    // Step 7: Convert to response
    return toPurchaseOrderResponse(saved);
}
```

**Lợi ích:**
- ✅ Client chỉ cần gọi 1 method
- ✅ Tất cả validation được thực hiện tự động
- ✅ Logging được thực hiện tự động
- ✅ Business logic tập trung trong facade

### Method 2: receivePurchaseOrder

**Mục đích**: Nhận hàng và tự động tạo inventory

```java
public PurchaseOrderResponse receivePurchaseOrder(UUID orderId, UUID userId) {
    // Step 1: Mark as received (tự động tạo inventory trong service)
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
```

**Lợi ích:**
- ✅ Đơn giản hóa quy trình nhận hàng
- ✅ Tự động tạo inventory (logic trong PurchaseOrderService)
- ✅ Tự động logging

### Method 3: sendPurchaseOrder

**Mục đích**: Gửi đơn hàng (DRAFT → ORDERED)

```java
public PurchaseOrderResponse sendPurchaseOrder(
        UUID orderId,
        LocalDate expectedDate,
        UUID userId) {
    
    PurchaseOrder order = purchaseOrderService.markOrdered(orderId, expectedDate);
    
    logPurchaseOrderAction(
        userId,
        "PURCHASE_ORDER_SENT",
        order.getId(),
        "Sent purchase order: " + order.getOrderCode());
    
    return toPurchaseOrderResponse(order);
}
```

### Method 4: cancelPurchaseOrder

**Mục đích**: Hủy đơn hàng với logging

```java
public PurchaseOrderResponse cancelPurchaseOrder(
        UUID orderId,
        UUID userId,
        String reason) {
    
    PurchaseOrder order = purchaseOrderService.cancelOrder(orderId);
    
    logPurchaseOrderAction(
        userId,
        "PURCHASE_ORDER_CANCELLED",
        order.getId(),
        "Cancelled purchase order: " + order.getOrderCode() + 
        (reason != null ? ". Reason: " + reason : ""));
    
    return toPurchaseOrderResponse(order);
}
```

## 🔄 Sử dụng trong Controller

### Trước khi có Facade

```java
@RestController
@RequestMapping("/api/purchase-orders")
public class PurchaseOrderController {
    
    private final PurchaseOrderService purchaseOrderService;
    private final SupplierRepository supplierRepository;
    private final ProductRepository productRepository;
    private final SystemLogService systemLogService;
    
    @PostMapping
    public ResponseEntity<PurchaseOrderResponse> createPurchaseOrder(
            @Valid @RequestBody PurchaseOrderRequest request) {
        
        // 50+ dòng code phức tạp với nhiều validations
        // ...
    }
}
```

**Vấn đề:**
- Controller quá phức tạp
- Phải inject nhiều dependencies
- Logic business trong controller
- Khó test

### Sau khi có Facade

```java
@RestController
@RequestMapping("/api/purchase-orders")
public class PurchaseOrderController {
    
    private final PurchaseOrderFacade purchaseOrderFacade;
    
    @PostMapping
    public ResponseEntity<PurchaseOrderResponse> createPurchaseOrder(
            @Valid @RequestBody PurchaseOrderRequest request,
            @RequestHeader("X-User-Id") UUID userId) {
        
        PurchaseOrderResponse response = purchaseOrderFacade
            .createPurchaseOrderWithValidation(request, userId);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    @PutMapping("/{id}/receive")
    public ResponseEntity<PurchaseOrderResponse> receiveOrder(
            @PathVariable UUID id,
            @RequestHeader("X-User-Id") UUID userId) {
        
        PurchaseOrderResponse response = purchaseOrderFacade
            .receivePurchaseOrder(id, userId);
        
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/{id}/send")
    public ResponseEntity<PurchaseOrderResponse> sendOrder(
            @PathVariable UUID id,
            @RequestParam(required = false) LocalDate expectedDate,
            @RequestHeader("X-User-Id") UUID userId) {
        
        PurchaseOrderResponse response = purchaseOrderFacade
            .sendPurchaseOrder(id, expectedDate, userId);
        
        return ResponseEntity.ok(response);
    }
    
    @PutMapping("/{id}/cancel")
    public ResponseEntity<PurchaseOrderResponse> cancelOrder(
            @PathVariable UUID id,
            @RequestParam(required = false) String reason,
            @RequestHeader("X-User-Id") UUID userId) {
        
        PurchaseOrderResponse response = purchaseOrderFacade
            .cancelPurchaseOrder(id, userId, reason);
        
        return ResponseEntity.ok(response);
    }
}
```

**Lợi ích:**
- ✅ Controller đơn giản, chỉ delegate cho facade
- ✅ Chỉ cần inject 1 dependency (facade)
- ✅ Logic business trong facade
- ✅ Dễ test (mock facade)

## 🎨 Facade Pattern Structure

```
┌─────────────────────────────────────────────────────────┐
│                    Client (Controller)                   │
│                                                          │
│  purchaseOrderFacade.createPurchaseOrderWithValidation() │
└──────────────────────┬──────────────────────────────────┘
                       │
                       │ Simplified Interface
                       ▼
┌─────────────────────────────────────────────────────────┐
│              PurchaseOrderFacade (Facade)                │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  createPurchaseOrderWithValidation()              │ │
│  │  receivePurchaseOrder()                           │ │
│  │  sendPurchaseOrder()                              │ │
│  │  cancelPurchaseOrder()                            │ │
│  └────────────────────────────────────────────────────┘ │
└──────┬──────────┬──────────┬──────────┬───────────────┘
       │          │          │          │
       │          │          │          │
       ▼          ▼          ▼          ▼
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│Supplier │ │ Product  │ │Purchase  │ │SystemLog │
│Service  │ │Service   │ │Order     │ │Service   │
│         │ │          │ │Service   │ │          │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```

## 📊 So sánh: Với và Không có Facade

### ❌ Không có Facade (Controller phức tạp)

```java
@PostMapping
public ResponseEntity<PurchaseOrderResponse> createPurchaseOrder(
        @Valid @RequestBody PurchaseOrderRequest request) {
    
    // 50+ dòng code
    // Validate supplier
    // Validate products
    // Create order
    // Add line items
    // Save
    // Log
    // Convert to response
}
```

**Vấn đề:**
- ❌ Controller quá phức tạp
- ❌ Nhiều dependencies
- ❌ Logic business trong controller
- ❌ Khó test
- ❌ Dễ quên các bước

### ✅ Có Facade (Controller đơn giản)

```java
@PostMapping
public ResponseEntity<PurchaseOrderResponse> createPurchaseOrder(
        @Valid @RequestBody PurchaseOrderRequest request,
        @RequestHeader("X-User-Id") UUID userId) {
    
    PurchaseOrderResponse response = purchaseOrderFacade
        .createPurchaseOrderWithValidation(request, userId);
    
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
}
```

**Lợi ích:**
- ✅ Controller đơn giản
- ✅ Chỉ 1 dependency
- ✅ Logic business trong facade
- ✅ Dễ test
- ✅ Đảm bảo tất cả bước được thực hiện

## 🎯 Lợi ích của Facade Pattern

### 1. **Simplified Interface**
- Client chỉ cần biết một interface đơn giản
- Che giấu sự phức tạp của subsystems

### 2. **Loose Coupling**
- Client không phụ thuộc trực tiếp vào nhiều subsystems
- Chỉ phụ thuộc vào facade

### 3. **Single Responsibility**
- Facade chịu trách nhiệm điều phối các subsystems
- Controller chỉ chịu trách nhiệm HTTP handling

### 4. **Easier Testing**
- Có thể mock facade thay vì mock nhiều services
- Test facade một cách độc lập

### 5. **Consistency**
- Đảm bảo các bước luôn được thực hiện đúng thứ tự
- Không thể quên các bước quan trọng (như logging)

### 6. **Maintainability**
- Thay đổi logic business chỉ cần sửa facade
- Controller không cần thay đổi

## 🔍 Chi tiết các Facade Methods

### 1. createPurchaseOrderWithValidation

**Workflow:**
```
1. Validate Supplier
   └─> Check supplier exists
   └─> Check supplier is active

2. Validate Products
   └─> Check all products exist
   └─> Check all products are active

3. Create Purchase Order Entity
   └─> Build order with supplier
   └─> Set status to DRAFT

4. Add Line Items
   └─> For each line item:
       └─> Find product
       └─> Create PurchaseOrderLine
       └─> Add to order

5. Save Purchase Order
   └─> Call purchaseOrderService.createPurchaseOrder()

6. Log Activity
   └─> Create SystemLog
   └─> Call systemLogService.createLog()

7. Convert to Response
   └─> Map entity to DTO
   └─> Return PurchaseOrderResponse
```

**Error Handling:**
- Supplier not found → `IllegalArgumentException`
- Supplier inactive → `IllegalStateException`
- Product not found → `IllegalArgumentException`
- Product inactive → `IllegalStateException`
- Duplicate order code → `IllegalArgumentException` (từ service)

### 2. receivePurchaseOrder

**Workflow:**
```
1. Mark as Received
   └─> Call purchaseOrderService.markReceived()
   └─> State Pattern: ORDERED → RECEIVED
   └─> Auto-create inventory batches (trong service)

2. Log Activity
   └─> Log "PURCHASE_ORDER_RECEIVED"
   └─> Include number of batches created

3. Convert to Response
   └─> Return PurchaseOrderResponse
```

**Side Effects:**
- Tự động tạo inventory batches cho tất cả line items
- Cập nhật stock quantity trong database

### 3. sendPurchaseOrder

**Workflow:**
```
1. Mark as Ordered
   └─> Call purchaseOrderService.markOrdered()
   └─> State Pattern: DRAFT → ORDERED

2. Log Activity
   └─> Log "PURCHASE_ORDER_SENT"
   └─> Include supplier name

3. Convert to Response
   └─> Return PurchaseOrderResponse
```

### 4. cancelPurchaseOrder

**Workflow:**
```
1. Cancel Order
   └─> Call purchaseOrderService.cancelOrder()
   └─> State Pattern: DRAFT/ORDERED → CANCELLED

2. Log Activity
   └─> Log "PURCHASE_ORDER_CANCELLED"
   └─> Include cancellation reason (if provided)

3. Convert to Response
   └─> Return PurchaseOrderResponse
```

## 🧪 Testing Facade Pattern

### Unit Test Example

```java
@ExtendWith(MockitoExtension.class)
class PurchaseOrderFacadeTest {
    
    @Mock
    private SupplierService supplierService;
    
    @Mock
    private ProductService productService;
    
    @Mock
    private PurchaseOrderService purchaseOrderService;
    
    @Mock
    private SystemLogService systemLogService;
    
    @InjectMocks
    private PurchaseOrderFacade purchaseOrderFacade;
    
    @Test
    void testCreatePurchaseOrderWithValidation_Success() {
        // Arrange
        UUID supplierId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        
        Supplier supplier = createActiveSupplier(supplierId);
        Product product = createActiveProduct(productId);
        PurchaseOrderRequest request = createPurchaseOrderRequest(supplierId, productId);
        
        when(supplierService.findById(supplierId)).thenReturn(Optional.of(supplier));
        when(productService.findById(productId)).thenReturn(Optional.of(product));
        when(purchaseOrderService.createPurchaseOrder(any())).thenAnswer(invocation -> {
            PurchaseOrder order = invocation.getArgument(0);
            order.setId(UUID.randomUUID());
            return order;
        });
        
        // Act
        PurchaseOrderResponse response = purchaseOrderFacade
            .createPurchaseOrderWithValidation(request, userId);
        
        // Assert
        assertNotNull(response);
        assertEquals(request.getOrderCode(), response.getOrderCode());
        verify(supplierService).findById(supplierId);
        verify(productService).findById(productId);
        verify(purchaseOrderService).createPurchaseOrder(any());
        verify(systemLogService).createLog(any());
    }
    
    @Test
    void testCreatePurchaseOrderWithValidation_InactiveSupplier() {
        // Arrange
        UUID supplierId = UUID.randomUUID();
        Supplier inactiveSupplier = createInactiveSupplier(supplierId);
        PurchaseOrderRequest request = createPurchaseOrderRequest(supplierId, null);
        
        when(supplierService.findById(supplierId))
            .thenReturn(Optional.of(inactiveSupplier));
        
        // Act & Assert
        assertThrows(IllegalStateException.class, () -> {
            purchaseOrderFacade.createPurchaseOrderWithValidation(request, UUID.randomUUID());
        });
        
        verify(supplierService).findById(supplierId);
        verify(purchaseOrderService, never()).createPurchaseOrder(any());
    }
    
    @Test
    void testReceivePurchaseOrder_Success() {
        // Arrange
        UUID orderId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        PurchaseOrder order = createReceivedOrder(orderId);
        
        when(purchaseOrderService.markReceived(orderId)).thenReturn(order);
        
        // Act
        PurchaseOrderResponse response = purchaseOrderFacade
            .receivePurchaseOrder(orderId, userId);
        
        // Assert
        assertNotNull(response);
        assertEquals(PurchaseOrderStatus.RECEIVED, response.getStatus());
        verify(purchaseOrderService).markReceived(orderId);
        verify(systemLogService).createLog(argThat(log -> 
            log.getAction().equals("PURCHASE_ORDER_RECEIVED")));
    }
}
```

## 📋 Helper Methods trong Facade

### validateProducts

```java
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
```

**Lợi ích:**
- ✅ Tái sử dụng validation logic
- ✅ Centralized error messages
- ✅ Dễ test riêng

### logPurchaseOrderAction

```java
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
```

**Lợi ích:**
- ✅ Consistent logging format
- ✅ Tự động set entityType
- ✅ Tự động set timestamp

### toPurchaseOrderResponse

```java
private PurchaseOrderResponse toPurchaseOrderResponse(PurchaseOrder order) {
    List<PurchaseOrderLineResponse> lineResponses = 
        order.getLineItems().stream()
            .map(line -> PurchaseOrderLineResponse.builder()
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
```

**Lợi ích:**
- ✅ Centralized DTO mapping
- ✅ Tính toán lineTotal tự động
- ✅ Tái sử dụng trong nhiều methods

## 🔄 Integration với State Pattern

Facade Pattern hoạt động tốt với State Pattern:

```java
public PurchaseOrderResponse receivePurchaseOrder(UUID orderId, UUID userId) {
    // Facade gọi service, service sử dụng State Pattern
    PurchaseOrder order = purchaseOrderService.markReceived(orderId);
    // ↑ State Pattern xử lý transition ORDERED → RECEIVED
    
    // Facade xử lý side effects (logging)
    logPurchaseOrderAction(...);
    
    return toPurchaseOrderResponse(order);
}
```

**Lợi ích:**
- ✅ Facade che giấu complexity của State Pattern
- ✅ Client không cần biết về states
- ✅ State transitions được xử lý tự động

## 📈 Lợi ích tổng thể

### 1. **Code Organization**
- ✅ Business logic tập trung trong facade
- ✅ Controller chỉ xử lý HTTP concerns
- ✅ Services tập trung vào domain logic

### 2. **Maintainability**
- ✅ Thay đổi workflow chỉ cần sửa facade
- ✅ Dễ thêm bước mới (như email notification)
- ✅ Dễ refactor

### 3. **Testability**
- ✅ Test facade một cách độc lập
- ✅ Mock các services dễ dàng
- ✅ Integration tests đơn giản hơn

### 4. **Consistency**
- ✅ Đảm bảo các bước luôn được thực hiện
- ✅ Không thể quên logging
- ✅ Validation luôn được thực hiện

### 5. **Developer Experience**
- ✅ API đơn giản, dễ sử dụng
- ✅ Ít code hơn trong controller
- ✅ Dễ hiểu workflow

## 🎯 Use Cases phù hợp với Facade

### ✅ Nên sử dụng Facade khi:

1. **Complex Workflows**
   - Quy trình có nhiều bước
   - Cần gọi nhiều services
   - Có side effects (logging, notifications)

2. **Cross-cutting Concerns**
   - Cần logging cho mọi operation
   - Cần validation phức tạp
   - Cần transaction management

3. **API Simplification**
   - Client không cần biết chi tiết implementation
   - Muốn đơn giản hóa interface

4. **Legacy System Integration**
   - Cần wrap legacy code
   - Cần adapter cho external systems

### ❌ Không nên sử dụng Facade khi:

1. **Simple Operations**
   - Chỉ cần gọi 1 service
   - Không có business logic phức tạp

2. **Direct Access Needed**
   - Client cần truy cập trực tiếp vào services
   - Cần fine-grained control

## 📋 Tổng kết

### PurchaseOrderFacade cung cấp:

1. **Simplified Interface**
   - `createPurchaseOrderWithValidation()` - Tạo order với validation
   - `receivePurchaseOrder()` - Nhận hàng và tạo inventory
   - `sendPurchaseOrder()` - Gửi đơn hàng
   - `cancelPurchaseOrder()` - Hủy đơn hàng
   - `getPurchaseOrder()` - Lấy thông tin order

2. **Hidden Complexity**
   - Validation logic
   - State transitions
   - Inventory creation
   - System logging
   - DTO mapping

3. **Consistent Workflow**
   - Đảm bảo tất cả bước được thực hiện
   - Đảm bảo logging luôn được thực hiện
   - Đảm bảo validation luôn được thực hiện

### Lợi ích:

- ✅ **Simplified Client Code**: Controller đơn giản hơn nhiều
- ✅ **Loose Coupling**: Client không phụ thuộc vào nhiều services
- ✅ **Single Responsibility**: Facade chịu trách nhiệm điều phối
- ✅ **Easier Testing**: Mock facade thay vì nhiều services
- ✅ **Consistency**: Đảm bảo workflow đúng
- ✅ **Maintainability**: Dễ thay đổi và mở rộng

Facade Pattern giúp tạo ra một API đơn giản, dễ sử dụng cho các operations phức tạp liên quan đến Purchase Orders, đồng thời che giấu sự phức tạp của việc tương tác với nhiều subsystems.


