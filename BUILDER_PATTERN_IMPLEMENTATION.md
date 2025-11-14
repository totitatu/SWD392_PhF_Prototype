# Builder Pattern Implementation - PharmaFlow Project

## 📋 Tổng quan

Builder Pattern là một Creational Design Pattern cho phép tạo các đối tượng phức tạp từng bước một cách linh hoạt. Trong hệ thống quản lý nhà thuốc, Builder Pattern được sử dụng rộng rãi để tạo entities, DTOs, và các đối tượng phức tạp khác.

## 🎯 Vấn đề giải quyết

### Vấn đề với Constructor truyền thống

Khi tạo đối tượng với nhiều tham số, constructor truyền thống gặp các vấn đề:

```java
// ❌ Bad: Constructor với nhiều tham số - khó đọc, dễ nhầm lẫn
Product product = new Product(
    null,                    // id
    "SKU001",               // sku
    "Paracetamol 500mg",    // name
    "Paracetamol",          // activeIngredient
    "Tablet",               // dosageForm
    "500mg",                // dosageStrength
    ProductCategory.OTC,    // category
    10,                     // reorderLevel
    30,                     // expiryAlertDays
    "500mg Tablet",         // dosage
    5,                      // minStock
    true                    // active
);
// Vấn đề: Khó biết tham số nào là gì, dễ truyền sai thứ tự
```

### Vấn đề với Setter Pattern

```java
// ❌ Bad: Setter pattern - object có thể ở trạng thái không hợp lệ
Product product = new Product();
product.setSku("SKU001");
product.setName("Paracetamol 500mg");
// Quên set các field bắt buộc → object không hợp lệ
// Không thể đảm bảo immutability
```

## ✅ Giải pháp: Builder Pattern

Builder Pattern giải quyết các vấn đề trên bằng cách:
- ✅ Tạo object từng bước với tên method rõ ràng
- ✅ Hỗ trợ optional parameters
- ✅ Validation trong quá trình build
- ✅ Đảm bảo object luôn ở trạng thái hợp lệ
- ✅ Code dễ đọc và bảo trì

## 🏗️ Cấu trúc Builder Pattern trong Project

### 1. Lombok @Builder Annotation

Project sử dụng **Lombok @Builder** để tự động generate builder code, giảm boilerplate code.

#### Cấu hình cơ bản

```java
@Builder(builderMethodName = "newBuilder")
private Product(UUID id, String sku, String name, ...) {
    // Constructor logic với validation
}
```

**Giải thích:**
- `@Builder`: Lombok annotation tự động tạo builder class
- `builderMethodName = "newBuilder"`: Đổi tên method từ `builder()` thành `newBuilder()`
- Constructor `private`: Chỉ có thể tạo object qua builder

#### Code được generate

Lombok tự động generate code tương đương:

```java
// Lombok tự động generate class này
public static class ProductBuilder {
    private UUID id;
    private String sku;
    private String name;
    private String activeIngredient;
    // ... other fields
    
    public ProductBuilder id(UUID id) {
        this.id = id;
        return this;
    }
    
    public ProductBuilder sku(String sku) {
        this.sku = sku;
        return this;
    }
    
    public ProductBuilder name(String name) {
        this.name = name;
        return this;
    }
    
    // ... other setter methods
    
    public Product build() {
        return new Product(id, sku, name, ...);
    }
}

// Static factory method
public static ProductBuilder newBuilder() {
    return new ProductBuilder();
}
```

## 📝 Implementation Examples

### 1. Entity Builders

#### Example 1: Product Entity

```java
@Entity
@Table(name = "products")
@Builder(builderMethodName = "newBuilder")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Product extends AuditableEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false, length = 64)
    private String sku;
    
    @Column(nullable = false, length = 255)
    private String name;
    
    // ... other fields
    
    @Builder(builderMethodName = "newBuilder")
    private Product(UUID id,
                    String sku,
                    String name,
                    String activeIngredient,
                    String dosageForm,
                    String dosageStrength,
                    ProductCategory category,
                    Integer reorderLevel,
                    Integer expiryAlertDays,
                    String dosage,
                    Integer minStock,
                    Boolean active) {
        this.id = id;
        updateDetails(sku, name, activeIngredient, dosageForm, dosageStrength, category);
        configureAlerts(reorderLevel, expiryAlertDays);
        this.dosage = dosage;
        this.minStock = minStock;
        this.active = active != null ? active : true;
    }
}
```

