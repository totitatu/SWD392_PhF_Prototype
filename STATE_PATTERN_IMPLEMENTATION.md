# State Pattern Implementation - Purchase Order Management

## Tổng quan

State Pattern được áp dụng trong hệ thống quản lý nhà thuốc để quản lý lifecycle của Purchase Order (Đơn đặt hàng). Pattern này giúp quản lý các trạng thái và chuyển đổi trạng thái một cách rõ ràng, dễ bảo trì và mở rộng.

## Vấn đề giải quyết

Trước khi áp dụng State Pattern, việc quản lý trạng thái Purchase Order gặp các vấn đề:
- Logic kiểm tra trạng thái rải rác trong nhiều nơi
- Khó thêm trạng thái mới hoặc thay đổi logic transition
- Dễ xảy ra lỗi khi thêm điều kiện mới
- Code khó đọc và bảo trì

## Cấu trúc State Pattern

### 1. Context (PurchaseOrder Entity)

`PurchaseOrder` là context chứa trạng thái hiện tại và delegate các hành động cho state object.

```java
@Entity
@Table(name = "purchase_orders")
public class PurchaseOrder extends AuditableEntity {
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private PurchaseOrderStatus status;
    
    // Methods delegate to state
    public void markOrdered(LocalDate expectedDate) {
        this.status = PurchaseOrderStatus.ORDERED;
        this.expectedDate = expectedDate;
    }
    
    public void markReceived() {
        this.status = PurchaseOrderStatus.RECEIVED;
    }
    
    public void cancel() {
        this.status = PurchaseOrderStatus.CANCELLED;
    }
}
```

### 2. State Interface (PurchaseOrderState)

Định nghĩa interface cho tất cả các state với các operations có thể thực hiện:

```java
public interface PurchaseOrderState {
    PurchaseOrder markOrdered(PurchaseOrder order, LocalDate expectedDate);
    PurchaseOrder markReceived(PurchaseOrder order);
    PurchaseOrder cancel(PurchaseOrder order);
    boolean canDelete();
    boolean canUpdate();
    PurchaseOrderStatus getStatus();
}
```

### 3. Concrete States

#### 3.1. DraftState
- **Trạng thái**: DRAFT (Nháp)
- **Hành động cho phép**:
  - ✅ `markOrdered()`: Chuyển sang ORDERED
  - ✅ `cancel()`: Hủy đơn hàng
  - ✅ `canUpdate()`: true - Có thể chỉnh sửa
  - ✅ `canDelete()`: true - Có thể xóa
- **Hành động không cho phép**:
  - ❌ `markReceived()`: Không thể nhận hàng trực tiếp từ DRAFT

```java
public class DraftState implements PurchaseOrderState {
    @Override
    public PurchaseOrder markOrdered(PurchaseOrder order, LocalDate expectedDate) {
        order.markOrdered(expectedDate);
        return order;
    }
    
    @Override
    public PurchaseOrder markReceived(PurchaseOrder order) {
        throw new IllegalStateException(
            "Cannot mark DRAFT order as RECEIVED. Order must be ORDERED first.");
    }
    
    @Override
    public PurchaseOrder cancel(PurchaseOrder order) {
        order.cancel();
        return order;
    }
    
    @Override
    public boolean canDelete() {
        return true;
    }
    
    @Override
    public boolean canUpdate() {
        return true;
    }
}
```

#### 3.2. OrderedState
- **Trạng thái**: ORDERED (Đã đặt hàng)
- **Hành động cho phép**:
  - ✅ `markReceived()`: Nhận hàng, tự động tạo inventory batches
  - ✅ `cancel()`: Hủy đơn hàng (trước khi nhận)
- **Hành động không cho phép**:
  - ❌ `markOrdered()`: Đã ở trạng thái ORDERED
  - ❌ `canUpdate()`: false - Không thể chỉnh sửa
  - ❌ `canDelete()`: false - Không thể xóa

