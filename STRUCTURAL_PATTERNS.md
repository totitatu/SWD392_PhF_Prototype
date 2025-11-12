# Design Patterns Nhóm Structural - PharmaFlow Project

## 📋 Mục lục

- [Tổng quan](#tổng-quan)
- [Patterns đang sử dụng](#patterns-đang-sử-dụng)
- [Gợi ý áp dụng các Structural Patterns](#gợi-ý-áp-dụng-các-structural-patterns)
  - [1. Adapter Pattern](#1-adapter-pattern)
  - [2. Facade Pattern](#2-facade-pattern)
  - [3. Proxy Pattern](#3-proxy-pattern)
  - [4. Decorator Pattern](#4-decorator-pattern)
  - [5. Composite Pattern](#5-composite-pattern)
  - [6. Bridge Pattern](#6-bridge-pattern)

---

## 🎯 Tổng quan

**Structural Patterns** là nhóm design patterns tập trung vào cách tổ chức các lớp và đối tượng để tạo thành cấu trúc lớn hơn. Chúng giúp:
- Kết nối các thành phần độc lập
- Tạo cấu trúc linh hoạt và mở rộng được
- Giảm coupling giữa các thành phần
- Tăng khả năng tái sử dụng code

---

## ✅ Patterns đang sử dụng

### 1. Adapter Pattern (Một phần)

**Vị trí sử dụng:**
- `GeminiServiceImpl` - Adapt Google Gemini API vào `GeminiService` interface
- `CorsConfig` - Adapt Spring CORS configuration

**Ví dụ hiện tại:**

```java
// GeminiService.java - Target interface
public interface GeminiService {
    String suggestProductEdit(UUID productId, String userInput);
    String suggestPurchaseOrder(String userInput);
    String chat(String prompt);
}

// GeminiServiceImpl.java - Adapter
@Service
public class GeminiServiceImpl implements GeminiService {
    private WebClient webClient; // Adapts external API
    
    @Override
    public String chat(String prompt) {
        // Adapts Google Gemini API calls to our interface
        return callGeminiAPI(prompt);
    }
}
```

**Lợi ích:**
- ✅ Tách biệt external API khỏi business logic
- ✅ Dễ thay đổi implementation
- ✅ Dễ test với mock

---

## 🚀 Gợi ý áp dụng các Structural Patterns

---

## 1. Adapter Pattern

### 📍 Nơi có thể mở rộng

#### 1.1. Payment Gateway Adapter

**Vấn đề:**
- Cần tích hợp nhiều payment gateway (VNPay, MoMo, Stripe)
- Mỗi gateway có API khác nhau
- Cần unified interface

**Đề xuất: PaymentGatewayAdapter**

```java
// PaymentGateway.java - Target interface
public interface PaymentGateway {
    PaymentResult processPayment(PaymentRequest request);
    PaymentStatus checkStatus(String transactionId);
    RefundResult refund(String transactionId, BigDecimal amount);
}

// VNPayAdapter.java - Adapter cho VNPay
@Component
public class VNPayAdapter implements PaymentGateway {
    
    private final VNPayClient vnpayClient; // External service
    
    @Override
    public PaymentResult processPayment(PaymentRequest request) {
        // Adapt PaymentRequest to VNPay format
        VNPayRequest vnpayRequest = VNPayRequest.builder()
            .amount(request.getAmount())
            .orderId(request.getOrderId())
            .orderInfo(request.getDescription())
            .build();
        
        // Call VNPay API
        VNPayResponse response = vnpayClient.createPayment(vnpayRequest);
        
        // Adapt VNPayResponse to PaymentResult
        return PaymentResult.builder()
            .success(response.isSuccess())
            .transactionId(response.getTransactionId())
            .paymentUrl(response.getPaymentUrl())
            .build();
    }
    
    @Override
    public PaymentStatus checkStatus(String transactionId) {
        VNPayStatusResponse status = vnpayClient.checkStatus(transactionId);
        return mapToPaymentStatus(status);
    }
    
    @Override
    public RefundResult refund(String transactionId, BigDecimal amount) {
        VNPayRefundResponse refund = vnpayClient.refund(transactionId, amount);
        return mapToRefundResult(refund);
    }
}

// MoMoAdapter.java - Adapter cho MoMo
@Component
public class MoMoAdapter implements PaymentGateway {
    
    private final MoMoClient momoClient;
    
    @Override
    public PaymentResult processPayment(PaymentRequest request) {
        // Adapt to MoMo format
        MoMoRequest momoRequest = new MoMoRequest();
        momoRequest.setAmount(request.getAmount());
        momoRequest.setOrderId(request.getOrderId());
        
        MoMoResponse response = momoClient.createPayment(momoRequest);
        
        return PaymentResult.builder()
            .success(response.getResultCode() == 0)
            .transactionId(response.getTransId())
            .paymentUrl(response.getPayUrl())
            .build();
    }
    
    // ... implement other methods
}

// PaymentService.java - Sử dụng adapter
@Service
public class PaymentService {
    
    private final Map<String, PaymentGateway> gateways;
    
    public PaymentService(List<PaymentGateway> gateways) {
        this.gateways = gateways.stream()
            .collect(Collectors.toMap(
                g -> g.getClass().getSimpleName().replace("Adapter", "").toLowerCase(),
                g -> g
            ));
    }
    
    public PaymentResult processPayment(String gatewayName, PaymentRequest request) {
        PaymentGateway gateway = gateways.get(gatewayName);
        if (gateway == null) {
            throw new IllegalArgumentException("Unknown payment gateway: " + gatewayName);
        }
        return gateway.processPayment(request);
    }
}
```

**Áp dụng vào:**
- `SaleTransactionController` - Xử lý thanh toán
- Tích hợp payment gateways vào POS system

#### 1.2. External Service Adapters

**Đề xuất: NotificationServiceAdapter**

```java
// NotificationService.java - Target interface
public interface NotificationService {
    void sendEmail(String to, String subject, String body);
    void sendSMS(String phoneNumber, String message);
    void sendPushNotification(String userId, String title, String body);
}

// EmailAdapter.java - Adapt email service
@Component
public class EmailAdapter implements NotificationService {
    
    private final SupabaseEmailClient emailClient; // Hoặc SendGrid, AWS SES
    
    @Override
    public void sendEmail(String to, String subject, String body) {
        EmailRequest request = EmailRequest.builder()
            .to(to)
            .subject(subject)
            .body(body)
            .build();
        emailClient.send(request);
    }
    
    @Override
    public void sendSMS(String phoneNumber, String message) {
        // Not supported by email adapter
        throw new UnsupportedOperationException("SMS not supported");
    }
    
    @Override
    public void sendPushNotification(String userId, String title, String body) {
        throw new UnsupportedOperationException("Push notification not supported");
    }
}

// TwilioSMSAdapter.java - Adapt SMS service
@Component
public class TwilioSMSAdapter implements NotificationService {
    
    private final TwilioClient twilioClient;
    
    @Override
    public void sendSMS(String phoneNumber, String message) {
        SMSRequest request = SMSRequest.builder()
            .to(phoneNumber)
            .message(message)
            .build();
        twilioClient.sendSMS(request);
    }
    
    @Override
    public void sendEmail(String to, String subject, String body) {
        throw new UnsupportedOperationException("Email not supported");
    }
    
    // ...
}
```

**Áp dụng vào:**
- Low stock alerts
- Expiry warnings
- Order status notifications

#### 1.3. Database Adapter (nếu cần đổi database)

**Đề xuất: DatabaseAdapter cho multiple databases**

```java
// DatabaseAdapter.java
public interface DatabaseAdapter {
    <T> T save(T entity);
    <T> Optional<T> findById(Class<T> type, UUID id);
    <T> List<T> findAll(Class<T> type);
}

// PostgreSQLAdapter.java
@Component
public class PostgreSQLAdapter implements DatabaseAdapter {
    
    private final EntityManager entityManager;
    
    @Override
    public <T> T save(T entity) {
        return entityManager.merge(entity);
    }
    
    // ... implement using JPA
}

// MongoDBAdapter.java (nếu cần)
@Component
public class MongoDBAdapter implements DatabaseAdapter {
    
    private final MongoTemplate mongoTemplate;
    
    @Override
    public <T> T save(T entity) {
        return mongoTemplate.save(entity);
    }
    
    // ... implement using MongoDB
}
```

---

## 2. Facade Pattern

### 📍 Nơi áp dụng

#### 2.1. Purchase Order Facade

**Vấn đề:**
- Tạo purchase order cần nhiều bước phức tạp:
  1. Validate supplier
  2. Validate products
  3. Create purchase order
  4. Create line items
  5. Calculate totals
  6. Log system activity
- Logic rải rác ở nhiều nơi

**Đề xuất: PurchaseOrderFacade**

```java
// PurchaseOrderFacade.java
@Service
public class PurchaseOrderFacade {
    
    private final SupplierService supplierService;
    private final ProductService productService;
    private final PurchaseOrderService purchaseOrderService;
    private final SystemLogService systemLogService;
    private final EntityFactory entityFactory;
    
    /**
     * Facade method - Simplified interface for complex operation
     */
    public PurchaseOrderResponse createPurchaseOrderWithValidation(
            PurchaseOrderRequest request,
            UUID userId) {
        
        // Step 1: Validate supplier
        Supplier supplier = supplierService.findById(request.getSupplierId())
            .orElseThrow(() -> new IllegalArgumentException("Supplier not found"));
        
        if (!supplier.isActive()) {
            throw new IllegalStateException("Supplier is not active");
        }
        
        // Step 2: Validate all products
        List<Product> products = validateProducts(request.getLineItems());
        
        // Step 3: Create purchase order entity
        PurchaseOrder order = entityFactory.createPurchaseOrder(request, supplier);
        
        // Step 4: Add line items with validation
        for (PurchaseOrderLineRequest lineRequest : request.getLineItems()) {
            Product product = products.stream()
                .filter(p -> p.getId().equals(lineRequest.getProductId()))
                .findFirst()
                .orElseThrow();
            
            PurchaseOrderLine line = entityFactory.createPurchaseOrderLine(
                product, lineRequest);
            order.addLine(line);
        }
        
        // Step 5: Save purchase order
        PurchaseOrder saved = purchaseOrderService.createPurchaseOrder(order);
        
        // Step 6: Log activity
        systemLogService.logAction(
            userId,
            "PURCHASE_ORDER_CREATED",
            "PurchaseOrder",
            saved.getId().toString()
        );
        
        // Step 7: Return response
        return dtoFactory.createPurchaseOrderResponse(saved);
    }
    
    private List<Product> validateProducts(List<PurchaseOrderLineRequest> lineItems) {
        List<Product> products = new ArrayList<>();
        for (PurchaseOrderLineRequest line : lineItems) {
            Product product = productService.findById(line.getProductId())
                .orElseThrow(() -> new IllegalArgumentException(
                    "Product not found: " + line.getProductId()));
            
            if (!product.isActive()) {
                throw new IllegalStateException(
                    "Product is not active: " + product.getName());
            }
            
            products.add(product);
        }
        return products;
    }
}
```

**Áp dụng vào:**
- `PurchaseOrderController.createPurchaseOrder()` → `facade.createPurchaseOrderWithValidation()`
- Đơn giản hóa logic phức tạp

#### 2.2. Sale Transaction Facade

**Đề xuất: SaleTransactionFacade**

```java
// SaleTransactionFacade.java
@Service
public class SaleTransactionFacade {
    
    private final ProductService productService;
    private final InventoryBatchService inventoryService;
    private final SaleTransactionService saleService;
    private final SystemLogService systemLogService;
    private final PaymentService paymentService;
    
    /**
     * Facade for complete sale transaction process
     */
    public SaleTransactionResponse processSale(
            SaleTransactionRequest request,
            UUID cashierId) {
        
        // Step 1: Validate cashier
        PharmacyUser cashier = userService.findById(cashierId)
            .orElseThrow(() -> new IllegalArgumentException("Cashier not found"));
        
        // Step 2: Validate and reserve inventory
        List<InventoryReservation> reservations = reserveInventory(request.getLineItems());
        
        // Step 3: Create sale transaction
        SaleTransaction transaction = entityFactory.createSaleTransaction(request, cashier);
        
        // Step 4: Process payment
        if (request.getPaymentMethod() != PaymentMethod.CASH) {
            PaymentResult payment = paymentService.processPayment(
                request.getPaymentMethod().name(),
                createPaymentRequest(transaction)
            );
            if (!payment.isSuccess()) {
                // Release reservations
                releaseReservations(reservations);
                throw new PaymentException("Payment failed");
            }
        }
        
        // Step 5: Deduct inventory
        deductInventory(reservations);
        
        // Step 6: Save transaction
        SaleTransaction saved = saleService.createSaleTransaction(transaction);
        
        // Step 7: Log activity
        systemLogService.logAction(
            cashierId,
            "SALE_COMPLETED",
            "SaleTransaction",
            saved.getId().toString()
        );
        
        // Step 8: Send receipt (if requested)
        if (request.getEmailReceipt() != null && request.getEmailReceipt()) {
            sendReceipt(saved, request.getCustomerEmail());
        }
        
        return dtoFactory.createSaleTransactionResponse(saved);
    }
    
    private List<InventoryReservation> reserveInventory(
            List<SaleTransactionLineRequest> lineItems) {
        // Complex logic to reserve inventory
        // ...
    }
    
    private void deductInventory(List<InventoryReservation> reservations) {
        // Deduct from inventory batches
        // ...
    }
}
```

**Áp dụng vào:**
- `SaleTransactionController.createSale()` → `facade.processSale()`
- POS system - Complete sale flow

#### 2.3. Report Generation Facade

**Đề xuất: ReportFacade**

```java
// ReportFacade.java
@Service
public class ReportFacade {
    
    private final SaleTransactionService saleService;
    private final InventoryBatchService inventoryService;
    private final ProductService productService;
    private final ReportGeneratorFactory reportFactory;
    
    /**
     * Facade for generating comprehensive reports
     */
    public byte[] generateSalesReport(ReportRequest request) {
        // Step 1: Fetch data
        List<SaleTransaction> sales = saleService.findByDateRange(
            request.getStartDate(),
            request.getEndDate()
        );
        
        // Step 2: Calculate statistics
        ReportStatistics stats = calculateStatistics(sales);
        
        // Step 3: Format data
        ReportData data = formatReportData(sales, stats);
        
        // Step 4: Generate report
        ReportGenerator generator = reportFactory.createGenerator(request.getFormat());
        return generator.generate(data);
    }
    
    /**
     * Facade for inventory report
     */
    public byte[] generateInventoryReport(ReportRequest request) {
        List<InventoryBatch> inventory = inventoryService.findAll();
        List<Product> products = productService.findAll();
        
        InventoryReportData data = InventoryReportData.builder()
            .inventory(inventory)
            .products(products)
            .lowStockItems(findLowStockItems(products, inventory))
            .expiringItems(findExpiringItems(inventory))
            .build();
        
        ReportGenerator generator = reportFactory.createGenerator(request.getFormat());
        return generator.generate(data);
    }
}
```

**Áp dụng vào:**
- `ReportsPage` - Generate various reports
- Export functionality

---

## 3. Proxy Pattern

### 📍 Nơi áp dụng

#### 3.1. Caching Proxy

**Đề xuất: CachedProductServiceProxy**

```java
// ProductService.java - Subject interface
public interface ProductService {
    Optional<Product> findById(UUID id);
    List<Product> findAll();
    List<Product> search(String term);
}

// CachedProductService.java - Proxy với caching
@Service
@Primary
public class CachedProductService implements ProductService {
    
    private final ProductService targetService; // Real service
    private final CacheManager cacheManager;
    
    public CachedProductService(
            @Qualifier("productServiceImpl") ProductService targetService,
            CacheManager cacheManager) {
        this.targetService = targetService;
        this.cacheManager = cacheManager;
    }
    
    @Override
    public Optional<Product> findById(UUID id) {
        String cacheKey = "product:" + id;
        
        // Check cache first
        Product cached = cacheManager.get("products", cacheKey);
        if (cached != null) {
            return Optional.of(cached);
        }
        
        // Call real service
        Optional<Product> product = targetService.findById(id);
        
        // Cache result
        if (product.isPresent()) {
            cacheManager.put("products", cacheKey, product.get());
        }
        
        return product;
    }
    
    @Override
    public List<Product> findAll() {
        String cacheKey = "products:all";
        
        @SuppressWarnings("unchecked")
        List<Product> cached = (List<Product>) cacheManager.get("products", cacheKey);
        if (cached != null) {
            return cached;
        }
        
        List<Product> products = targetService.findAll();
        cacheManager.put("products", cacheKey, products);
        
        return products;
    }
    
    @Override
    public List<Product> search(String term) {
        // Don't cache search results
        return targetService.search(term);
    }
}
```

**Áp dụng vào:**
- Cache frequently accessed data
- Improve performance
- Reduce database load

#### 3.2. Lazy Loading Proxy

**Đề xuất: LazyPurchaseOrderProxy**

```java
// PurchaseOrderProxy.java
public class LazyPurchaseOrderProxy {
    
    private UUID orderId;
    private PurchaseOrderRepository repository;
    private PurchaseOrder realOrder; // Lazy loaded
    
    public LazyPurchaseOrderProxy(UUID orderId, PurchaseOrderRepository repository) {
        this.orderId = orderId;
        this.repository = repository;
    }
    
    public PurchaseOrder getOrder() {
        if (realOrder == null) {
            realOrder = repository.findByIdWithRelations(orderId)
                .orElseThrow();
        }
        return realOrder;
    }
    
    public List<PurchaseOrderLine> getLineItems() {
        return getOrder().getLineItems(); // Loads on demand
    }
    
    public Supplier getSupplier() {
        return getOrder().getSupplier(); // Loads on demand
    }
}
```

**Áp dụng vào:**
- Lazy load related entities
- Optimize database queries

#### 3.3. Access Control Proxy

**Đề xuất: SecuredServiceProxy**

```java
// SecuredProductService.java - Proxy với access control
@Service
public class SecuredProductService implements ProductService {
    
    private final ProductService targetService;
    private final SecurityService securityService;
    
    @Override
    public Product createProduct(Product product) {
        // Check permission
        if (!securityService.hasPermission("PRODUCT_CREATE")) {
            throw new AccessDeniedException("No permission to create product");
        }
        
        // Call real service
        return targetService.createProduct(product);
    }
    
    @Override
    public void deleteProduct(UUID id) {
        if (!securityService.hasPermission("PRODUCT_DELETE")) {
            throw new AccessDeniedException("No permission to delete product");
        }
        
        targetService.deleteProduct(id);
    }
}
```

**Áp dụng vào:**
- Role-based access control
- Security checks

---

## 4. Decorator Pattern

### 📍 Nơi áp dụng

#### 4.1. Service Decorators

**Đề xuất: Logging và Caching Decorators**

```java
// ProductService.java - Component interface
public interface ProductService {
    Product createProduct(Product product);
    Optional<Product> findById(UUID id);
}

// ProductServiceImpl.java - Concrete component
@Service
public class ProductServiceImpl implements ProductService {
    // ... implementation
}

// LoggingProductServiceDecorator.java
@Service
public class LoggingProductServiceDecorator implements ProductService {
    
    private final ProductService targetService;
    private final SystemLogService logService;
    
    public LoggingProductServiceDecorator(
            @Qualifier("productServiceImpl") ProductService targetService,
            SystemLogService logService) {
        this.targetService = targetService;
        this.logService = logService;
    }
    
    @Override
    public Product createProduct(Product product) {
        logService.log("Creating product: " + product.getSku());
        
        try {
            Product created = targetService.createProduct(product);
            logService.log("Product created successfully: " + created.getId());
            return created;
        } catch (Exception e) {
            logService.logError("Failed to create product: " + e.getMessage());
            throw e;
        }
    }
    
    @Override
    public Optional<Product> findById(UUID id) {
        logService.log("Finding product: " + id);
        return targetService.findById(id);
    }
}

// CachingProductServiceDecorator.java
@Service
public class CachingProductServiceDecorator implements ProductService {
    
    private final ProductService targetService;
    private final CacheManager cacheManager;
    
    public CachingProductServiceDecorator(
            @Qualifier("productServiceImpl") ProductService targetService,
            CacheManager cacheManager) {
        this.targetService = targetService;
        this.cacheManager = cacheManager;
    }
    
    @Override
    public Optional<Product> findById(UUID id) {
        String cacheKey = "product:" + id;
        Product cached = cacheManager.get("products", cacheKey);
        
        if (cached != null) {
            return Optional.of(cached);
        }
        
        Optional<Product> product = targetService.findById(id);
        product.ifPresent(p -> cacheManager.put("products", cacheKey, p));
        
        return product;
    }
    
    @Override
    public Product createProduct(Product product) {
        Product created = targetService.createProduct(product);
        // Invalidate cache
        cacheManager.evict("products", "products:all");
        return created;
    }
}

// ValidationProductServiceDecorator.java
@Service
public class ValidationProductServiceDecorator implements ProductService {
    
    private final ProductService targetService;
    
    @Override
    public Product createProduct(Product product) {
        // Additional validation
        validateProduct(product);
        return targetService.createProduct(product);
    }
    
    private void validateProduct(Product product) {
        if (product.getSku() == null || product.getSku().isBlank()) {
            throw new IllegalArgumentException("SKU is required");
        }
        // More validations...
    }
}
```

**Áp dụng vào:**
- Add cross-cutting concerns (logging, caching, validation)
- Compose behaviors dynamically

#### 4.2. Response Decorators

**Đề xuất: ResponseDecorator cho DTOs**

```java
// ProductResponseDecorator.java
public class ProductResponseDecorator {
    
    private final ProductResponse baseResponse;
    
    public ProductResponseDecorator(ProductResponse baseResponse) {
        this.baseResponse = baseResponse;
    }
    
    // Add inventory info
    public ProductResponse withInventoryInfo(List<InventoryBatch> batches) {
        int totalStock = batches.stream()
            .mapToInt(InventoryBatch::getQuantityOnHand)
            .sum();
        
        return ProductResponse.builder()
            .id(baseResponse.getId())
            .sku(baseResponse.getSku())
            .name(baseResponse.getName())
            // ... copy all fields
            .stockQuantity(totalStock) // Added field
            .build();
    }
    
    // Add pricing info
    public ProductResponse withPricingInfo(BigDecimal sellingPrice) {
        return ProductResponse.builder()
            .id(baseResponse.getId())
            // ... copy fields
            .sellingPrice(sellingPrice) // Added field
            .build();
    }
    
    // Combine decorators
    public ProductResponse withFullInfo(
            List<InventoryBatch> batches,
            BigDecimal sellingPrice) {
        return withInventoryInfo(batches)
            .toBuilder()
            .sellingPrice(sellingPrice)
            .build();
    }
}
```

---

## 5. Composite Pattern

### 📍 Nơi áp dụng

#### 5.1. Report Components

**Đề xuất: ReportComponent Composite**

```java
// ReportComponent.java - Component interface
public interface ReportComponent {
    void render(ReportContext context);
    String getType();
}

// ReportSection.java - Composite
public class ReportSection implements ReportComponent {
    
    private String title;
    private List<ReportComponent> components = new ArrayList<>();
    
    public ReportSection(String title) {
        this.title = title;
    }
    
    public void addComponent(ReportComponent component) {
        components.add(component);
    }
    
    @Override
    public void render(ReportContext context) {
        context.addSection(title);
        for (ReportComponent component : components) {
            component.render(context);
        }
    }
    
    @Override
    public String getType() {
        return "SECTION";
    }
}

// ReportTable.java - Leaf
public class ReportTable implements ReportComponent {
    
    private String[] headers;
    private List<String[]> rows;
    
    public ReportTable(String[] headers, List<String[]> rows) {
        this.headers = headers;
        this.rows = rows;
    }
    
    @Override
    public void render(ReportContext context) {
        context.addTable(headers, rows);
    }
    
    @Override
    public String getType() {
        return "TABLE";
    }
}

// ReportChart.java - Leaf
public class ReportChart implements ReportComponent {
    
    private ChartType type;
    private ChartData data;
    
    @Override
    public void render(ReportContext context) {
        context.addChart(type, data);
    }
    
    @Override
    public String getType() {
        return "CHART";
    }
}

// SalesReportBuilder.java - Sử dụng Composite
public class SalesReportBuilder {
    
    public ReportComponent buildSalesReport(List<SaleTransaction> sales) {
        ReportSection report = new ReportSection("Sales Report");
        
        // Add summary section
        ReportSection summary = new ReportSection("Summary");
        summary.addComponent(new ReportTable(
            new String[]{"Total Sales", "Total Transactions", "Average Sale"},
            List.of(new String[]{
                calculateTotalSales(sales),
                String.valueOf(sales.size()),
                calculateAverage(sales)
            })
        ));
        report.addComponent(summary);
        
        // Add chart
        report.addComponent(new ReportChart(
            ChartType.BAR,
            buildChartData(sales)
        ));
        
        // Add detailed table
        report.addComponent(new ReportTable(
            new String[]{"Date", "Receipt", "Amount"},
            buildTableData(sales)
        ));
        
        return report;
    }
}
```

**Áp dụng vào:**
- Report generation với nhiều components
- Dashboard với nested components

---

## 6. Bridge Pattern

### 📍 Nơi áp dụng

#### 6.1. Report Format Bridge

**Đề xuất: ReportFormat Bridge**

```java
// ReportGenerator.java - Abstraction
public abstract class ReportGenerator {
    
    protected ReportFormatter formatter; // Bridge to implementation
    
    public ReportGenerator(ReportFormatter formatter) {
        this.formatter = formatter;
    }
    
    public abstract byte[] generate(ReportData data);
}

// SalesReportGenerator.java - Refined Abstraction
public class SalesReportGenerator extends ReportGenerator {
    
    public SalesReportGenerator(ReportFormatter formatter) {
        super(formatter);
    }
    
    @Override
    public byte[] generate(ReportData data) {
        SalesReportData salesData = (SalesReportData) data;
        
        // Generate report structure
        ReportDocument document = new ReportDocument();
        document.addTitle("Sales Report");
        document.addSection(formatSummary(salesData));
        document.addSection(formatDetails(salesData));
        
        // Use formatter to format (Bridge)
        return formatter.format(document);
    }
    
    private String formatSummary(SalesReportData data) {
        // Format summary section
        return "Total: " + data.getTotalSales();
    }
    
    private String formatDetails(SalesReportData data) {
        // Format details section
        return "Details...";
    }
}

// ReportFormatter.java - Implementation interface
public interface ReportFormatter {
    byte[] format(ReportDocument document);
}

// PDFFormatter.java - Concrete Implementation
public class PDFFormatter implements ReportFormatter {
    
    @Override
    public byte[] format(ReportDocument document) {
        // Use iText or Apache PDFBox
        PDFDocument pdf = new PDFDocument();
        pdf.addTitle(document.getTitle());
        for (String section : document.getSections()) {
            pdf.addSection(section);
        }
        return pdf.toByteArray();
    }
}

// ExcelFormatter.java - Concrete Implementation
public class ExcelFormatter implements ReportFormatter {
    
    @Override
    public byte[] format(ReportDocument document) {
        // Use Apache POI
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Report");
        // ... format to Excel
        return workbookToByteArray(workbook);
    }
}

// Usage:
ReportGenerator pdfSalesReport = new SalesReportGenerator(new PDFFormatter());
byte[] pdf = pdfSalesReport.generate(salesData);

ReportGenerator excelSalesReport = new SalesReportGenerator(new ExcelFormatter());
byte[] excel = excelSalesReport.generate(salesData);
```

**Áp dụng vào:**
- Report generation với nhiều formats
- Tách abstraction (report type) khỏi implementation (format)

---

## 📊 Tóm tắt áp dụng

| Pattern | Vị trí áp dụng | Lợi ích | Ưu tiên |
|---------|----------------|---------|---------|
| **Adapter** | ✅ Đã có (GeminiService) | Tích hợp external services | ⭐⭐⭐⭐⭐ |
| **Facade** | PurchaseOrderFacade, SaleFacade | Đơn giản hóa complex operations | ⭐⭐⭐⭐⭐ |
| **Proxy** | CachingProxy, SecurityProxy | Performance, Security | ⭐⭐⭐⭐ |
| **Decorator** | ServiceDecorators | Add behaviors dynamically | ⭐⭐⭐⭐ |
| **Composite** | ReportComponents | Build complex structures | ⭐⭐⭐ |
| **Bridge** | ReportFormat Bridge | Tách abstraction/implementation | ⭐⭐⭐ |

---

## 🎯 Kế hoạch triển khai

### Phase 1: Adapter Pattern (Ưu tiên cao)
1. Tạo `PaymentGatewayAdapter` cho payment integration
2. Tạo `NotificationServiceAdapter` cho notifications
3. Refactor `GeminiServiceImpl` để rõ ràng hơn

### Phase 2: Facade Pattern (Ưu tiên cao)
1. Tạo `PurchaseOrderFacade` - Simplify purchase order creation
2. Tạo `SaleTransactionFacade` - Complete sale flow
3. Tạo `ReportFacade` - Report generation

### Phase 3: Proxy Pattern
1. Implement `CachedProductServiceProxy` cho caching
2. Implement `SecuredServiceProxy` cho access control

### Phase 4: Decorator Pattern
1. Implement `LoggingServiceDecorator`
2. Implement `CachingServiceDecorator`
3. Implement `ValidationServiceDecorator`

### Phase 5: Composite & Bridge
1. Implement `ReportComponent` Composite
2. Implement `ReportFormat` Bridge

---

## 📝 Code Examples

### Ví dụ 1: Facade trong Controller

**Trước:**
```java
@PostMapping
public ResponseEntity<PurchaseOrderResponse> createPurchaseOrder(
        @Valid @RequestBody PurchaseOrderRequest request) {
    
    // Validate supplier
    Supplier supplier = supplierService.findById(request.getSupplierId())
        .orElseThrow(() -> new IllegalArgumentException("Supplier not found"));
    
    // Validate products
    for (PurchaseOrderLineRequest line : request.getLineItems()) {
        Product product = productService.findById(line.getProductId())
            .orElseThrow(() -> new IllegalArgumentException("Product not found"));
    }
    
    // Create order
    PurchaseOrder order = entityFactory.createPurchaseOrder(request, supplier);
    // ... many more steps
    
    PurchaseOrder created = purchaseOrderService.createPurchaseOrder(order);
    return ResponseEntity.ok(toResponse(created));
}
```

**Sau:**
```java
@PostMapping
public ResponseEntity<PurchaseOrderResponse> createPurchaseOrder(
        @Valid @RequestBody PurchaseOrderRequest request,
        @RequestHeader("X-User-Id") UUID userId) {
    
    PurchaseOrderResponse response = purchaseOrderFacade
        .createPurchaseOrderWithValidation(request, userId);
    
    return ResponseEntity.ok(response);
}
```

### Ví dụ 2: Adapter Pattern

```java
// PaymentController.java
@PostMapping("/sales/{saleId}/pay")
public ResponseEntity<PaymentResult> processPayment(
        @PathVariable UUID saleId,
        @RequestParam String gateway,
        @RequestBody PaymentRequest request) {
    
    PaymentResult result = paymentService.processPayment(gateway, request);
    return ResponseEntity.ok(result);
}
```

---

## 🔗 Tài liệu tham khảo

- [Design Patterns: Elements of Reusable Object-Oriented Software](https://en.wikipedia.org/wiki/Design_Patterns)
- [Adapter Pattern - Refactoring Guru](https://refactoring.guru/design-patterns/adapter)
- [Facade Pattern - Refactoring Guru](https://refactoring.guru/design-patterns/facade)
- [Proxy Pattern - Refactoring Guru](https://refactoring.guru/design-patterns/proxy)
- [Decorator Pattern - Refactoring Guru](https://refactoring.guru/design-patterns/decorator)

---

**Tài liệu này mô tả các Structural Design Patterns có thể áp dụng vào dự án PharmaFlow. Ưu tiên triển khai Adapter và Facade Patterns trước vì chúng sẽ cải thiện code quality và maintainability đáng kể.**







