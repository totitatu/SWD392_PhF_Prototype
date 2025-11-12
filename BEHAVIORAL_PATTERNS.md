# Design Patterns Nhóm Behavioral - PharmaFlow Project

## 📋 Mục lục

- [Tổng quan](#tổng-quan)
- [Patterns đang sử dụng](#patterns-đang-sử-dụng)
- [Gợi ý áp dụng các Behavioral Patterns](#gợi-ý-áp-dụng-các-behavioral-patterns)
  - [1. Strategy Pattern](#1-strategy-pattern)
  - [2. Observer Pattern](#2-observer-pattern)
  - [3. State Pattern](#3-state-pattern)
  - [4. Command Pattern](#4-command-pattern)
  - [5. Template Method Pattern](#5-template-method-pattern)
  - [6. Chain of Responsibility Pattern](#6-chain-of-responsibility-pattern)
  - [7. Visitor Pattern](#7-visitor-pattern)
  - [8. Mediator Pattern](#8-mediator-pattern)
  - [9. Iterator Pattern](#9-iterator-pattern)
  - [10. Memento Pattern](#10-memento-pattern)

---

## 🎯 Tổng quan

**Behavioral Patterns** là nhóm design patterns tập trung vào giao tiếp giữa các đối tượng và phân bổ trách nhiệm. Chúng giúp:
- Định nghĩa cách các objects tương tác với nhau
- Mô tả luồng điều khiển trong hệ thống
- Tăng tính linh hoạt trong giao tiếp giữa các components
- Giảm coupling giữa sender và receiver

---

## ✅ Patterns đang sử dụng

### 1. Template Method Pattern (Một phần)

**Vị trí sử dụng:**
- `@Transactional` annotations - Spring cung cấp template method cho transaction management
- Service methods có common flow với `@Transactional(readOnly = true)`

**Ví dụ hiện tại:**

```java
// PurchaseOrderServiceImpl.java
@Override
@Transactional(readOnly = true)  // Template method pattern
public Optional<PurchaseOrder> findById(UUID id) {
    return purchaseOrderRepository.findByIdWithRelations(id);
}
```

**Lợi ích:**
- ✅ Định nghĩa skeleton của algorithm
- ✅ Cho phép subclasses override specific steps

---

## 🚀 Gợi ý áp dụng các Behavioral Patterns

---

## 1. Strategy Pattern

### 📍 Nơi áp dụng

#### 1.1. Inventory Allocation Strategy

**Vấn đề:**
- Hiện tại đang dùng FEFO (First Expired First Out) trong POS
- Có thể cần các strategies khác: FIFO, LIFO, FEFO
- Logic rải rác trong code

**Đề xuất: InventoryAllocationStrategy**

```java
// InventoryAllocationStrategy.java - Strategy interface
public interface InventoryAllocationStrategy {
    List<InventoryAllocation> allocate(
        List<InventoryBatch> batches,
        int requestedQuantity
    );
}

// FEFOStrategy.java - First Expired First Out
@Component
public class FEFOStrategy implements InventoryAllocationStrategy {
    
    @Override
    public List<InventoryAllocation> allocate(
            List<InventoryBatch> batches,
            int requestedQuantity) {
        
        // Filter active batches with stock
        List<InventoryBatch> available = batches.stream()
            .filter(InventoryBatch::isActive)
            .filter(b -> b.getQuantityOnHand() > 0)
            .sorted(Comparator.comparing(InventoryBatch::getExpiryDate)) // Earliest first
            .collect(Collectors.toList());
        
        List<InventoryAllocation> allocations = new ArrayList<>();
        int remaining = requestedQuantity;
        
        for (InventoryBatch batch : available) {
            if (remaining <= 0) break;
            
            int quantity = Math.min(remaining, batch.getQuantityOnHand());
            allocations.add(new InventoryAllocation(batch, quantity));
            remaining -= quantity;
        }
        
        if (remaining > 0) {
            throw new InsufficientStockException(
                "Insufficient stock. Requested: " + requestedQuantity + 
                ", Available: " + (requestedQuantity - remaining));
        }
        
        return allocations;
    }
}

// FIFOStrategy.java - First In First Out
@Component
public class FIFOStrategy implements InventoryAllocationStrategy {
    
    @Override
    public List<InventoryAllocation> allocate(
            List<InventoryBatch> batches,
            int requestedQuantity) {
        
        // Sort by received date (earliest first)
        List<InventoryBatch> available = batches.stream()
            .filter(InventoryBatch::isActive)
            .filter(b -> b.getQuantityOnHand() > 0)
            .sorted(Comparator.comparing(InventoryBatch::getReceivedDate))
            .collect(Collectors.toList());
        
        // Same allocation logic as FEFO
        return allocateFromBatches(available, requestedQuantity);
    }
}

// LIFOStrategy.java - Last In First Out
@Component
public class LIFOStrategy implements InventoryAllocationStrategy {
    
    @Override
    public List<InventoryAllocation> allocate(
            List<InventoryBatch> batches,
            int requestedQuantity) {
        
        // Sort by received date (latest first)
        List<InventoryBatch> available = batches.stream()
            .filter(InventoryBatch::isActive)
            .filter(b -> b.getQuantityOnHand() > 0)
            .sorted(Comparator.comparing(InventoryBatch::getReceivedDate).reversed())
            .collect(Collectors.toList());
        
        return allocateFromBatches(available, requestedQuantity);
    }
}

// InventoryAllocationService.java - Context
@Service
public class InventoryAllocationService {
    
    private final Map<String, InventoryAllocationStrategy> strategies;
    
    public InventoryAllocationService(List<InventoryAllocationStrategy> strategies) {
        this.strategies = strategies.stream()
            .collect(Collectors.toMap(
                s -> s.getClass().getSimpleName().replace("Strategy", "").toUpperCase(),
                s -> s
            ));
    }
    
    public List<InventoryAllocation> allocate(
            String strategyName,
            List<InventoryBatch> batches,
            int quantity) {
        
        InventoryAllocationStrategy strategy = strategies.get(strategyName);
        if (strategy == null) {
            throw new IllegalArgumentException("Unknown strategy: " + strategyName);
        }
        
        return strategy.allocate(batches, quantity);
    }
}
```

**Áp dụng vào:**
- `POSSystem` - Chọn allocation strategy
- `SaleTransactionController` - Allocate inventory khi bán hàng
- Configuration để chọn strategy (FEFO mặc định cho pharmacy)

#### 1.2. Payment Processing Strategy

**Đề xuất: PaymentStrategy**

```java
// PaymentStrategy.java
public interface PaymentStrategy {
    PaymentResult processPayment(PaymentRequest request);
    PaymentMethod getSupportedMethod();
}

// CashPaymentStrategy.java
@Component
public class CashPaymentStrategy implements PaymentStrategy {
    
    @Override
    public PaymentResult processPayment(PaymentRequest request) {
        // Cash payment - immediate success
        return PaymentResult.builder()
            .success(true)
            .transactionId(generateTransactionId())
            .paymentMethod(PaymentMethod.CASH)
            .amount(request.getAmount())
            .build();
    }
    
    @Override
    public PaymentMethod getSupportedMethod() {
        return PaymentMethod.CASH;
    }
}

// CardPaymentStrategy.java
@Component
public class CardPaymentStrategy implements PaymentStrategy {
    
    private final PaymentGateway paymentGateway;
    
    @Override
    public PaymentResult processPayment(PaymentRequest request) {
        // Process card payment through gateway
        return paymentGateway.processPayment(
            PaymentGatewayRequest.builder()
                .amount(request.getAmount())
                .method("CARD")
                .build()
        );
    }
    
    @Override
    public PaymentMethod getSupportedMethod() {
        return PaymentMethod.CARD;
    }
}

// PaymentService.java - Context
@Service
public class PaymentService {
    
    private final Map<PaymentMethod, PaymentStrategy> strategies;
    
    public PaymentService(List<PaymentStrategy> strategies) {
        this.strategies = strategies.stream()
            .collect(Collectors.toMap(
                PaymentStrategy::getSupportedMethod,
                s -> s
            ));
    }
    
    public PaymentResult processPayment(PaymentRequest request) {
        PaymentStrategy strategy = strategies.get(request.getPaymentMethod());
        if (strategy == null) {
            throw new IllegalArgumentException(
                "Unsupported payment method: " + request.getPaymentMethod());
        }
        
        return strategy.processPayment(request);
    }
}
```

**Áp dụng vào:**
- `SaleTransactionController` - Process payment với different methods
- POS system - Support multiple payment methods

#### 1.3. Discount Calculation Strategy

**Đề xuất: DiscountStrategy**

```java
// DiscountStrategy.java
public interface DiscountStrategy {
    BigDecimal calculateDiscount(SaleTransaction transaction);
    String getStrategyName();
}

// PercentageDiscountStrategy.java
@Component
public class PercentageDiscountStrategy implements DiscountStrategy {
    
    @Override
    public BigDecimal calculateDiscount(SaleTransaction transaction) {
        BigDecimal total = transaction.getTotalAmount();
        BigDecimal discountPercent = transaction.getDiscountPercent();
        
        if (discountPercent == null) {
            return BigDecimal.ZERO;
        }
        
        return total.multiply(discountPercent)
            .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    }
    
    @Override
    public String getStrategyName() {
        return "PERCENTAGE";
    }
}

// FixedAmountDiscountStrategy.java
@Component
public class FixedAmountDiscountStrategy implements DiscountStrategy {
    
    @Override
    public BigDecimal calculateDiscount(SaleTransaction transaction) {
        return transaction.getFixedDiscount() != null 
            ? transaction.getFixedDiscount() 
            : BigDecimal.ZERO;
    }
    
    @Override
    public String getStrategyName() {
        return "FIXED_AMOUNT";
    }
}

// BuyXGetYDiscountStrategy.java
@Component
public class BuyXGetYDiscountStrategy implements DiscountStrategy {
    
    @Override
    public BigDecimal calculateDiscount(SaleTransaction transaction) {
        // Buy 2 get 1 free logic
        BigDecimal discount = BigDecimal.ZERO;
        for (SaleTransactionLine line : transaction.getLineItems()) {
            int quantity = line.getQuantity();
            if (quantity >= 2) {
                int freeItems = quantity / 2;
                discount = discount.add(
                    line.getUnitPrice().multiply(BigDecimal.valueOf(freeItems))
                );
            }
        }
        return discount;
    }
    
    @Override
    public String getStrategyName() {
        return "BUY_X_GET_Y";
    }
}
```

**Áp dụng vào:**
- POS system - Apply different discount types
- Sale transaction - Calculate discounts

---

## 2. Observer Pattern

### 📍 Nơi áp dụng

#### 2.1. Inventory Alert Observer

**Vấn đề:**
- Cần notify khi inventory thấp
- Cần notify khi sản phẩm sắp hết hạn
- Multiple listeners cần được notify

**Đề xuất: InventoryObserver**

```java
// InventoryObserver.java - Observer interface
public interface InventoryObserver {
    void onLowStock(Product product, int currentStock, int minStock);
    void onExpiringSoon(InventoryBatch batch, int daysUntilExpiry);
}

// EmailNotificationObserver.java
@Component
public class EmailNotificationObserver implements InventoryObserver {
    
    private final NotificationService notificationService;
    
    @Override
    public void onLowStock(Product product, int currentStock, int minStock) {
        String message = String.format(
            "Product %s is running low. Current stock: %d, Minimum: %d",
            product.getName(), currentStock, minStock
        );
        
        notificationService.sendEmail(
            getAdminEmails(),
            "Low Stock Alert",
            message
        );
    }
    
    @Override
    public void onExpiringSoon(InventoryBatch batch, int daysUntilExpiry) {
        String message = String.format(
            "Product %s (Batch %s) will expire in %d days",
            batch.getProduct().getName(),
            batch.getBatchNumber(),
            daysUntilExpiry
        );
        
        notificationService.sendEmail(
            getAdminEmails(),
            "Expiry Alert",
            message
        );
    }
}

// SystemLogObserver.java
@Component
public class SystemLogObserver implements InventoryObserver {
    
    private final SystemLogService systemLogService;
    
    @Override
    public void onLowStock(Product product, int currentStock, int minStock) {
        systemLogService.logAction(
            null,
            "LOW_STOCK_ALERT",
            "Product",
            product.getId().toString(),
            String.format("Stock: %d, Min: %d", currentStock, minStock)
        );
    }
    
    @Override
    public void onExpiringSoon(InventoryBatch batch, int daysUntilExpiry) {
        systemLogService.logAction(
            null,
            "EXPIRY_ALERT",
            "InventoryBatch",
            batch.getId().toString(),
            "Days until expiry: " + daysUntilExpiry
        );
    }
}

// InventorySubject.java - Subject
@Service
public class InventorySubject {
    
    private final List<InventoryObserver> observers = new ArrayList<>();
    
    public void addObserver(InventoryObserver observer) {
        observers.add(observer);
    }
    
    public void removeObserver(InventoryObserver observer) {
        observers.remove(observer);
    }
    
    public void notifyLowStock(Product product, int currentStock, int minStock) {
        for (InventoryObserver observer : observers) {
            observer.onLowStock(product, currentStock, minStock);
        }
    }
    
    public void notifyExpiringSoon(InventoryBatch batch, int daysUntilExpiry) {
        for (InventoryObserver observer : observers) {
            observer.onExpiringSoon(batch, daysUntilExpiry);
        }
    }
}

// InventoryService.java - Sử dụng Observer
@Service
public class InventoryService {
    
    private final InventorySubject subject;
    
    public void checkInventoryLevels() {
        List<Product> products = productService.findAll();
        
        for (Product product : products) {
            int currentStock = calculateCurrentStock(product);
            if (currentStock <= product.getMinStock()) {
                subject.notifyLowStock(product, currentStock, product.getMinStock());
            }
        }
        
        List<InventoryBatch> batches = inventoryBatchService.findAll();
        for (InventoryBatch batch : batches) {
            int daysUntilExpiry = calculateDaysUntilExpiry(batch);
            if (daysUntilExpiry <= batch.getProduct().getExpiryAlertDays()) {
                subject.notifyExpiringSoon(batch, daysUntilExpiry);
            }
        }
    }
}
```

**Áp dụng vào:**
- Scheduled task để check inventory levels
- Real-time alerts khi stock changes
- Dashboard updates

#### 2.2. Purchase Order Status Observer

**Đề xuất: PurchaseOrderObserver**

```java
// PurchaseOrderObserver.java
public interface PurchaseOrderObserver {
    void onStatusChanged(PurchaseOrder order, PurchaseOrderStatus oldStatus, PurchaseOrderStatus newStatus);
    void onOrderCreated(PurchaseOrder order);
    void onOrderReceived(PurchaseOrder order);
}

// SupplierNotificationObserver.java
@Component
public class SupplierNotificationObserver implements PurchaseOrderObserver {
    
    private final NotificationService notificationService;
    
    @Override
    public void onStatusChanged(PurchaseOrder order, PurchaseOrderStatus oldStatus, PurchaseOrderStatus newStatus) {
        if (newStatus == PurchaseOrderStatus.ORDERED) {
            // Notify supplier
            notificationService.sendEmail(
                order.getSupplier().getContact().getEmail(),
                "New Purchase Order",
                "You have received a new purchase order: " + order.getOrderCode()
            );
        }
    }
    
    @Override
    public void onOrderCreated(PurchaseOrder order) {
        // Initial notification
    }
    
    @Override
    public void onOrderReceived(PurchaseOrder order) {
        // Confirm receipt
    }
}
```

**Áp dụng vào:**
- Notify suppliers khi order được tạo
- Update inventory khi order received
- Log status changes

---

## 3. State Pattern

### 📍 Nơi áp dụng

#### 3.1. Purchase Order State

**Vấn đề:**
- Hiện tại dùng enum `PurchaseOrderStatus` với switch statements
- Logic chuyển trạng thái rải rác
- Khó maintain và extend

**Đề xuất: PurchaseOrderState**

```java
// PurchaseOrderState.java - State interface
public interface PurchaseOrderState {
    void markOrdered(PurchaseOrder order);
    void markReceived(PurchaseOrder order);
    void cancel(PurchaseOrder order);
    PurchaseOrderStatus getStatus();
    boolean canEdit();
    boolean canDelete();
}

// DraftState.java
public class DraftState implements PurchaseOrderState {
    
    @Override
    public void markOrdered(PurchaseOrder order) {
        order.setStatus(PurchaseOrderStatus.ORDERED);
        order.setOrderDate(LocalDate.now());
        order.setState(new OrderedState());
        // Notify observers
    }
    
    @Override
    public void markReceived(PurchaseOrder order) {
        throw new IllegalStateException("Cannot receive a draft order");
    }
    
    @Override
    public void cancel(PurchaseOrder order) {
        order.setStatus(PurchaseOrderStatus.CANCELLED);
        order.setState(new CancelledState());
    }
    
    @Override
    public PurchaseOrderStatus getStatus() {
        return PurchaseOrderStatus.DRAFT;
    }
    
    @Override
    public boolean canEdit() {
        return true;
    }
    
    @Override
    public boolean canDelete() {
        return true;
    }
}

// OrderedState.java
public class OrderedState implements PurchaseOrderState {
    
    @Override
    public void markOrdered(PurchaseOrder order) {
        throw new IllegalStateException("Order is already ordered");
    }
    
    @Override
    public void markReceived(PurchaseOrder order) {
        order.setStatus(PurchaseOrderStatus.RECEIVED);
        order.setReceivedDate(LocalDate.now());
        order.setState(new ReceivedState());
        // Create inventory batches from order
        createInventoryFromOrder(order);
    }
    
    @Override
    public void cancel(PurchaseOrder order) {
        order.setStatus(PurchaseOrderStatus.CANCELLED);
        order.setState(new CancelledState());
    }
    
    @Override
    public PurchaseOrderStatus getStatus() {
        return PurchaseOrderStatus.ORDERED;
    }
    
    @Override
    public boolean canEdit() {
        return false;
    }
    
    @Override
    public boolean canDelete() {
        return false;
    }
    
    private void createInventoryFromOrder(PurchaseOrder order) {
        // Logic to create inventory batches
    }
}

// PurchaseOrder.java - Context
@Entity
public class PurchaseOrder extends AuditableEntity {
    
    @Transient
    private PurchaseOrderState state;
    
    @Enumerated(EnumType.STRING)
    private PurchaseOrderStatus status;
    
    @PostLoad
    private void initializeState() {
        this.state = createStateFromStatus(status);
    }
    
    private PurchaseOrderState createStateFromStatus(PurchaseOrderStatus status) {
        return switch (status) {
            case DRAFT -> new DraftState();
            case ORDERED -> new OrderedState();
            case RECEIVED -> new ReceivedState();
            case CANCELLED -> new CancelledState();
        };
    }
    
    public void markOrdered(LocalDate expectedDate) {
        state.markOrdered(this);
        this.expectedDate = expectedDate;
    }
    
    public void markReceived() {
        state.markReceived(this);
    }
    
    public void cancel() {
        state.cancel(this);
    }
    
    public boolean canEdit() {
        return state.canEdit();
    }
    
    public boolean canDelete() {
        return state.canDelete();
    }
}
```

**Áp dụng vào:**
- `PurchaseOrderService` - State transitions
- `PurchaseOrderController` - Validate operations based on state

---

## 4. Command Pattern

### 📍 Nơi áp dụng

#### 4.1. Undo/Redo Operations

**Đề xuất: Command Pattern cho Undo/Redo**

```java
// Command.java - Command interface
public interface Command {
    void execute();
    void undo();
    String getDescription();
}

// CreateProductCommand.java
public class CreateProductCommand implements Command {
    
    private final ProductService productService;
    private final Product product;
    private UUID createdId;
    
    public CreateProductCommand(ProductService productService, Product product) {
        this.productService = productService;
        this.product = product;
    }
    
    @Override
    public void execute() {
        Product created = productService.createProduct(product);
        this.createdId = created.getId();
    }
    
    @Override
    public void undo() {
        if (createdId != null) {
            productService.deactivateProduct(createdId);
        }
    }
    
    @Override
    public String getDescription() {
        return "Create product: " + product.getName();
    }
}

// UpdateProductCommand.java
public class UpdateProductCommand implements Command {
    
    private final ProductService productService;
    private final UUID productId;
    private final ProductRequest newData;
    private Product originalProduct; // Memento for undo
    
    public UpdateProductCommand(
            ProductService productService,
            UUID productId,
            ProductRequest newData) {
        this.productService = productService;
        this.productId = productId;
        this.newData = newData;
    }
    
    @Override
    public void execute() {
        // Save original state
        originalProduct = productService.findById(productId)
            .orElseThrow();
        
        // Apply update
        productService.updateProduct(productId, newData);
    }
    
    @Override
    public void undo() {
        if (originalProduct != null) {
            // Restore original state
            productService.updateProduct(productId, toRequest(originalProduct));
        }
    }
    
    @Override
    public String getDescription() {
        return "Update product: " + productId;
    }
}

// CommandInvoker.java - Invoker
@Service
public class CommandInvoker {
    
    private final Stack<Command> history = new Stack<>();
    private final Stack<Command> redoStack = new Stack<>();
    
    public void executeCommand(Command command) {
        command.execute();
        history.push(command);
        redoStack.clear(); // Clear redo stack when new command executed
    }
    
    public void undo() {
        if (!history.isEmpty()) {
            Command command = history.pop();
            command.undo();
            redoStack.push(command);
        }
    }
    
    public void redo() {
        if (!redoStack.isEmpty()) {
            Command command = redoStack.pop();
            command.execute();
            history.push(command);
        }
    }
    
    public boolean canUndo() {
        return !history.isEmpty();
    }
    
    public boolean canRedo() {
        return !redoStack.isEmpty();
    }
    
    public List<String> getHistory() {
        return history.stream()
            .map(Command::getDescription)
            .collect(Collectors.toList());
    }
}
```

**Áp dụng vào:**
- Product management - Undo create/update/delete
- Purchase order - Undo status changes
- UI - Undo/Redo buttons

#### 4.2. Batch Operations Command

**Đề xuất: BatchCommand**

```java
// BatchCommand.java - Composite Command
public class BatchCommand implements Command {
    
    private final List<Command> commands;
    
    public BatchCommand(List<Command> commands) {
        this.commands = new ArrayList<>(commands);
    }
    
    @Override
    public void execute() {
        for (Command command : commands) {
            command.execute();
        }
    }
    
    @Override
    public void undo() {
        // Undo in reverse order
        Collections.reverse(commands);
        for (Command command : commands) {
            command.undo();
        }
        Collections.reverse(commands);
    }
    
    @Override
    public String getDescription() {
        return "Batch operation: " + commands.size() + " commands";
    }
}
```

**Áp dụng vào:**
- Bulk product updates
- Bulk inventory adjustments
- Bulk status changes

---

## 5. Template Method Pattern

### 📍 Nơi áp dụng

#### 5.1. Report Generation Template

**Đề xuất: ReportTemplate**

```java
// ReportGenerator.java - Abstract class với template method
public abstract class ReportGenerator {
    
    // Template method - defines skeleton
    public final byte[] generateReport(ReportRequest request) {
        // Step 1: Fetch data
        ReportData data = fetchData(request);
        
        // Step 2: Process data
        ReportData processed = processData(data);
        
        // Step 3: Format report
        ReportDocument document = formatReport(processed);
        
        // Step 4: Export
        return exportReport(document, request.getFormat());
    }
    
    // Abstract methods - subclasses must implement
    protected abstract ReportData fetchData(ReportRequest request);
    protected abstract ReportData processData(ReportData data);
    protected abstract ReportDocument formatReport(ReportData data);
    
    // Hook method - can be overridden
    protected byte[] exportReport(ReportDocument document, ReportFormat format) {
        return document.export(format);
    }
}

// SalesReportGenerator.java - Concrete implementation
public class SalesReportGenerator extends ReportGenerator {
    
    private final SaleTransactionService saleService;
    
    @Override
    protected ReportData fetchData(ReportRequest request) {
        List<SaleTransaction> sales = saleService.findByDateRange(
            request.getStartDate(),
            request.getEndDate()
        );
        return new SalesReportData(sales);
    }
    
    @Override
    protected ReportData processData(ReportData data) {
        SalesReportData salesData = (SalesReportData) data;
        
        // Calculate statistics
        BigDecimal totalSales = salesData.getSales().stream()
            .map(SaleTransaction::getTotalAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        salesData.setTotalSales(totalSales);
        salesData.setTransactionCount(salesData.getSales().size());
        
        return salesData;
    }
    
    @Override
    protected ReportDocument formatReport(ReportData data) {
        SalesReportData salesData = (SalesReportData) data;
        ReportDocument document = new ReportDocument();
        document.addTitle("Sales Report");
        document.addSection("Summary", formatSummary(salesData));
        document.addSection("Details", formatDetails(salesData));
        return document;
    }
    
    private String formatSummary(SalesReportData data) {
        return String.format(
            "Total Sales: %s\nTransactions: %d",
            data.getTotalSales(), data.getTransactionCount()
        );
    }
    
    private String formatDetails(SalesReportData data) {
        // Format detailed sales list
        return "...";
    }
}
```

**Áp dụng vào:**
- Report generation với common flow
- Service methods với shared logic

---

## 6. Chain of Responsibility Pattern

### 📍 Nơi áp dụng

#### 6.1. Validation Chain

**Đề xuất: ValidationHandler**

```java
// ValidationHandler.java - Handler interface
public abstract class ValidationHandler {
    protected ValidationHandler next;
    
    public ValidationHandler setNext(ValidationHandler next) {
        this.next = next;
        return next;
    }
    
    public abstract ValidationResult validate(ValidationRequest request);
    
    protected ValidationResult checkNext(ValidationRequest request) {
        if (next == null) {
            return ValidationResult.success();
        }
        return next.validate(request);
    }
}

// ProductSKUValidationHandler.java
public class ProductSKUValidationHandler extends ValidationHandler {
    
    @Override
    public ValidationResult validate(ValidationRequest request) {
        ProductRequest productRequest = (ProductRequest) request;
        
        if (productRequest.getSku() == null || productRequest.getSku().isBlank()) {
            return ValidationResult.failure("SKU is required");
        }
        
        if (productRequest.getSku().length() > 64) {
            return ValidationResult.failure("SKU is too long (max 64 characters)");
        }
        
        return checkNext(request);
    }
}

// ProductNameValidationHandler.java
public class ProductNameValidationHandler extends ValidationHandler {
    
    @Override
    public ValidationResult validate(ValidationRequest request) {
        ProductRequest productRequest = (ProductRequest) request;
        
        if (productRequest.getName() == null || productRequest.getName().isBlank()) {
            return ValidationResult.failure("Product name is required");
        }
        
        return checkNext(request);
    }
}

// ProductCategoryValidationHandler.java
public class ProductCategoryValidationHandler extends ValidationHandler {
    
    @Override
    public ValidationResult validate(ValidationRequest request) {
        ProductRequest productRequest = (ProductRequest) request;
        
        if (productRequest.getCategory() == null) {
            return ValidationResult.failure("Product category is required");
        }
        
        return checkNext(request);
    }
}

// ValidationChainBuilder.java
@Component
public class ValidationChainBuilder {
    
    public ValidationHandler buildProductValidationChain() {
        ValidationHandler skuHandler = new ProductSKUValidationHandler();
        ValidationHandler nameHandler = new ProductNameValidationHandler();
        ValidationHandler categoryHandler = new ProductCategoryValidationHandler();
        
        skuHandler.setNext(nameHandler).setNext(categoryHandler);
        
        return skuHandler;
    }
}

// ProductService.java - Sử dụng chain
@Service
public class ProductService {
    
    private final ValidationChainBuilder chainBuilder;
    
    public Product createProduct(ProductRequest request) {
        ValidationHandler chain = chainBuilder.buildProductValidationChain();
        ValidationResult result = chain.validate(request);
        
        if (!result.isValid()) {
            throw new ValidationException(result.getErrors());
        }
        
        // Create product
        return productRepository.save(toEntity(request));
    }
}
```

**Áp dụng vào:**
- Request validation
- Approval workflow
- Error handling chain

---

## 7. Visitor Pattern

### 📍 Nơi áp dụng

#### 7.1. Report Visitor

**Đề xuất: ReportVisitor**

```java
// ReportVisitor.java - Visitor interface
public interface ReportVisitor {
    void visitProduct(Product product);
    void visitSaleTransaction(SaleTransaction sale);
    void visitPurchaseOrder(PurchaseOrder order);
    void visitInventoryBatch(InventoryBatch batch);
}

// ReportData.java - Element interface
public interface ReportData {
    void accept(ReportVisitor visitor);
}

// Product.java - Concrete Element
@Entity
public class Product extends AuditableEntity implements ReportData {
    
    @Override
    public void accept(ReportVisitor visitor) {
        visitor.visitProduct(this);
    }
}

// SalesReportVisitor.java - Concrete Visitor
public class SalesReportVisitor implements ReportVisitor {
    
    private final List<SaleTransaction> sales = new ArrayList<>();
    private BigDecimal totalSales = BigDecimal.ZERO;
    
    @Override
    public void visitProduct(Product product) {
        // Not used in sales report
    }
    
    @Override
    public void visitSaleTransaction(SaleTransaction sale) {
        sales.add(sale);
        totalSales = totalSales.add(sale.getTotalAmount());
    }
    
    @Override
    public void visitPurchaseOrder(PurchaseOrder order) {
        // Not used in sales report
    }
    
    @Override
    public void visitInventoryBatch(InventoryBatch batch) {
        // Not used in sales report
    }
    
    public SalesReportData getReportData() {
        return new SalesReportData(sales, totalSales);
    }
}

// InventoryReportVisitor.java
public class InventoryReportVisitor implements ReportVisitor {
    
    private final List<InventoryBatch> batches = new ArrayList<>();
    private final Map<UUID, Integer> productStock = new HashMap<>();
    
    @Override
    public void visitInventoryBatch(InventoryBatch batch) {
        batches.add(batch);
        UUID productId = batch.getProduct().getId();
        productStock.merge(productId, batch.getQuantityOnHand(), Integer::sum);
    }
    
    // ... other visit methods
    
    public InventoryReportData getReportData() {
        return new InventoryReportData(batches, productStock);
    }
}
```

**Áp dụng vào:**
- Report generation visiting different entities
- Export functionality
- Data aggregation

---

## 8. Mediator Pattern

### 📍 Nơi áp dụng

#### 8.1. Event Mediator

**Đề xuất: EventMediator**

```java
// EventMediator.java - Mediator interface
public interface EventMediator {
    void notify(String event, Object data);
    void subscribe(String event, EventHandler handler);
    void unsubscribe(String event, EventHandler handler);
}

// EventMediatorImpl.java
@Component
public class EventMediatorImpl implements EventMediator {
    
    private final Map<String, List<EventHandler>> handlers = new ConcurrentHashMap<>();
    
    @Override
    public void notify(String event, Object data) {
        List<EventHandler> eventHandlers = handlers.get(event);
        if (eventHandlers != null) {
            for (EventHandler handler : eventHandlers) {
                handler.handle(event, data);
            }
        }
    }
    
    @Override
    public void subscribe(String event, EventHandler handler) {
        handlers.computeIfAbsent(event, k -> new ArrayList<>()).add(handler);
    }
    
    @Override
    public void unsubscribe(String event, EventHandler handler) {
        List<EventHandler> eventHandlers = handlers.get(event);
        if (eventHandlers != null) {
            eventHandlers.remove(handler);
        }
    }
}

// EventHandler.java
public interface EventHandler {
    void handle(String event, Object data);
}

// ProductService.java - Sử dụng mediator
@Service
public class ProductService {
    
    private final EventMediator eventMediator;
    
    public Product createProduct(Product product) {
        Product created = productRepository.save(product);
        
        // Notify through mediator
        eventMediator.notify("PRODUCT_CREATED", created);
        
        return created;
    }
}

// SystemLogEventHandler.java
@Component
public class SystemLogEventHandler implements EventHandler {
    
    private final SystemLogService logService;
    
    @PostConstruct
    public void subscribe() {
        eventMediator.subscribe("PRODUCT_CREATED", this);
        eventMediator.subscribe("PRODUCT_UPDATED", this);
        eventMediator.subscribe("SALE_COMPLETED", this);
    }
    
    @Override
    public void handle(String event, Object data) {
        SystemLog log = SystemLog.builder()
            .action(event)
            .entityType(data.getClass().getSimpleName())
            .entityId(extractId(data))
            .build();
        
        logService.createLog(log);
    }
}
```

**Áp dụng vào:**
- Event-driven architecture
- Decouple components
- Centralized event handling

---

## 9. Iterator Pattern

### 📍 Nơi áp dụng

#### 9.1. Pagination Iterator

**Đề xuất: PaginatedIterator**

```java
// PaginatedIterator.java
public class PaginatedIterator<T> implements Iterator<T> {
    
    private final Function<Integer, Page<T>> pageLoader;
    private Page<T> currentPage;
    private int currentIndex = 0;
    private int currentPageNumber = 0;
    
    public PaginatedIterator(Function<Integer, Page<T>> pageLoader) {
        this.pageLoader = pageLoader;
        this.currentPage = pageLoader.apply(0);
    }
    
    @Override
    public boolean hasNext() {
        if (currentPage == null) {
            return false;
        }
        
        if (currentIndex < currentPage.getContent().size()) {
            return true;
        }
        
        // Load next page
        if (currentPage.hasNext()) {
            currentPage = pageLoader.apply(++currentPageNumber);
            currentIndex = 0;
            return currentIndex < currentPage.getContent().size();
        }
        
        return false;
    }
    
    @Override
    public T next() {
        if (!hasNext()) {
            throw new NoSuchElementException();
        }
        return currentPage.getContent().get(currentIndex++);
    }
}

// ProductService.java - Sử dụng iterator
@Service
public class ProductService {
    
    public Iterator<Product> getAllProductsIterator() {
        return new PaginatedIterator<>(pageNumber -> 
            productRepository.findAll(PageRequest.of(pageNumber, 100))
        );
    }
}
```

**Áp dụng vào:**
- Large dataset iteration
- Lazy loading
- Memory-efficient processing

---

## 10. Memento Pattern

### 📍 Nơi áp dụng

#### 10.1. Product State Memento

**Đề xuất: ProductMemento**

```java
// ProductMemento.java - Memento
public class ProductMemento {
    private final UUID id;
    private final String sku;
    private final String name;
    private final String activeIngredient;
    private final ProductCategory category;
    private final OffsetDateTime savedAt;
    
    public ProductMemento(Product product) {
        this.id = product.getId();
        this.sku = product.getSku();
        this.name = product.getName();
        this.activeIngredient = product.getActiveIngredient();
        this.category = product.getCategory();
        this.savedAt = OffsetDateTime.now();
    }
    
    public Product restore() {
        return Product.newBuilder()
            .id(id)
            .sku(sku)
            .name(name)
            .activeIngredient(activeIngredient)
            .category(category)
            .build();
    }
}

// ProductCaretaker.java - Caretaker
@Service
public class ProductCaretaker {
    
    private final Map<UUID, Stack<ProductMemento>> history = new ConcurrentHashMap<>();
    
    public void saveState(Product product) {
        ProductMemento memento = new ProductMemento(product);
        history.computeIfAbsent(product.getId(), k -> new Stack<>())
            .push(memento);
    }
    
    public ProductMemento getLastState(UUID productId) {
        Stack<ProductMemento> productHistory = history.get(productId);
        if (productHistory == null || productHistory.isEmpty()) {
            return null;
        }
        return productHistory.peek();
    }
    
    public Product restoreLastState(UUID productId) {
        Stack<ProductMemento> productHistory = history.get(productId);
        if (productHistory == null || productHistory.isEmpty()) {
            throw new IllegalStateException("No saved state for product: " + productId);
        }
        ProductMemento memento = productHistory.pop();
        return memento.restore();
    }
    
    public List<ProductMemento> getHistory(UUID productId) {
        Stack<ProductMemento> productHistory = history.get(productId);
        return productHistory != null ? new ArrayList<>(productHistory) : Collections.emptyList();
    }
}
```

**Áp dụng vào:**
- Undo operations
- Version history
- Save/restore state

---

## 📊 Tóm tắt áp dụng

| Pattern | Vị trí áp dụng | Lợi ích | Ưu tiên |
|---------|----------------|---------|---------|
| **Strategy** | InventoryAllocation, Payment, Discount | Thay đổi algorithm runtime | ⭐⭐⭐⭐⭐ |
| **Observer** | InventoryAlerts, StatusChanges | Decouple notification | ⭐⭐⭐⭐⭐ |
| **State** | PurchaseOrderStatus, ProductStatus | Manage state transitions | ⭐⭐⭐⭐ |
| **Command** | Undo/Redo, BatchOperations | Encapsulate requests | ⭐⭐⭐⭐ |
| **Template Method** | ReportGeneration, ServiceFlow | Define algorithm skeleton | ⭐⭐⭐ |
| **Chain of Responsibility** | Validation, Approval | Process requests in chain | ⭐⭐⭐ |
| **Visitor** | ReportGeneration, Export | Separate algorithms from objects | ⭐⭐⭐ |
| **Mediator** | EventHandling, Communication | Reduce coupling | ⭐⭐⭐ |
| **Iterator** | Pagination, LargeDatasets | Traverse collections | ⭐⭐ |
| **Memento** | Undo, VersionHistory | Save/restore state | ⭐⭐⭐ |

---

## 🎯 Kế hoạch triển khai

### Phase 1: Strategy Pattern (Ưu tiên cao)
1. Implement `InventoryAllocationStrategy` - FEFO, FIFO, LIFO
2. Implement `PaymentStrategy` - Cash, Card, etc.
3. Implement `DiscountStrategy` - Percentage, Fixed, BuyXGetY

### Phase 2: Observer Pattern (Ưu tiên cao)
1. Implement `InventoryObserver` - Low stock, expiry alerts
2. Implement `PurchaseOrderObserver` - Status change notifications
3. Integrate với notification system

### Phase 3: State Pattern
1. Refactor `PurchaseOrderStatus` sang State pattern
2. Implement state transitions
3. Add state validation

### Phase 4: Command Pattern
1. Implement `Command` interface và concrete commands
2. Implement `CommandInvoker` cho undo/redo
3. Add UI support cho undo/redo

### Phase 5: Template Method & Others
1. Implement `ReportGenerator` template
2. Implement `ValidationHandler` chain
3. Implement `EventMediator`

---

## 📝 Code Examples

### Ví dụ 1: Strategy Pattern trong POS

**Trước:**
```java
// Hard-coded FEFO logic
List<InventoryBatch> available = batches.stream()
    .filter(b -> b.getQuantityOnHand() > 0)
    .sorted(Comparator.comparing(InventoryBatch::getExpiryDate))
    .collect(Collectors.toList());
```

**Sau:**
```java
// Use strategy
List<InventoryAllocation> allocations = allocationService.allocate(
    "FEFO",  // Strategy name
    batches,
    requestedQuantity
);
```

### Ví dụ 2: Observer Pattern

```java
// Subscribe to events
inventorySubject.addObserver(new EmailNotificationObserver());
inventorySubject.addObserver(new SystemLogObserver());

// Notify observers
inventorySubject.notifyLowStock(product, currentStock, minStock);
```

---

## 🔗 Tài liệu tham khảo

- [Design Patterns: Elements of Reusable Object-Oriented Software](https://en.wikipedia.org/wiki/Design_Patterns)
- [Strategy Pattern - Refactoring Guru](https://refactoring.guru/design-patterns/strategy)
- [Observer Pattern - Refactoring Guru](https://refactoring.guru/design-patterns/observer)
- [State Pattern - Refactoring Guru](https://refactoring.guru/design-patterns/state)
- [Command Pattern - Refactoring Guru](https://refactoring.guru/design-patterns/command)

---

**Tài liệu này mô tả các Behavioral Design Patterns có thể áp dụng vào dự án PharmaFlow. Ưu tiên triển khai Strategy và Observer Patterns trước vì chúng sẽ cải thiện flexibility và decoupling đáng kể.**