**Sử dụng:**

```java
// ✅ Good: Dễ đọc, rõ ràng từng field
Product product = Product.newBuilder()
    .sku("SKU001")
    .name("Paracetamol 500mg")
    .activeIngredient("Paracetamol")
    .dosageForm("Tablet")
    .dosageStrength("500mg")
    .category(ProductCategory.OTC)
    .reorderLevel(10)
    .expiryAlertDays(30)
    .dosage("500mg Tablet")
    .minStock(5)
    .active(true)
    .build();
```

**Lợi ích:**
- ✅ Tên field rõ ràng, không cần nhớ thứ tự
- ✅ Có thể bỏ qua optional fields (như `id`, `active`)
- ✅ Validation được thực hiện trong constructor

#### Example 2: InventoryBatch Entity

```java
@Entity
@Table(name = "inventory_batches")
@Builder(builderMethodName = "newBuilder")
public class InventoryBatch extends AuditableEntity {
    
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Product product;
    
    @Column(name = "batch_number", nullable = false, length = 64)
    private String batchNumber;
    
    @Column(name = "quantity_on_hand", nullable = false)
    private int quantityOnHand;
    
    @Column(name = "cost_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal costPrice;
    
    @Column(name = "received_date", nullable = false)
    private LocalDate receivedDate;
    
    @Column(name = "expiry_date", nullable = false)
    private LocalDate expiryDate;
    
    @Column(name = "selling_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal sellingPrice;
    
    @Column(nullable = false)
    private boolean active;
    
    @Builder(builderMethodName = "newBuilder")
    private InventoryBatch(UUID id,
                           Product product,
                           String batchNumber,
                           Integer quantityOnHand,
                           BigDecimal costPrice,
                           LocalDate receivedDate,
                           LocalDate expiryDate,
                           BigDecimal sellingPrice,
                           Boolean active) {
        this.id = id;
        this.product = Validation.requireNonNull(product, "product");
        this.batchNumber = Validation.requireNonBlank(batchNumber, "batchNumber");
        this.quantityOnHand = Validation.requirePositive(
            Validation.requireNonNull(quantityOnHand, "quantityOnHand"), 
            "quantityOnHand");
        this.costPrice = Validation.requirePositive(costPrice, "costPrice");
        this.receivedDate = Validation.requireNonNull(receivedDate, "receivedDate");
        this.expiryDate = Validation.requireNonNull(expiryDate, "expiryDate");
        this.sellingPrice = Validation.requirePositive(sellingPrice, "sellingPrice");
        this.active = active != null ? active : true;
        
        // Business rule validation
        if (this.expiryDate.isBefore(this.receivedDate)) {
            throw new IllegalArgumentException(
                "expiryDate must be on or after receivedDate");
        }
    }
}
```

**Sử dụng trong Service:**

```java
// Tạo inventory batch từ purchase order
InventoryBatch batch = InventoryBatch.newBuilder()
    .product(line.getProduct())
    .batchNumber(String.format("%s-L%d", order.getOrderCode(), line.getLineNumber()))
    .quantityOnHand(line.getQuantity())
    .costPrice(line.getUnitCost())
    .receivedDate(LocalDate.now())
    .expiryDate(LocalDate.now().plusYears(2))
    .sellingPrice(line.getUnitCost().multiply(new BigDecimal("1.2")))
    .active(true)
    .build();
```

**Validation được thực hiện:**
- ✅ Kiểm tra `product` không null
- ✅ Kiểm tra `batchNumber` không blank
- ✅ Kiểm tra `quantityOnHand` > 0
- ✅ Kiểm tra `costPrice` > 0
- ✅ Kiểm tra `expiryDate >= receivedDate` (business rule)