```java
public class OrderedState implements PurchaseOrderState {
    @Override
    public PurchaseOrder markOrdered(PurchaseOrder order, LocalDate expectedDate) {
        throw new IllegalStateException(
            "Order is already ORDERED. Cannot mark as ORDERED again.");
    }
    
    @Override
    public PurchaseOrder markReceived(PurchaseOrder order) {
        order.markReceived();
        return order;
    }
    
    @Override
    public PurchaseOrder cancel(PurchaseOrder order) {
        order.cancel();
        return order;
    }
    
    @Override
    public boolean canDelete() {
        return false;
    }
    
    @Override
    public boolean canUpdate() {
        return false;
    }
}
```

#### 3.3. ReceivedState
- **Trạng thái**: RECEIVED (Đã nhận hàng) - **Final State**
- **Hành động không cho phép**:
  - ❌ Tất cả transitions: Không thể thay đổi trạng thái
  - ❌ `canUpdate()`: false
  - ❌ `canDelete()`: false

```java
public class ReceivedState implements PurchaseOrderState {
    @Override
    public PurchaseOrder markOrdered(PurchaseOrder order, LocalDate expectedDate) {
        throw new IllegalStateException(
            "Cannot mark RECEIVED order as ORDERED. Order is already completed.");
    }
    
    @Override
    public PurchaseOrder markReceived(PurchaseOrder order) {
        throw new IllegalStateException("Order is already RECEIVED.");
    }
    
    @Override
    public PurchaseOrder cancel(PurchaseOrder order) {
        throw new IllegalStateException(
            "Cannot cancel RECEIVED order. Order is already completed.");
    }
    
    @Override
    public boolean canDelete() {
        return false;
    }
    
    @Override
    public boolean canUpdate() {
        return false;
    }
}
```

#### 3.4. CancelledState
- **Trạng thái**: CANCELLED (Đã hủy) - **Final State**
- **Hành động không cho phép**:
  - ❌ Tất cả transitions: Không thể thay đổi trạng thái
  - ❌ `canUpdate()`: false
  - ❌ `canDelete()`: false (để audit)

```java
public class CancelledState implements PurchaseOrderState {
    @Override
    public PurchaseOrder markOrdered(PurchaseOrder order, LocalDate expectedDate) {
        throw new IllegalStateException(
            "Cannot mark CANCELLED order as ORDERED. Order is cancelled.");
    }
    
    @Override
    public PurchaseOrder markReceived(PurchaseOrder order) {
        throw new IllegalStateException(
            "Cannot mark CANCELLED order as RECEIVED. Order is cancelled.");
    }
    
    @Override
    public PurchaseOrder cancel(PurchaseOrder order) {
        throw new IllegalStateException("Order is already CANCELLED.");
    }
    
    @Override
    public boolean canDelete() {
        return false; // For audit purposes
    }
    
    @Override
    public boolean canUpdate() {
        return false;
    }
}
```

### 4. State Factory (PurchaseOrderStateFactory)

Factory pattern kết hợp với State Pattern để tái sử dụng state instances (singleton):

```java
public class PurchaseOrderStateFactory {
    private static final Map<PurchaseOrderStatus, PurchaseOrderState> states = 
        new EnumMap<>(PurchaseOrderStatus.class);
    
    static {
        states.put(PurchaseOrderStatus.DRAFT, new DraftState());
        states.put(PurchaseOrderStatus.ORDERED, new OrderedState());
        states.put(PurchaseOrderStatus.RECEIVED, new ReceivedState());
        states.put(PurchaseOrderStatus.CANCELLED, new CancelledState());
    }
    
    public static PurchaseOrderState getState(PurchaseOrderStatus status) {
        PurchaseOrderState state = states.get(status);
        if (state == null) {
            throw new IllegalArgumentException("Unknown purchase order status: " + status);
        }
        return state;
    }
}
```

## Sử dụng trong Service Layer

### PurchaseOrderServiceImpl

Service layer sử dụng State Pattern để xử lý transitions:

