# Gemini AI Integration Guide

## Tổng quan

Hệ thống đã được tích hợp với Google Gemini API để hỗ trợ các tính năng AI cho UC25 và UC30.

## Cấu hình

API key đã được cấu hình trong `application.yml`:
```yaml
gemini:
  api:
    key: AIzaSyCzl2XuDH2CfUlqK11kbHBL9MELvakZXPU
  enabled: true
  model: gemini-pro
```

## Endpoints

### 1. Chat chung với Gemini
```
POST /api/gemini/chat
Body: { "userInput": "Câu hỏi của bạn" }
Response: { "suggestion": "...", "success": true }
```

### 2. Chỉnh sửa sản phẩm với Gemini (UC25)
```
POST /api/products/{id}/edit-with-gemini
Body: { "userInput": "Mô tả thay đổi" }
Response: { "suggestion": "...", "success": true }
```

### 3. Tạo đơn đặt hàng với Gemini (UC30)
```
POST /api/purchase-orders/create-with-gemini
Body: { "userInput": "Mô tả đơn hàng" }
Response: { "suggestion": "...", "success": true }
```

### 4. Chat về sản phẩm cụ thể
```
POST /api/gemini/chat/product/{productId}
Body: { "userInput": "Câu hỏi về sản phẩm" }
Response: { "suggestion": "...", "success": true }
```

## Frontend - Icon Chat

Component `GeminiChat` đã được thêm vào `App.jsx`:
- Icon chat xuất hiện ở góc dưới bên phải màn hình
- Click vào icon để mở cửa sổ chat
- Có thể minimize/maximize và đóng cửa sổ chat
- Tự động scroll đến tin nhắn mới nhất

## Sử dụng

1. **Trong Product Management:**
   - Vào trang quản lý sản phẩm
   - Chọn sản phẩm cần chỉnh sửa
   - Click "Edit with Gemini"
   - Nhập yêu cầu chỉnh sửa
   - Nhận gợi ý từ AI

2. **Trong Purchase Order:**
   - Vào trang quản lý đơn đặt hàng
   - Click "Create with Gemini"
   - Mô tả đơn hàng bạn muốn tạo
   - Nhận gợi ý đơn hàng từ AI

3. **Chat chung:**
   - Click icon chat ở góc dưới bên phải
   - Đặt câu hỏi về bất kỳ chủ đề nào liên quan đến quản lý nhà thuốc
   - Nhận phản hồi từ AI

## Lưu ý

- API key đã được cấu hình sẵn trong `application.yml`
- Service sử dụng WebClient (reactive) để gọi Gemini API
- Tất cả responses được xử lý và trả về dưới dạng JSON
- Error handling đã được implement đầy đủ