#### Example 3: SaleTransaction Entity

```java
@Entity
@Table(name = "sale_transactions")
@Builder(builderMethodName = "newBuilder")
public class SaleTransaction extends AuditableEntity {
    
    @Column(name = "receipt_number", nullable = false, length = 64)
    private String receiptNumber;
    
    @Column(name = "sold_at", nullable = false)
    private OffsetDateTime soldAt;
    
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private PharmacyUser cashier;
    
    @Column(name = "total_discount", precision = 10, scale = 2)
    private BigDecimal totalDiscount;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", length = 32)
    private PaymentMethod paymentMethod;
    
    @OneToMany(mappedBy = "saleTransaction", cascade = CascadeType.ALL)
    private List<SaleTransactionLine> lineItems = new ArrayList<>();
    
    @Builder(builderMethodName = "newBuilder")
    private SaleTransaction(UUID id,
                            String receiptNumber,
                            OffsetDateTime soldAt,
                            PharmacyUser cashier,
                            BigDecimal totalDiscount,
                            PaymentMethod paymentMethod,
                            String prescriptionImageUrl,
                            String customerEmail,
                            List<SaleTransactionLine> lineItems) {
        this.id = id;
        this.receiptNumber = Validation.requireNonBlank(receiptNumber, "receiptNumber");
        this.soldAt = Validation.requireNonNull(soldAt, "soldAt");
        this.cashier = Validation.requireNonNull(cashier, "cashier");
        this.totalDiscount = totalDiscount;
        this.paymentMethod = paymentMethod;
        this.prescriptionImageUrl = prescriptionImageUrl;
        this.customerEmail = customerEmail;
        if (lineItems != null) {
            lineItems.forEach(this::addLine);
        }
    }
}
```

**Sử dụng trong Controller:**

```java
SaleTransaction transaction = SaleTransaction.newBuilder()
    .receiptNumber(generateReceiptNumber())
    .soldAt(request.getSoldAt() != null ? request.getSoldAt() : OffsetDateTime.now())
    .cashier(cashier)
    .totalDiscount(request.getTotalDiscount())
    .paymentMethod(request.getPaymentMethod())
    .prescriptionImageUrl(request.getPrescriptionImageUrl())
    .customerEmail(request.getCustomerEmail())
    .build();

// Sau đó thêm line items
for (SaleTransactionLineRequest lineRequest : request.getLineItems()) {
    SaleTransactionLine line = SaleTransactionLine.newBuilder()
        .product(batch.getProduct())
        .inventoryBatch(batch)
        .quantity(lineRequest.getQuantity())
        .unitPrice(lineRequest.getUnitPrice())
        .build();
    transaction.addLine(line);
}
```

### 2. DTO Builders

#### Example: ProductResponse DTO

```java
@Data
@Builder
public class ProductResponse {
    private UUID id;
    private String sku;
    private String name;
    private String activeIngredient;
    private String dosageForm;
    private String dosageStrength;
    private ProductCategory category;
    private Integer reorderLevel;
    private Integer expiryAlertDays;
    private String dosage;
    private Integer minStock;
    private boolean active;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
```

**Sử dụng trong Controller:**

```java
private ProductResponse toResponse(Product product) {
    return ProductResponse.builder()
        .id(product.getId())
        .sku(product.getSku())
        .name(product.getName())
        .activeIngredient(product.getActiveIngredient())
        .dosageForm(product.getDosageForm())
        .dosageStrength(product.getDosageStrength())
        .category(product.getCategory())
        .reorderLevel(product.getReorderLevel())
        .expiryAlertDays(product.getExpiryAlertDays())
        .dosage(product.getDosage())
        .minStock(product.getMinStock())
        .active(product.isActive())
        .createdAt(product.getCreatedAt())
        .updatedAt(product.getUpdatedAt())
        .build();
}
```

**Lợi ích:**
- ✅ Dễ map từ Entity sang DTO
- ✅ Có thể thêm computed fields dễ dàng
- ✅ Code rõ ràng, dễ maintain