```java
@Service
public class PurchaseOrderServiceImpl implements PurchaseOrderService {
    
    @Override
    public PurchaseOrder markReceived(UUID id) {
        PurchaseOrder order = purchaseOrderRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Purchase order not found: " + id));
        
        // Lấy state hiện tại từ Factory
        PurchaseOrderState currentState = PurchaseOrderStateFactory.getState(order.getStatus());
        
        // Delegate transition cho state
        PurchaseOrder updatedOrder = currentState.markReceived(order);
        PurchaseOrder savedOrder = purchaseOrderRepository.save(updatedOrder);
        
        // Tự động tạo inventory batches khi chuyển sang RECEIVED
        if (savedOrder.getStatus() == PurchaseOrderStatus.RECEIVED) {
            createInventoryBatchesFromOrder(savedOrder);
        }
        
        return savedOrder;
    }
    
    @Override
    public PurchaseOrder updateStatus(UUID id, PurchaseOrderStatus status) {
        PurchaseOrder order = purchaseOrderRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Purchase order not found: " + id));
        
        // Validate: Không cho phép thay đổi từ final states
        if (order.getStatus() == PurchaseOrderStatus.RECEIVED || 
            order.getStatus() == PurchaseOrderStatus.CANCELLED) {
            throw new IllegalStateException(
                "Cannot change status from " + order.getStatus() + 
                ". Order is already in final state.");
        }
        
        // Lấy state hiện tại và target state
        PurchaseOrderState currentState = PurchaseOrderStateFactory.getState(order.getStatus());
        PurchaseOrderState targetState = PurchaseOrderStateFactory.getState(status);
        
        // Thực hiện transition dựa trên target state
        PurchaseOrder updatedOrder;
        switch (status) {
            case ORDERED:
                updatedOrder = currentState.markOrdered(order, null);
                break;
            case RECEIVED:
                updatedOrder = currentState.markReceived(order);
                break;
            case CANCELLED:
                updatedOrder = currentState.cancel(order);
                break;
            default:
                throw new IllegalArgumentException("Unknown status: " + status);
        }
        
        PurchaseOrder savedOrder = purchaseOrderRepository.save(updatedOrder);
        
        // Side effect: Tạo inventory khi RECEIVED
        if (savedOrder.getStatus() == PurchaseOrderStatus.RECEIVED) {
            createInventoryBatchesFromOrder(savedOrder);
        }
        
        return savedOrder;
    }
}
```

## State Transition Diagram

```
                    [*]
                     |
                     v
                  DRAFT
                  / | \
                 /  |  \
        markOrdered | cancel
               /    |    \
              /     |     \
         ORDERED    |   CANCELLED
            / \     |      |
           /   \    |      |
  markReceived cancel|      |
         /       \  |      |
        /         \ |      |
    RECEIVED   CANCELLED   |
        |            |     |
        |            |     |
        +------------+-----+
                     |
                    [*]
```

### Valid Transitions

| From State | To State | Method | Allowed |
|------------|----------|--------|---------|
| DRAFT | ORDERED | `markOrdered()` | ✅ |
| DRAFT | CANCELLED | `cancel()` | ✅ |
| DRAFT | RECEIVED | `markReceived()` | ❌ |
| ORDERED | RECEIVED | `markReceived()` | ✅ |
| ORDERED | CANCELLED | `cancel()` | ✅ |
| ORDERED | DRAFT | - | ❌ |
| RECEIVED | Any | - | ❌ (Final State) |
| CANCELLED | Any | - | ❌ (Final State) |

## Lợi ích của State Pattern

### 1. **Tách biệt logic theo trạng thái**
- Mỗi state có logic riêng, dễ đọc và bảo trì
- Không cần if-else phức tạp để kiểm tra trạng thái

### 2. **Dễ mở rộng**
- Thêm state mới: Tạo class mới implement `PurchaseOrderState`
- Thêm transition mới: Thêm method vào interface và implement trong các state

### 3. **Tuân thủ Open/Closed Principle**
- Mở rộng (thêm state mới) mà không cần sửa code cũ
- Đóng với việc sửa đổi (không cần thay đổi context)

