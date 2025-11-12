# Use Case Coverage Report

Tài liệu này liệt kê tất cả các Use Cases (UC) và trạng thái triển khai của chúng.

## ✅ UC5-UC11: Quản lý Tài khoản (User Management)

| UC | Mô tả | Endpoint | Status |
|----|-------|----------|--------|
| UC5 | Liệt kê tài khoản | `GET /api/users` | ✅ |
| UC6 | Tìm kiếm tài khoản | `GET /api/users?searchTerm=...` | ✅ |
| UC7 | Lọc tài khoản | `GET /api/users?role=...&active=...` | ✅ |
| UC8 | Thêm tài khoản | `POST /api/users` | ✅ |
| UC9 | Xem tài khoản | `GET /api/users/{id}` | ✅ |
| UC10 | Chỉnh sửa tài khoản | `PUT /api/users/{id}` | ✅ |
| UC11 | Hủy kích hoạt tài khoản | `DELETE /api/users/{id}/deactivate` | ✅ |

**Controller:** `PharmacyUserController`  
**Service:** `PharmacyUserService` (interface) → `PharmacyUserServiceImpl`

---

## ✅ UC12-UC18: Quản lý Nhà cung cấp (Supplier Management)

| UC | Mô tả | Endpoint | Status |
|----|-------|----------|--------|
| UC12 | Liệt kê nhà cung cấp | `GET /api/suppliers` | ✅ |
| UC13 | Tìm kiếm nhà cung cấp | `GET /api/suppliers?searchTerm=...` | ✅ |
| UC14 | Lọc nhà cung cấp | `GET /api/suppliers?active=...` | ✅ |
| UC15 | Thêm nhà cung cấp | `POST /api/suppliers` | ✅ |
| UC16 | Xem nhà cung cấp | `GET /api/suppliers/{id}` | ✅ |
| UC17 | Chỉnh sửa nhà cung cấp | `PUT /api/suppliers/{id}` | ✅ |
| UC18 | Hủy kích hoạt nhà cung cấp | `DELETE /api/suppliers/{id}/deactivate` | ✅ |

**Controller:** `SupplierController`  
**Service:** `SupplierService` (interface) → `SupplierServiceImpl`

---

## ✅ UC19-UC26: Quản lý Sản phẩm (Product Management)

| UC | Mô tả | Endpoint | Status |
|----|-------|----------|--------|
| UC19 | Liệt kê sản phẩm | `GET /api/products` | ✅ |
| UC20 | Tìm kiếm sản phẩm | `GET /api/products?searchTerm=...` | ✅ |
| UC21 | Lọc sản phẩm | `GET /api/products?category=...&active=...` | ✅ |
| UC22 | Thêm sản phẩm | `POST /api/products` | ✅ |
| UC23 | Xem sản phẩm | `GET /api/products/{id}` | ✅ |
| UC24 | Chỉnh sửa sản phẩm | `PUT /api/products/{id}` | ✅ |
| UC25 | Chỉnh sửa sản phẩm với Gemini | `POST /api/products/{id}/edit-with-gemini` | ✅ (Placeholder) |
| UC26 | Hủy kích hoạt sản phẩm | `DELETE /api/products/{id}/deactivate` | ✅ |

**Controller:** `ProductController`  
**Service:** `ProductService` (interface) → `ProductServiceImpl`  
**Gemini Service:** `GeminiService` (interface) → `GeminiServiceImpl` (placeholder)

---

## ✅ UC27-UC34: Quản lý Đơn đặt hàng (Purchase Order Management)

| UC | Mô tả | Endpoint | Status |
|----|-------|----------|--------|
| UC27 | Liệt kê đơn đặt hàng | `GET /api/purchase-orders` | ✅ |
| UC28 | Lọc đơn đặt hàng | `GET /api/purchase-orders?status=...&supplierId=...&startDate=...&endDate=...` | ✅ |
| UC29 | Thêm đơn đặt hàng nháp | `POST /api/purchase-orders` | ✅ |
| UC30 | Thêm đơn đặt hàng nháp với Gemini | `POST /api/purchase-orders/create-with-gemini` | ✅ (Placeholder) |
| UC31 | Xem đơn đặt hàng | `GET /api/purchase-orders/{id}` | ✅ |
| UC32 | Chỉnh sửa đơn đặt hàng nháp | `PUT /api/purchase-orders/{id}` | ✅ |
| UC33 | Xóa đơn đặt hàng nháp | `DELETE /api/purchase-orders/{id}` | ✅ |
| UC34 | Gửi đơn đặt hàng | `POST /api/purchase-orders/{id}/send` | ✅ |

**Controller:** `PurchaseOrderController`  
**Service:** `PurchaseOrderService` (interface) → `PurchaseOrderServiceImpl`