#### Example: AlertResponse DTO

```java
@Data
@Builder
public class AlertResponse {
    private String type; // "low-stock" or "expiry"
    private String severity; // "critical" or "warning"
    private UUID productId;
    private String productName;
    private String productSku;
    private UUID inventoryBatchId;
    private String batchNumber;
    private Integer currentStock;
    private Integer threshold;
    private LocalDate expiryDate;
    private Integer daysUntilExpiry;
    private String message;
}
```

**Sử dụng:**

```java
AlertResponse alert = AlertResponse.builder()
    .type("low-stock")
    .severity(totalStock == 0 ? "critical" : "warning")
    .productId(productId)
    .productName(product.getName())
    .productSku(product.getSku())
    .currentStock(totalStock)
    .threshold(threshold)
    .message(String.format("Low stock alert: %s (Current: %d, Threshold: %d)", 
            product.getName(), totalStock, threshold))
    .build();
```

### 3. Filter Criteria Builders

#### Example: ProductFilterCriteria

```java
@Data
@Builder
public class ProductFilterCriteria {
    private String searchTerm;
    private ProductCategory category;
    private Boolean active;
    private UUID supplierId;
}
```

**Sử dụng:**

```java
ProductFilterCriteria criteria = ProductFilterCriteria.builder()
    .searchTerm("paracetamol")
    .category(ProductCategory.OTC)
    .active(true)
    .build();
```

## 🔍 Validation trong Builder Pattern

### Validation Strategy

Project sử dụng class `Validation` để centralize validation logic:

```java
public class Validation {
    public static <T> T requireNonNull(T value, String fieldName) {
        if (value == null) {
            throw new IllegalArgumentException(fieldName + " must not be null");
        }
        return value;
    }
    
    public static String requireNonBlank(String value, String fieldName) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException(fieldName + " must not be blank");
        }
        return value;
    }
    
    public static int requirePositive(int value, String fieldName) {
        if (value <= 0) {
            throw new IllegalArgumentException(fieldName + " must be positive");
        }
        return value;
    }
    
    public static BigDecimal requirePositive(BigDecimal value, String fieldName) {
        if (value == null || value.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException(fieldName + " must be positive");
        }
        return value;
    }
    
    public static int requirePositiveOrZero(int value, String fieldName) {
        if (value < 0) {
            throw new IllegalArgumentException(fieldName + " must be positive or zero");
        }
        return value;
    }
}
```

### Validation trong Constructor

```java
@Builder(builderMethodName = "newBuilder")
private InventoryBatch(UUID id,
                       Product product,
                       String batchNumber,
                       Integer quantityOnHand,
                       BigDecimal costPrice,
                       LocalDate receivedDate,
                       LocalDate expiryDate,
                       BigDecimal sellingPrice,
                       Boolean active) {
    // Required field validation
    this.product = Validation.requireNonNull(product, "product");
    this.batchNumber = Validation.requireNonBlank(batchNumber, "batchNumber");
    
    // Positive number validation
    this.quantityOnHand = Validation.requirePositive(
        Validation.requireNonNull(quantityOnHand, "quantityOnHand"), 
        "quantityOnHand");
    this.costPrice = Validation.requirePositive(costPrice, "costPrice");
    this.sellingPrice = Validation.requirePositive(sellingPrice, "sellingPrice");
    
    // Date validation
    this.receivedDate = Validation.requireNonNull(receivedDate, "receivedDate");
    this.expiryDate = Validation.requireNonNull(expiryDate, "expiryDate");
    
    // Business rule validation
    if (this.expiryDate.isBefore(this.receivedDate)) {
        throw new IllegalArgumentException(
            "expiryDate must be on or after receivedDate");
    }
    
    // Default value
    this.active = active != null ? active : true;
}
```

## 🎨 Advanced Builder Patterns

### 1. Fluent Interface với Method Chaining

Builder Pattern tự nhiên hỗ trợ fluent interface:

