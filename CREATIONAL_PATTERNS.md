# Design Patterns Nhóm Creational - PharmaFlow Project

## 📋 Mục lục

- [Tổng quan](#tổng-quan)
- [Patterns đang sử dụng](#patterns-đang-sử-dụng)
- [Gợi ý áp dụng các Creational Patterns](#gợi-ý-áp-dụng-các-creational-patterns)
  - [1. Builder Pattern](#1-builder-pattern)
  - [2. Factory Pattern](#2-factory-pattern)
  - [3. Abstract Factory Pattern](#3-abstract-factory-pattern)
  - [4. Singleton Pattern](#4-singleton-pattern)
  - [5. Prototype Pattern](#5-prototype-pattern)

---

## 🎯 Tổng quan

**Creational Patterns** là nhóm design patterns tập trung vào cách tạo đối tượng (objects) một cách linh hoạt và hiệu quả. Chúng giúp:
- Tách biệt logic tạo đối tượng khỏi logic sử dụng
- Tăng tính linh hoạt trong việc tạo đối tượng
- Giảm coupling giữa các lớp
- Tối ưu hóa việc quản lý tài nguyên

---

## ✅ Patterns đang sử dụng

### 1. Builder Pattern (Đã áp dụng)

**Vị trí sử dụng:**
- **Entities**: `Product`, `Supplier`, `SaleTransaction`, `PurchaseOrder`, `InventoryBatch`
- **DTOs**: `ProductResponse`, `SupplierResponse`, `GeminiResponse`, `PurchaseOrderResponse`
- **Filter Criteria**: `ProductFilterCriteria`, `SupplierFilterCriteria`

**Ví dụ hiện tại:**

```java
// Product.java
@Builder(builderMethodName = "newBuilder")
private Product(UUID id, String sku, String name, ...) {
    // Constructor logic
}

// Sử dụng trong Controller
Product product = Product.newBuilder()
    .sku(request.getSku())
    .name(request.getName())
    .activeIngredient(request.getActiveIngredient())
    .build();
```

**Lợi ích:**
- ✅ Tạo objects với nhiều tham số dễ đọc
- ✅ Hỗ trợ optional parameters
- ✅ Immutable objects
- ✅ Validation trong builder

---

## 🚀 Gợi ý áp dụng các Creational Patterns

---

## 1. Builder Pattern

### 📍 Nơi có thể mở rộng

#### 1.1. Entity Builders với Validation nâng cao

**Vấn đề hiện tại:**
- Builder hiện tại đã tốt nhưng có thể thêm validation phức tạp hơn
- Cần builder cho các trường hợp đặc biệt (ví dụ: tạo product từ import file)

**Đề xuất: Cải thiện ProductBuilder**

```java
// ProductBuilder.java - Tạo class riêng cho builder phức tạp
public class ProductBuilder {
    private UUID id;
    private String sku;
    private String name;
    private ProductCategory category;
    // ... other fields
    
    public ProductBuilder withSku(String sku) {
        this.sku = Validation.requireNonBlank(sku, "sku");
        return this;
    }
    
    public ProductBuilder withCategory(ProductCategory category) {
        this.category = Validation.requireNonNull(category, "category");
        return this;
    }
    
    // Builder cho trường hợp import từ file
    public ProductBuilder fromImportData(Map<String, String> importData) {
        this.sku = importData.get("sku");
        this.name = importData.get("name");
        // Parse và validate từ import data
        return this;
    }
    
    // Builder cho trường hợp tạo từ Gemini suggestion
    public ProductBuilder fromGeminiSuggestion(String geminiJson) {
        // Parse JSON từ Gemini và map vào builder
        return this;
    }
    
    public Product build() {
        // Validation phức tạp trước khi build
        validateProduct();
        return Product.newBuilder()
            .id(id)
            .sku(sku)
            .name(name)
            // ... set all fields
            .build();
    }
    
    private void validateProduct() {
        // Complex validation logic
        if (category == ProductCategory.PRESCRIPTION && reorderLevel == null) {
            throw new IllegalArgumentException("Prescription products must have reorder level");
        }
    }
}
```

**Áp dụng vào:**
- `ProductController.createProduct()` - Khi tạo product từ nhiều nguồn khác nhau
- `ProductController.editProductWithGemini()` - Khi parse suggestion từ Gemini
- Import/Export functionality

#### 1.2. DTO Builders với Transformation

**Đề xuất: ResponseBuilder cho complex DTOs**

```java
// PurchaseOrderResponseBuilder.java
public class PurchaseOrderResponseBuilder {
    private PurchaseOrder order;
    
    public PurchaseOrderResponseBuilder fromEntity(PurchaseOrder order) {
        this.order = order;
        return this;
    }
    
    // Builder với tính toán tự động
    public PurchaseOrderResponseBuilder withCalculatedTotals() {
        // Tính toán totals, taxes, etc.
        return this;
    }
    
    // Builder với format đặc biệt
    public PurchaseOrderResponseBuilder withFormattedDates(String format) {
        // Format dates theo yêu cầu
        return this;
    }
    
    public PurchaseOrderResponse build() {
        return PurchaseOrderResponse.builder()
            .id(order.getId())
            .orderCode(order.getOrderCode())
            // ... với các tính toán đã được thực hiện
            .build();
    }
}
```

**Áp dụng vào:**
- `PurchaseOrderController.toResponse()` - Khi cần format phức tạp
- `SaleTransactionController.toResponse()` - Tính toán totals, taxes
- Report generation

---

## 2. Factory Pattern

### 📍 Nơi áp dụng

#### 2.1. Entity Factory - Tạo Entities từ DTOs

**Vấn đề hiện tại:**
- Controllers đang tự tạo entities từ DTOs
- Logic tạo entity rải rác ở nhiều nơi
- Khó maintain và test

**Đề xuất: EntityFactory**

```java
// EntityFactory.java
@Component
public class EntityFactory {
    
    private final ProductRepository productRepository;
    private final SupplierRepository supplierRepository;
    
    // Factory method cho Product
    public Product createProduct(ProductRequest request) {
        // Validate SKU uniqueness
        if (productRepository.findBySku(request.getSku()).isPresent()) {
            throw new IllegalArgumentException("SKU already exists");
        }
        
        return Product.newBuilder()
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
    }
    
    // Factory method cho PurchaseOrder
    public PurchaseOrder createPurchaseOrder(
            PurchaseOrderRequest request,
            Supplier supplier) {
        
        PurchaseOrder order = PurchaseOrder.newBuilder()
            .orderCode(generateOrderCode())
            .supplier(supplier)
            .status(PurchaseOrderStatus.DRAFT)
            .orderDate(LocalDate.now())
            .build();
        
        // Tạo line items
        for (PurchaseOrderLineRequest lineRequest : request.getLineItems()) {
            Product product = productRepository.findById(lineRequest.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));
            
            PurchaseOrderLine line = PurchaseOrderLine.newBuilder()
                .product(product)
                .quantity(lineRequest.getQuantity())
                .unitCost(lineRequest.getUnitCost())
                .build();
            
            order.addLine(line);
        }
        
        return order;
    }
    
    // Factory method cho SaleTransaction
    public SaleTransaction createSaleTransaction(
            SaleTransactionRequest request,
            PharmacyUser user) {
        
        SaleTransaction transaction = SaleTransaction.newBuilder()
            .receiptNumber(generateReceiptNumber())
            .soldBy(user)
            .saleDate(LocalDate.now())
            .paymentMethod(request.getPaymentMethod())
            .prescriptionImageUrl(request.getPrescriptionImageUrl())
            .build();
        
        // Tạo line items với inventory deduction
        for (SaleTransactionLineRequest lineRequest : request.getLineItems()) {
            // Logic tạo sale line với inventory check
            SaleTransactionLine line = createSaleLine(lineRequest);
            transaction.addLine(line);
        }
        
        return transaction;
    }
    
    private String generateOrderCode() {
        return "PO-" + System.currentTimeMillis();
    }
    
    private String generateReceiptNumber() {
        return "RCP-" + System.currentTimeMillis();
    }
}
```

**Áp dụng vào:**
- `ProductController.createProduct()` → `entityFactory.createProduct(request)`
- `PurchaseOrderController.createPurchaseOrder()` → `entityFactory.createPurchaseOrder(request, supplier)`
- `SaleTransactionController.createSale()` → `entityFactory.createSaleTransaction(request, user)`

**Lợi ích: Tách logic tạo entity, dễ test, dễ maintain

#### 2.2. DTO Factory - Tạo DTOs từ Entities

**Đề xuất: DTOFactory**

```java
// DTOFactory.java
@Component
public class DTOFactory {
    
    // Factory method cho ProductResponse
    public ProductResponse createProductResponse(Product product) {
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
    
    // Factory method với inventory info
    public POSProductResponse createPOSProductResponse(
            Product product, 
            List<InventoryBatch> batches) {
        
        int stockQuantity = batches.stream()
            .filter(InventoryBatch::isActive)
            .filter(b -> b.getQuantityOnHand() > 0)
            .mapToInt(InventoryBatch::getQuantityOnHand)
            .sum();
        
        BigDecimal sellingPrice = batches.isEmpty() 
            ? BigDecimal.ZERO 
            : batches.get(0).getSellingPrice();
        
        return POSProductResponse.builder()
            .id(product.getId())
            .sku(product.getSku())
            .name(product.getName())
            .sellingPrice(sellingPrice)
            .stockQuantity(stockQuantity)
            .available(stockQuantity > 0)
            .build();
    }
    
    // Factory method cho PurchaseOrderResponse với tính toán
    public PurchaseOrderResponse createPurchaseOrderResponse(PurchaseOrder order) {
        List<PurchaseOrderLineResponse> lineResponses = order.getLineItems().stream()
            .map(this::createLineResponse)
            .collect(Collectors.toList());
        
        BigDecimal totalAmount = lineResponses.stream()
            .map(PurchaseOrderLineResponse::getLineTotal)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        return PurchaseOrderResponse.builder()
            .id(order.getId())
            .orderCode(order.getOrderCode())
            .supplierId(order.getSupplier().getId())
            .supplierName(order.getSupplier().getName())
            .status(order.getStatus())
            .orderDate(order.getOrderDate())
            .expectedDate(order.getExpectedDate())
            .lineItems(lineResponses)
            .totalAmount(totalAmount) // Calculated field
            .createdAt(order.getCreatedAt())
            .updatedAt(order.getUpdatedAt())
            .build();
    }
    
    private PurchaseOrderLineResponse createLineResponse(PurchaseOrderLine line) {
        return PurchaseOrderLineResponse.builder()
            .id(line.getId())
            .productId(line.getProduct().getId())
            .productName(line.getProduct().getName())
            .productSku(line.getProduct().getSku())
            .lineNumber(line.getLineNumber())
            .quantity(line.getQuantity())
            .unitCost(line.getUnitCost())
            .lineTotal(line.getUnitCost().multiply(BigDecimal.valueOf(line.getQuantity())))
            .build();
    }
}
```

**Áp dụng vào:**
- Tất cả các `toResponse()` methods trong Controllers
- `POSController.toPOSResponse()` → `dtoFactory.createPOSProductResponse(product, batches)`
- `PurchaseOrderController.toResponse()` → `dtoFactory.createPurchaseOrderResponse(order)`

**Lợi ích:**
- Tách logic mapping khỏi controllers
- Dễ test và maintain
- Có thể cache hoặc optimize mapping

#### 2.3. Service Factory - Tạo Services theo điều kiện

**Đề xuất: ReportServiceFactory**

```java
// ReportServiceFactory.java
@Component
public class ReportServiceFactory {
    
    private final ProductService productService;
    private final SaleTransactionService saleService;
    private final InventoryBatchService inventoryService;
    
    // Factory method tạo report service theo type
    public ReportGenerator createReportGenerator(ReportType type) {
        switch (type) {
            case SALES:
                return new SalesReportGenerator(saleService);
            case INVENTORY:
                return new InventoryReportGenerator(inventoryService);
            case PRODUCTS:
                return new ProductReportGenerator(productService);
            case FINANCIAL:
                return new FinancialReportGenerator(saleService, inventoryService);
            default:
                throw new IllegalArgumentException("Unknown report type: " + type);
        }
    }
}

// ReportGenerator interface
public interface ReportGenerator {
    byte[] generateReport(ReportRequest request);
    String getReportFormat();
}

// SalesReportGenerator.java
public class SalesReportGenerator implements ReportGenerator {
    private final SaleTransactionService saleService;
    
    @Override
    public byte[] generateReport(ReportRequest request) {
        // Generate sales report
        List<SaleTransaction> sales = saleService.findByDateRange(
            request.getStartDate(), 
            request.getEndDate()
        );
        // Generate PDF/Excel
        return generatePDF(sales);
    }
    
    @Override
    public String getReportFormat() {
        return "PDF";
    }
}
```

**Áp dụng vào:**
- `ReportsPage` - Tạo các loại report khác nhau
- Export functionality - PDF, Excel, CSV

---

## 3. Abstract Factory Pattern

### 📍 Nơi áp dụng

#### 3.1. Report Generator Factory

**Vấn đề:**
- Cần tạo nhiều loại report (Sales, Inventory, Financial)
- Mỗi report có format khác nhau (PDF, Excel, CSV)
- Cần tách biệt logic tạo report

**Đề xuất: ReportFactory với Abstract Factory**

```java
// ReportFactory.java - Abstract Factory
public interface ReportFactory {
    ReportGenerator createGenerator();
    ReportExporter createExporter();
    ReportFormatter createFormatter();
}

// PDFReportFactory.java
@Component
public class PDFReportFactory implements ReportFactory {
    
    @Override
    public ReportGenerator createGenerator() {
        return new PDFReportGenerator();
    }
    
    @Override
    public ReportExporter createExporter() {
        return new PDFExporter();
    }
    
    @Override
    public ReportFormatter createFormatter() {
        return new PDFFormatter();
    }
}

// ExcelReportFactory.java
@Component
public class ExcelReportFactory implements ReportFactory {
    
    @Override
    public ReportGenerator createGenerator() {
        return new ExcelReportGenerator();
    }
    
    @Override
    public ReportExporter createExporter() {
        return new ExcelExporter();
    }
    
    @Override
    public ReportFormatter createFormatter() {
        return new ExcelFormatter();
    }
}

// ReportService.java - Sử dụng Abstract Factory
@Service
public class ReportService {
    
    private final Map<ReportFormat, ReportFactory> factories;
    
    public ReportService(List<ReportFactory> factories) {
        this.factories = factories.stream()
            .collect(Collectors.toMap(
                f -> f.createExporter().getFormat(),
                f -> f
            ));
    }
    
    public byte[] generateReport(ReportRequest request) {
        ReportFactory factory = factories.get(request.getFormat());
        if (factory == null) {
            throw new IllegalArgumentException("Unsupported format: " + request.getFormat());
        }
        
        ReportGenerator generator = factory.createGenerator();
        ReportFormatter formatter = factory.createFormatter();
        ReportExporter exporter = factory.createExporter();
        
        // Generate report
        ReportData data = generator.generate(request);
        String formatted = formatter.format(data);
        return exporter.export(formatted);
    }
}
```

**Áp dụng vào:**
- `ReportsPage` - Export reports với nhiều format
- `ReportsPage.exportReport()` - Chọn format (PDF, Excel, CSV)

#### 3.2. Notification Factory

**Đề xuất: NotificationFactory cho các loại notification**

```java
// NotificationFactory.java - Abstract Factory
public interface NotificationFactory {
    NotificationSender createSender();
    NotificationTemplate createTemplate();
    NotificationValidator createValidator();
}

// EmailNotificationFactory.java
@Component
public class EmailNotificationFactory implements NotificationFactory {
    
    @Override
    public NotificationSender createSender() {
        return new EmailSender();
    }
    
    @Override
    public NotificationTemplate createTemplate() {
        return new EmailTemplate();
    }
    
    @Override
    public NotificationValidator createValidator() {
        return new EmailValidator();
    }
}

// SMSNotificationFactory.java
@Component
public class SMSNotificationFactory implements NotificationFactory {
    
    @Override
    public NotificationSender createSender() {
        return new SMSSender();
    }
    
    @Override
    public NotificationTemplate createTemplate() {
        return new SMSTemplate();
    }
    
    @Override
    public NotificationValidator createValidator() {
        return new SMSValidator();
    }
}
```

**Áp dụng vào:**
- Low stock alerts - Gửi email/SMS khi tồn kho thấp
- Expiry alerts - Cảnh báo sản phẩm sắp hết hạn
- Order status updates - Thông báo trạng thái đơn hàng

---

## 4. Singleton Pattern

### 📍 Nơi áp dụng

#### 4.1. Configuration Manager

**Đề xuất: ConfigurationManager (Singleton)**

```java
// ConfigurationManager.java
@Component
@Singleton
public class ConfigurationManager {
    
    private static ConfigurationManager instance;
    private Map<String, Object> configCache;
    
    @Value("${app.name}")
    private String appName;
    
    @Value("${app.version}")
    private String appVersion;
    
    @PostConstruct
    public void init() {
        configCache = new ConcurrentHashMap<>();
        loadConfiguration();
    }
    
    public static ConfigurationManager getInstance() {
        if (instance == null) {
            synchronized (ConfigurationManager.class) {
                if (instance == null) {
                    instance = new ConfigurationManager();
                }
            }
        }
        return instance;
    }
    
    public String getAppName() {
        return appName;
    }
    
    public String getAppVersion() {
        return appVersion;
    }
    
    public Object getConfig(String key) {
        return configCache.get(key);
    }
    
    private void loadConfiguration() {
        // Load from database or config file
    }
}
```

**Áp dụng vào:**
- System configuration
- Application settings
- Feature flags

#### 4.2. Cache Manager

**Đề xuất: CacheManager (Singleton với Spring @Cacheable)**

```java
// CacheManager.java
@Component
public class CacheManager {
    
    private final Map<String, Cache> caches;
    
    @PostConstruct
    public void init() {
        caches = new ConcurrentHashMap<>();
        // Initialize caches
        caches.put("products", new ConcurrentHashMap<>());
        caches.put("suppliers", new ConcurrentHashMap<>());
    }
    
    public <T> T get(String cacheName, String key) {
        Cache cache = caches.get(cacheName);
        return cache != null ? (T) cache.get(key) : null;
    }
    
    public void put(String cacheName, String key, Object value) {
        Cache cache = caches.get(cacheName);
        if (cache != null) {
            cache.put(key, value);
        }
    }
    
    public void evict(String cacheName, String key) {
        Cache cache = caches.get(cacheName);
        if (cache != null) {
            cache.remove(key);
        }
    }
    
    public void clear(String cacheName) {
        Cache cache = caches.get(cacheName);
        if (cache != null) {
            cache.clear();
        }
    }
}
```

**Áp dụng vào:**
- Cache product list
- Cache supplier list
- Cache frequently accessed data

---

## 5. Prototype Pattern

### 📍 Nơi áp dụng

#### 5.1. Clone Purchase Orders

**Vấn đề:**
- Cần tạo đơn hàng mới dựa trên đơn hàng cũ
- Copy line items từ đơn hàng trước

**Đề xuất: PurchaseOrderPrototype**

```java
// PurchaseOrderPrototype.java
@Component
public class PurchaseOrderPrototype {
    
    public PurchaseOrder clone(PurchaseOrder original) {
        // Clone purchase order
        PurchaseOrder cloned = PurchaseOrder.newBuilder()
            .orderCode(generateNewOrderCode())
            .supplier(original.getSupplier())
            .status(PurchaseOrderStatus.DRAFT)
            .orderDate(LocalDate.now())
            .build();
        
        // Clone line items
        for (PurchaseOrderLine originalLine : original.getLineItems()) {
            PurchaseOrderLine clonedLine = PurchaseOrderLine.newBuilder()
                .product(originalLine.getProduct())
                .quantity(originalLine.getQuantity())
                .unitCost(originalLine.getUnitCost())
                .build();
            
            cloned.addLine(clonedLine);
        }
        
        return cloned;
    }
    
    // Clone với modifications
    public PurchaseOrder cloneWithModifications(
            PurchaseOrder original,
            Function<PurchaseOrderLine, PurchaseOrderLine> lineModifier) {
        
        PurchaseOrder cloned = clone(original);
        
        // Apply modifications
        cloned.getLineItems().clear();
        for (PurchaseOrderLine originalLine : original.getLineItems()) {
            PurchaseOrderLine modifiedLine = lineModifier.apply(originalLine);
            cloned.addLine(modifiedLine);
        }
        
        return cloned;
    }
    
    private String generateNewOrderCode() {
        return "PO-" + System.currentTimeMillis();
    }
}
```

**Áp dụng vào:**
- `PurchaseOrderController` - Endpoint clone purchase order
- Tạo đơn hàng định kỳ từ template

#### 5.2. Clone Products với Variations

**Đề xuất: ProductPrototype**

```java
// ProductPrototype.java
@Component
public class ProductPrototype {
    
    public Product clone(Product original) {
        return Product.newBuilder()
            .sku(generateNewSku(original.getSku()))
            .name(original.getName())
            .activeIngredient(original.getActiveIngredient())
            .dosageForm(original.getDosageForm())
            .dosageStrength(original.getDosageStrength())
            .category(original.getCategory())
            .reorderLevel(original.getReorderLevel())
            .expiryAlertDays(original.getExpiryAlertDays())
            .dosage(original.getDosage())
            .minStock(original.getMinStock())
            .active(true)
            .build();
    }
    
    // Clone với thay đổi dosage strength
    public Product cloneWithDifferentStrength(Product original, String newStrength) {
        return Product.newBuilder()
            .sku(generateNewSku(original.getSku()))
            .name(original.getName())
            .activeIngredient(original.getActiveIngredient())
            .dosageForm(original.getDosageForm())
            .dosageStrength(newStrength) // Modified
            .category(original.getCategory())
            .reorderLevel(original.getReorderLevel())
            .expiryAlertDays(original.getExpiryAlertDays())
            .dosage(original.getDosage())
            .minStock(original.getMinStock())
            .active(true)
            .build();
    }
    
    private String generateNewSku(String originalSku) {
        return originalSku + "-COPY-" + System.currentTimeMillis();
    }
}
```

**Áp dụng vào:**
- Tạo product variations (cùng hoạt chất, khác liều lượng)
- Product templates

---

## 📊 Tóm tắt áp dụng

| Pattern | Vị trí áp dụng | Lợi ích | Ưu tiên |
|---------|----------------|---------|---------|
| **Builder** | ✅ Đã có | Tạo objects phức tạp | ⭐⭐⭐ |
| **Factory** | EntityFactory, DTOFactory | Tách logic tạo objects | ⭐⭐⭐⭐⭐ |
| **Abstract Factory** | ReportFactory, NotificationFactory | Tạo families of objects | ⭐⭐⭐⭐ |
| **Singleton** | ConfigurationManager, CacheManager | Quản lý shared resources | ⭐⭐⭐ |
| **Prototype** | PurchaseOrderPrototype, ProductPrototype | Clone objects | ⭐⭐⭐ |

---

## 🎯 Kế hoạch triển khai

### Phase 1: Factory Pattern (Ưu tiên cao)
1. Tạo `EntityFactory` - Tách logic tạo entities từ controllers
2. Tạo `DTOFactory` - Tách logic mapping DTOs từ controllers
3. Refactor controllers để sử dụng factories

### Phase 2: Abstract Factory Pattern
1. Tạo `ReportFactory` interface và implementations
2. Implement PDF, Excel, CSV factories
3. Integrate vào `ReportsPage`

### Phase 3: Prototype Pattern
1. Implement `PurchaseOrderPrototype` cho clone orders
2. Implement `ProductPrototype` cho product variations

### Phase 4: Singleton Pattern
1. Implement `ConfigurationManager` cho system config
2. Implement `CacheManager` cho caching

---

## 📝 Code Examples

### Ví dụ 1: EntityFactory trong ProductController

**Trước:**
```java
@PostMapping
public ResponseEntity<ProductResponse> createProduct(@Valid @RequestBody ProductRequest request) {
    Product product = Product.newBuilder()
        .sku(request.getSku())
        .name(request.getName())
        // ... nhiều dòng code
        .build();
    
    Product created = productService.createProduct(product);
    return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(created));
}
```

**Sau:**
```java
@PostMapping
public ResponseEntity<ProductResponse> createProduct(@Valid @RequestBody ProductRequest request) {
    Product product = entityFactory.createProduct(request);
    Product created = productService.createProduct(product);
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(dtoFactory.createProductResponse(created));
}
```

### Ví dụ 2: ReportFactory

```java
@GetMapping("/reports/export")
public ResponseEntity<byte[]> exportReport(
        @RequestParam ReportType type,
        @RequestParam ReportFormat format,
        @RequestParam LocalDate startDate,
        @RequestParam LocalDate endDate) {
    
    ReportRequest request = ReportRequest.builder()
        .type(type)
        .format(format)
        .startDate(startDate)
        .endDate(endDate)
        .build();
    
    byte[] report = reportService.generateReport(request);
    
    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=report." + format.name().toLowerCase())
        .contentType(MediaType.APPLICATION_OCTET_STREAM)
        .body(report);
}
```

---

## 🔗 Tài liệu tham khảo

- [Design Patterns: Elements of Reusable Object-Oriented Software](https://en.wikipedia.org/wiki/Design_Patterns)
- [Builder Pattern - Refactoring Guru](https://refactoring.guru/design-patterns/builder)
- [Factory Pattern - Refactoring Guru](https://refactoring.guru/design-patterns/factory-method)
- [Abstract Factory Pattern - Refactoring Guru](https://refactoring.guru/design-patterns/abstract-factory)

---

**Tài liệu này mô tả các Creational Design Patterns có thể áp dụng vào dự án PharmaFlow. Ưu tiên triển khai Factory Pattern trước vì nó sẽ cải thiện code quality đáng kể.**