---

## ✅ UC35-UC42: Quản lý Kho hàng (Inventory Management)

| UC | Mô tả | Endpoint | Status |
|----|-------|----------|--------|
| UC35 | Liệt kê kho hàng | `GET /api/inventory` | ✅ |
| UC36 | Lọc kho hàng | `GET /api/inventory?productId=...&active=...` | ✅ |
| UC37 | Thêm kho hàng (từ đơn đặt hàng) | `POST /api/inventory/from-purchase-order/{purchaseOrderId}` | ✅ (Placeholder) |
| UC38 | Xem kho hàng | `GET /api/inventory/{id}` | ✅ |
| UC39 | Chỉnh sửa kho hàng | `PUT /api/inventory/{id}` | ✅ |
| UC40 | Hủy kích hoạt kho hàng | `DELETE /api/inventory/{id}/deactivate` | ✅ |
| UC41 | Gửi cảnh báo hết hàng | `GET /api/inventory/alerts/low-stock?productId=...&threshold=...` | ✅ |
| UC42 | Gửi cảnh báo sắp hết hạn | `GET /api/inventory/alerts/near-expiry?days=...` | ✅ |

**Controller:** `InventoryController`  
**Service:** `InventoryBatchService` (interface) → `InventoryBatchServiceImpl`

---

## ✅ UC43-UC48: Point of Sale (POS) & Bán hàng

| UC | Mô tả | Endpoint | Status |
|----|-------|----------|--------|
| UC43 | Xem điểm bán hàng (POS) | Frontend component | ✅ |
| UC44 | Tìm kiếm sản phẩm (POS) | `GET /api/pos/products/search?term=...` | ✅ |
| UC45 | Quét mã vạch | `GET /api/pos/products/barcode/{barcode}` | ✅ |
| UC46 | Tạo hóa đơn | `POST /api/sales` | ✅ |
| UC47 | Liệt kê hóa đơn | `GET /api/sales` | ✅ |
| UC48 | Xem hóa đơn | `GET /api/sales/{id}` | ✅ |

**Controllers:** 
- `POSController` (UC43-UC45)
- `SaleTransactionController` (UC46-UC48)

**Services:** 
- `ProductService` (for POS search)
- `SaleTransactionService` (interface) → `SaleTransactionServiceImpl`

---

## ✅ UC49-UC51: Đăng ký (Registration)

| UC | Mô tả | Endpoint | Status |
|----|-------|----------|--------|
| UC49 | Đăng ký | `POST /api/auth/register` | ✅ |
| UC50 | Đăng ký | `POST /api/auth/register` | ✅ (Same as UC49) |
| UC51 | Đăng ký | `POST /api/auth/register` | ✅ (Same as UC49) |

**Controller:** `RegistrationController`  
**Service:** `PharmacyUserService`

---

## ✅ UC52-UC53: Nhật ký Hệ thống (System Logs)

| UC | Mô tả | Endpoint | Status |
|----|-------|----------|--------|
| UC52 | Liệt kê nhật ký | `GET /api/system-logs` | ✅ |
| UC53 | Xem nhật ký | `GET /api/system-logs/{id}` | ✅ |

**Controller:** `SystemLogController`  
**Service:** `SystemLogService` (interface) → `SystemLogServiceImpl`

---

## 📋 Tổng kết

- **Tổng số UC:** 49
- **Đã triển khai đầy đủ:** 47
- **Placeholder (cần tích hợp Gemini):** 2 (UC25, UC30)
- **Placeholder (cần implement logic):** 1 (UC37)

### Các tính năng đặc biệt:

1. **Gemini AI Integration (UC25, UC30):**
   - Interface và implementation đã được tạo
   - Cần cấu hình API key và tích hợp Google AI SDK
   - File: `GeminiService`, `GeminiServiceImpl`

2. **Inventory từ Purchase Order (UC37):**
   - Endpoint đã được tạo
   - Cần implement logic để tạo inventory batches từ purchase order đã nhận

3. **Barcode Scanning (UC45):**
   - Endpoint đã được tạo
   - Frontend component đã có sẵn (BarcodeScanner.jsx/tsx)

---

## 🏗️ Kiến trúc

Tất cả services đã được refactor theo SOLID principles:
- **Interfaces** trong package `service`
- **Implementations** trong package `service.impl`
- **Controllers** phụ thuộc vào interfaces (Dependency Inversion)

---

## 📝 Ghi chú

- Tất cả endpoints đều có validation thông qua DTOs
- Filter và search operations đều được hỗ trợ
- Deactivate operations thay vì hard delete (soft delete pattern)
- Transaction management được áp dụng cho tất cả services