```java
// Method chaining - dễ đọc, tự nhiên
Product product = Product.newBuilder()
    .sku("SKU001")
    .name("Paracetamol 500mg")
    .activeIngredient("Paracetamol")
    .dosageForm("Tablet")
    .dosageStrength("500mg")
    .category(ProductCategory.OTC)
    .reorderLevel(10)
    .expiryAlertDays(30)
    .build();
```

### 2. Optional Parameters

Builder Pattern xử lý optional parameters một cách tự nhiên:

```java
// Có thể bỏ qua optional fields
Product product = Product.newBuilder()
    .sku("SKU001")
    .name("Paracetamol 500mg")
    .activeIngredient("Paracetamol")
    .dosageForm("Tablet")
    .dosageStrength("500mg")
    .category(ProductCategory.OTC)
    // .reorderLevel(10)  // Optional - có thể bỏ qua
    // .expiryAlertDays(30)  // Optional
    // .active(true)  // Optional - có default value
    .build();
```

### 3. Default Values

```java
@Builder(builderMethodName = "newBuilder")
private Product(..., Boolean active) {
    // ...
    this.active = active != null ? active : true;  // Default value
}
```

### 4. Complex Object Construction

Builder Pattern đặc biệt hữu ích khi tạo object phức tạp với nested objects:

```java
// Tạo SaleTransaction với nhiều line items
SaleTransaction transaction = SaleTransaction.newBuilder()
    .receiptNumber("REC-20250113-001")
    .soldAt(OffsetDateTime.now())
    .cashier(cashier)
    .paymentMethod(PaymentMethod.CASH)
    .build();

// Thêm line items
for (SaleTransactionLineRequest lineRequest : request.getLineItems()) {
    var batch = inventoryBatchRepository.findByIdWithProduct(
        lineRequest.getInventoryBatchId());
    
    SaleTransactionLine line = SaleTransactionLine.newBuilder()
        .product(batch.getProduct())
        .inventoryBatch(batch)
        .quantity(lineRequest.getQuantity())
        .unitPrice(lineRequest.getUnitPrice())
        .build();
    
    transaction.addLine(line);
}
```

## 📊 So sánh các cách tiếp cận

### ❌ Constructor với nhiều tham số

```java
// Bad: Khó đọc, dễ nhầm lẫn
Product product = new Product(
    null, "SKU001", "Paracetamol 500mg", "Paracetamol", 
    "Tablet", "500mg", ProductCategory.OTC, 10, 30, 
    "500mg Tablet", 5, true
);
```

**Vấn đề:**
- ❌ Khó biết tham số nào là gì
- ❌ Dễ truyền sai thứ tự
- ❌ Khó maintain khi thêm field mới
- ❌ Không hỗ trợ optional parameters tốt

### ❌ Setter Pattern

```java
// Bad: Object có thể ở trạng thái không hợp lệ
Product product = new Product();
product.setSku("SKU001");
product.setName("Paracetamol 500mg");
// Quên set required fields → object không hợp lệ
```

**Vấn đề:**
- ❌ Không đảm bảo object luôn hợp lệ
- ❌ Không thể làm immutable
- ❌ Khó validate toàn bộ object

### ✅ Builder Pattern

```java
// Good: Rõ ràng, an toàn, dễ đọc
Product product = Product.newBuilder()
    .sku("SKU001")
    .name("Paracetamol 500mg")
    .activeIngredient("Paracetamol")
    .dosageForm("Tablet")
    .dosageStrength("500mg")
    .category(ProductCategory.OTC)
    .reorderLevel(10)
    .expiryAlertDays(30)
    .build();
```

**Lợi ích:**
- ✅ Tên field rõ ràng
- ✅ Validation trong constructor
- ✅ Hỗ trợ optional parameters
- ✅ Code dễ đọc và maintain
- ✅ Type-safe

## 🎯 Best Practices

### 1. Sử dụng `builderMethodName = "newBuilder"`

```java
@Builder(builderMethodName = "newBuilder")
```

**Lý do:**
- Tránh conflict với method `builder()` của Lombok
- Tên method rõ ràng hơn: `Product.newBuilder()` vs `Product.builder()`
- Phù hợp với naming convention của project