### 4. **Type Safety**
- Compiler kiểm tra tất cả state phải implement đầy đủ methods
- Tránh lỗi runtime khi thiếu implementation

### 5. **Single Responsibility**
- Mỗi state class chỉ chịu trách nhiệm cho một trạng thái
- Logic transition được encapsulate trong state object

## Business Rules Enforced

### 1. **DRAFT State**
- ✅ Có thể chỉnh sửa items, supplier, expected date
- ✅ Có thể xóa order
- ✅ Có thể gửi đi (chuyển sang ORDERED)
- ✅ Có thể hủy (chuyển sang CANCELLED)
- ❌ Không thể nhận hàng trực tiếp (phải qua ORDERED)

### 2. **ORDERED State**
- ✅ Có thể nhận hàng (chuyển sang RECEIVED)
- ✅ Có thể hủy (chuyển sang CANCELLED)
- ❌ Không thể chỉnh sửa items
- ❌ Không thể xóa order

### 3. **RECEIVED State (Final)**
- ✅ Tự động tạo inventory batches khi chuyển sang state này
- ❌ Không thể thay đổi trạng thái
- ❌ Không thể chỉnh sửa
- ❌ Không thể xóa (để audit)

### 4. **CANCELLED State (Final)**
- ❌ Không thể thay đổi trạng thái
- ❌ Không thể chỉnh sửa
- ❌ Không thể xóa (để audit)

## Side Effects và Business Logic

### Khi chuyển sang RECEIVED

Khi purchase order chuyển sang RECEIVED, hệ thống tự động:

1. **Tạo Inventory Batches**: Mỗi line item trong purchase order tạo một inventory batch
2. **Cập nhật Stock**: Số lượng thuốc được cập nhật vào database
3. **Set Batch Information**:
   - Batch number: `{orderCode}-L{lineNumber}`
   - Cost price: Từ purchase order line
   - Selling price: Cost price × 1.2 (20% markup)
   - Received date: Ngày hiện tại
   - Expiry date: 2 năm từ ngày nhận

```java
private void createInventoryBatchesFromOrder(PurchaseOrder order) {
    LocalDate receivedDate = LocalDate.now();
    
    for (PurchaseOrderLine line : order.getLineItems()) {
        String batchNumber = String.format("%s-L%d", 
            order.getOrderCode(), line.getLineNumber());
        BigDecimal sellingPrice = line.getUnitCost().multiply(new BigDecimal("1.2"));
        LocalDate expiryDate = receivedDate.plusYears(2);
        
        InventoryBatch batch = InventoryBatch.newBuilder()
            .product(line.getProduct())
            .batchNumber(batchNumber)
            .quantityOnHand(line.getQuantity())
            .costPrice(line.getUnitCost())
            .receivedDate(receivedDate)
            .expiryDate(expiryDate)
            .sellingPrice(sellingPrice)
            .active(true)
            .build();
        
        inventoryBatchService.createBatch(batch);
    }
}
```

## Error Handling

State Pattern giúp xử lý lỗi rõ ràng:

```java
// Trong Controller
@PutMapping("/{id}/status")
public ResponseEntity<?> updateOrderStatus(@PathVariable UUID id, 
                                          @RequestParam String status) {
    try {
        PurchaseOrder currentOrder = purchaseOrderService.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Purchase order not found"));
        
        // Validate final states
        if (currentOrder.getStatus() == PurchaseOrderStatus.RECEIVED || 
            currentOrder.getStatus() == PurchaseOrderStatus.CANCELLED) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Cannot change status from " + currentOrder.getStatus(),
                            "message", "Order is already in final state"));
        }
        
        PurchaseOrderStatus statusEnum = PurchaseOrderStatus.valueOf(status.toUpperCase());
        purchaseOrderService.updateStatus(id, statusEnum);
        
        return ResponseEntity.ok(toResponse(order));
    } catch (IllegalStateException e) {
        // State transition error từ State Pattern
        return ResponseEntity.badRequest()
            .body(Map.of("error", "Invalid state transition", 
                        "message", e.getMessage()));
    }
}
```

## Testing State Pattern

