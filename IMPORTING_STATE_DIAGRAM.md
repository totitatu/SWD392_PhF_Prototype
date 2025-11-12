# UML State Diagram: Importing (Add New Product from Purchase Order)

## Mô tả
State diagram này mô tả quy trình import/thêm sản phẩm mới vào kho từ Purchase Order trong hệ thống quản lý nhà thuốc.

## Các Trạng thái (States)

### 1. **DRAFT** (Nháp)
- **Mô tả**: Đơn hàng đang được soạn thảo
- **Hành động có thể thực hiện**:
  - Tạo purchase order mới
  - Thêm/sửa/xóa sản phẩm trong đơn hàng
  - Chọn supplier
  - Thiết lập ngày dự kiến nhận hàng (expected date)
  - Cập nhật số lượng và giá
- **Chuyển trạng thái**:
  - → **ORDERED**: Khi gửi đơn hàng đi
  - → **CANCELLED**: Khi hủy đơn hàng

### 2. **ORDERED** (Đã đặt hàng)
- **Mô tả**: Đơn hàng đã được gửi đến supplier
- **Hành động có thể thực hiện**:
  - Theo dõi trạng thái đơn hàng
  - Cập nhật ngày dự kiến nhận hàng
  - Không thể sửa/xóa items
  - Không thể xóa đơn hàng
- **Chuyển trạng thái**:
  - → **RECEIVED**: Khi nhận được hàng
  - → **CANCELLED**: Khi hủy đơn hàng (trước khi nhận)

### 3. **RECEIVED** (Đã nhận hàng)
- **Mô tả**: Hàng đã được nhận và thêm vào kho
- **Hành động tự động**:
  - Xác minh sản phẩm nhận được
  - Tạo inventory batches cho từng sản phẩm
  - Thiết lập batch number
  - Thiết lập expiry date
  - Cập nhật số lượng tồn kho
  - Sản phẩm có sẵn trong inventory để bán
- **Hành động không thể thực hiện**:
  - Không thể sửa đơn hàng
  - Không thể hủy đơn hàng
- **Chuyển trạng thái**:
  - → **[End]**: Quy trình hoàn tất

### 4. **CANCELLED** (Đã hủy)
- **Mô tả**: Đơn hàng đã bị hủy
- **Hành động**:
  - Không tạo inventory
  - Không thể kích hoạt lại
- **Chuyển trạng thái**:
  - → **[End]**: Quy trình kết thúc

## Các Transition (Chuyển trạng thái)

1. **Create Purchase Order**: `[*] → DRAFT`
   - Khởi tạo đơn hàng mới ở trạng thái DRAFT

2. **Add/Edit Items**: `DRAFT → DRAFT`
   - Thêm, sửa, xóa sản phẩm trong đơn hàng

3. **Send Order**: `DRAFT → ORDERED`
   - Gửi đơn hàng đến supplier
   - Điều kiện: Đơn hàng phải có ít nhất 1 item và supplier hợp lệ

4. **Cancel from Draft**: `DRAFT → CANCELLED`
   - Hủy đơn hàng khi còn ở trạng thái nháp

5. **Mark as Received**: `ORDERED → RECEIVED`
   - Đánh dấu đơn hàng đã nhận được hàng
   - Tự động tạo inventory batches

6. **Cancel from Ordered**: `ORDERED → CANCELLED`
   - Hủy đơn hàng sau khi đã gửi (trước khi nhận)

7. **Import Complete**: `RECEIVED → [*]`
   - Quy trình hoàn tất, sản phẩm đã có trong kho

8. **Order Terminated**: `CANCELLED → [*]`
   - Quy trình kết thúc, không có sản phẩm được thêm vào kho

## Business Rules

1. **DRAFT State**:
   - Có thể chỉnh sửa tự do
   - Có thể hủy bất cứ lúc nào
   - Phải có ít nhất 1 item trước khi chuyển sang ORDERED

2. **ORDERED State**:
   - Không thể chỉnh sửa items
   - Không thể xóa đơn hàng
   - Có thể hủy nếu chưa nhận hàng

3. **RECEIVED State**:
   - Trạng thái cuối cùng (final state)
   - Không thể thay đổi
   - Inventory batches được tạo tự động
   - Sản phẩm có sẵn để bán

4. **CANCELLED State**:
   - Trạng thái cuối cùng (final state)
   - Không thể kích hoạt lại
   - Không tạo inventory

## Use Cases Liên quan

- **UC27-UC34**: Purchase Order Management
- **UC35-UC42**: Inventory Management
- **UC37**: Thêm kho hàng từ đơn đặt hàng

## Implementation Notes

- Sử dụng **State Pattern** để quản lý các trạng thái
- `PurchaseOrderState` interface định nghĩa các hành động cho mỗi state
- `PurchaseOrderStateFactory` tạo state instances
- Khi chuyển sang RECEIVED, hệ thống tự động gọi `createInventoryFromOrder()`