### 2. Constructor `private`

```java
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder(builderMethodName = "newBuilder")
private Product(...) {
    // Constructor logic
}
```

**Lý do:**
- Chỉ có thể tạo object qua builder
- Đảm bảo validation luôn được thực hiện
- Tránh tạo object không hợp lệ

### 3. Validation trong Constructor

```java
@Builder(builderMethodName = "newBuilder")
private InventoryBatch(...) {
    this.product = Validation.requireNonNull(product, "product");
    this.quantityOnHand = Validation.requirePositive(quantityOnHand, "quantityOnHand");
    
    // Business rules
    if (expiryDate.isBefore(receivedDate)) {
        throw new IllegalArgumentException("expiryDate must be >= receivedDate");
    }
}
```

**Lý do:**
- Đảm bảo object luôn ở trạng thái hợp lệ
- Fail-fast: Phát hiện lỗi sớm
- Centralized validation logic

### 4. Default Values

```java
@Builder(builderMethodName = "newBuilder")
private Product(..., Boolean active) {
    // ...
    this.active = active != null ? active : true;  // Default value
}
```

**Lý do:**
- Giảm số lượng parameters cần truyền
- Có thể bỏ qua optional fields
- Đảm bảo object có giá trị hợp lệ

### 5. Immutability (Khi cần)

```java
@Getter
@Builder
public class ProductResponse {
    private final UUID id;
    private final String sku;
    private final String name;
    // ... final fields
}
```

**Lý do:**
- Thread-safe
- Tránh thay đổi không mong muốn
- Dễ reason về code

## 📈 Lợi ích của Builder Pattern

### 1. **Readability**
- Code dễ đọc, tự mô tả
- Tên field rõ ràng, không cần comment

### 2. **Flexibility**
- Hỗ trợ optional parameters
- Có thể thêm field mới mà không break code cũ

### 3. **Type Safety**
- Compiler kiểm tra type
- Tránh lỗi runtime

### 4. **Validation**
- Validation tập trung trong constructor
- Đảm bảo object luôn hợp lệ

### 5. **Maintainability**
- Dễ thêm/sửa/xóa fields
- Code dễ test

### 6. **Immutability Support**
- Có thể tạo immutable objects
- Thread-safe

## 🔄 Sử dụng trong các Layer

### Controller Layer

```java
@PostMapping
public ResponseEntity<ProductResponse> createProduct(
        @Valid @RequestBody ProductRequest request) {
    
    Product product = Product.newBuilder()
        .sku(request.getSku())
        .name(request.getName())
        .activeIngredient(request.getActiveIngredient())
        .dosageForm(request.getDosageForm())
        .dosageStrength(request.getDosageStrength())
        .category(request.getCategory())
        .reorderLevel(request.getReorderLevel())
        .expiryAlertDays(request.getExpiryAlertDays())
        .dosage(request.getDosage())
        .minStock(request.getMinStock())
        .active(request.getActive() != null ? request.getActive() : true)
        .build();
    
    Product created = productService.createProduct(product);
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(toResponse(created));
}
```

### Service Layer

```java
@Service
public class PurchaseOrderServiceImpl {
    
    private void createInventoryBatchesFromOrder(PurchaseOrder order) {
        LocalDate receivedDate = LocalDate.now();
        
        for (PurchaseOrderLine line : order.getLineItems()) {
            InventoryBatch batch = InventoryBatch.newBuilder()
                .product(line.getProduct())
                .batchNumber(String.format("%s-L%d", 
                    order.getOrderCode(), line.getLineNumber()))
                .quantityOnHand(line.getQuantity())
                .costPrice(line.getUnitCost())
                .receivedDate(receivedDate)
                .expiryDate(receivedDate.plusYears(2))
                .sellingPrice(line.getUnitCost().multiply(new BigDecimal("1.2")))
                .active(true)
                .build();
            
            inventoryBatchService.createBatch(batch);
        }
    }
}
```

### DTO Mapping