### Unit Test Example

```java
@Test
void testDraftStateCanMarkOrdered() {
    PurchaseOrder order = createDraftOrder();
    PurchaseOrderState state = PurchaseOrderStateFactory.getState(PurchaseOrderStatus.DRAFT);
    
    PurchaseOrder result = state.markOrdered(order, LocalDate.now().plusDays(7));
    
    assertEquals(PurchaseOrderStatus.ORDERED, result.getStatus());
}

@Test
void testDraftStateCannotMarkReceived() {
    PurchaseOrder order = createDraftOrder();
    PurchaseOrderState state = PurchaseOrderStateFactory.getState(PurchaseOrderStatus.DRAFT);
    
    assertThrows(IllegalStateException.class, 
        () -> state.markReceived(order));
}

@Test
void testReceivedStateCannotChange() {
    PurchaseOrder order = createReceivedOrder();
    PurchaseOrderState state = PurchaseOrderStateFactory.getState(PurchaseOrderStatus.RECEIVED);
    
    assertThrows(IllegalStateException.class, 
        () -> state.markOrdered(order, null));
    assertThrows(IllegalStateException.class, 
        () -> state.cancel(order));
    assertFalse(state.canUpdate());
    assertFalse(state.canDelete());
}
```

## So sánh với cách tiếp cận khác

### ❌ Without State Pattern (If-Else Approach)

```java
// Bad: Logic rải rác, khó bảo trì
public void updateStatus(PurchaseOrder order, PurchaseOrderStatus newStatus) {
    if (order.getStatus() == PurchaseOrderStatus.DRAFT) {
        if (newStatus == PurchaseOrderStatus.ORDERED) {
            order.setStatus(newStatus);
        } else if (newStatus == PurchaseOrderStatus.CANCELLED) {
            order.setStatus(newStatus);
        } else {
            throw new IllegalStateException("Invalid transition");
        }
    } else if (order.getStatus() == PurchaseOrderStatus.ORDERED) {
        if (newStatus == PurchaseOrderStatus.RECEIVED) {
            order.setStatus(newStatus);
            createInventory(order); // Side effect
        } else if (newStatus == PurchaseOrderStatus.CANCELLED) {
            order.setStatus(newStatus);
        } else {
            throw new IllegalStateException("Invalid transition");
        }
    } else if (order.getStatus() == PurchaseOrderStatus.RECEIVED) {
        throw new IllegalStateException("Cannot change RECEIVED order");
    }
    // ... more nested if-else
}
```

**Vấn đề:**
- Code dài, khó đọc
- Khó thêm state mới
- Dễ quên xử lý case nào đó
- Logic rải rác

### ✅ With State Pattern

```java
// Good: Logic tập trung, dễ mở rộng
public PurchaseOrder updateStatus(UUID id, PurchaseOrderStatus status) {
    PurchaseOrder order = findById(id);
    PurchaseOrderState currentState = PurchaseOrderStateFactory.getState(order.getStatus());
    
    PurchaseOrder updatedOrder = switch (status) {
        case ORDERED -> currentState.markOrdered(order, null);
        case RECEIVED -> currentState.markReceived(order);
        case CANCELLED -> currentState.cancel(order);
        default -> throw new IllegalArgumentException("Unknown status");
    };
    
    return save(updatedOrder);
}
```

**Lợi ích:**
- Code ngắn gọn, dễ đọc
- Logic tập trung trong state class
- Dễ thêm state mới
- Type-safe

## Kết luận

State Pattern trong hệ thống quản lý nhà thuốc:

1. ✅ **Quản lý lifecycle Purchase Order** một cách rõ ràng
2. ✅ **Enforce business rules** về transitions
3. ✅ **Tự động tạo inventory** khi nhận hàng
4. ✅ **Dễ mở rộng** khi cần thêm state mới
5. ✅ **Code dễ bảo trì** và test

Pattern này đảm bảo tính nhất quán và an toàn trong việc quản lý trạng thái đơn hàng, tránh các lỗi logic phức tạp khi sử dụng if-else truyền thống.