```java
private ProductResponse toResponse(Product product) {
    return ProductResponse.builder()
        .id(product.getId())
        .sku(product.getSku())
        .name(product.getName())
        .activeIngredient(product.getActiveIngredient())
        .dosageForm(product.getDosageForm())
        .dosageStrength(product.getDosageStrength())
        .category(product.getCategory())
        .reorderLevel(product.getReorderLevel())
        .expiryAlertDays(product.getExpiryAlertDays())
        .dosage(product.getDosage())
        .minStock(product.getMinStock())
        .active(product.isActive())
        .createdAt(product.getCreatedAt())
        .updatedAt(product.getUpdatedAt())
        .build();
}
```

## 🧪 Testing với Builder Pattern

### Unit Test Example

```java
@Test
void testProductBuilder() {
    Product product = Product.newBuilder()
        .sku("SKU001")
        .name("Paracetamol 500mg")
        .activeIngredient("Paracetamol")
        .dosageForm("Tablet")
        .dosageStrength("500mg")
        .category(ProductCategory.OTC)
        .reorderLevel(10)
        .expiryAlertDays(30)
        .build();
    
    assertEquals("SKU001", product.getSku());
    assertEquals("Paracetamol 500mg", product.getName());
    assertEquals(ProductCategory.OTC, product.getCategory());
    assertTrue(product.isActive());  // Default value
}

@Test
void testProductBuilderValidation() {
    assertThrows(IllegalArgumentException.class, () -> {
        Product.newBuilder()
            .sku("")  // Blank - should fail
            .name("Paracetamol")
            .activeIngredient("Paracetamol")
            .dosageForm("Tablet")
            .dosageStrength("500mg")
            .category(ProductCategory.OTC)
            .build();
    });
}

@Test
void testInventoryBatchBuilderBusinessRule() {
    LocalDate receivedDate = LocalDate.now();
    LocalDate expiryDate = receivedDate.minusDays(1);  // Invalid: expiry before received
    
    assertThrows(IllegalArgumentException.class, () -> {
        InventoryBatch.newBuilder()
            .product(product)
            .batchNumber("BATCH001")
            .quantityOnHand(100)
            .costPrice(new BigDecimal("10.00"))
            .receivedDate(receivedDate)
            .expiryDate(expiryDate)  // Should fail validation
            .sellingPrice(new BigDecimal("12.00"))
            .build();
    });
}
```

## 📋 Tổng kết

### Entities sử dụng Builder Pattern

1. **Product** - Tạo sản phẩm với validation
2. **InventoryBatch** - Tạo batch với business rules
3. **SaleTransaction** - Tạo giao dịch bán hàng
4. **SaleTransactionLine** - Tạo line item trong giao dịch
5. **PurchaseOrder** - Tạo đơn đặt hàng
6. **PurchaseOrderLine** - Tạo line item trong đơn hàng
7. **Supplier** - Tạo nhà cung cấp
8. **PharmacyUser** - Tạo người dùng
9. **SystemLog** - Tạo log entry

### DTOs sử dụng Builder Pattern

1. **ProductResponse** - Response DTO cho Product
2. **InventoryBatchResponse** - Response DTO cho InventoryBatch
3. **SaleTransactionResponse** - Response DTO cho SaleTransaction
4. **PurchaseOrderResponse** - Response DTO cho PurchaseOrder
5. **AlertResponse** - Response DTO cho Alerts
6. **POSProductResponse** - Response DTO cho POS
7. Tất cả FilterCriteria classes

### Lợi ích tổng thể

- ✅ **Code Quality**: Code sạch, dễ đọc, dễ maintain
- ✅ **Type Safety**: Compiler kiểm tra type
- ✅ **Validation**: Centralized validation logic
- ✅ **Flexibility**: Hỗ trợ optional parameters
- ✅ **Consistency**: Cùng một pattern cho tất cả entities/DTOs
- ✅ **Developer Experience**: Dễ sử dụng, ít lỗi

Builder Pattern là một trong những pattern được sử dụng nhiều nhất trong project, góp phần quan trọng vào việc tạo ra codebase sạch, maintainable và robust.


