# Kiến trúc Hệ thống PharmaFlow

## 📋 Mục lục

- [Tổng quan](#-tổng-quan)
- [Kiến trúc Client-Server](#-kiến-trúc-client-server)
- [Các thành phần chính](#-các-thành-phần-chính)
- [Luồng giao tiếp](#-luồng-giao-tiếp)
- [Kiến trúc Backend](#-kiến-trúc-backend)
- [Kiến trúc Frontend](#-kiến-trúc-frontend)
- [Database Schema](#-database-schema)
- [Bảo mật](#-bảo-mật)
- [Deployment](#-deployment)

---

## 🎯 Tổng quan

**PharmaFlow** là một hệ thống quản lý nhà thuốc được xây dựng theo **kiến trúc Client-Server** (hay còn gọi là kiến trúc 2-tier hoặc 3-tier). Đây là một kiến trúc phân tầng hiện đại, trong đó:

- **Client (Frontend)**: Ứng dụng web React chạy trên trình duyệt người dùng
- **Server (Backend)**: Ứng dụng Spring Boot REST API xử lý logic nghiệp vụ
- **Database**: PostgreSQL lưu trữ dữ liệu

### Đặc điểm của kiến trúc Client-Server

✅ **Tách biệt trách nhiệm**: Frontend và Backend hoàn toàn độc lập  
✅ **Khả năng mở rộng**: Có thể scale từng thành phần riêng biệt  
✅ **Bảo trì dễ dàng**: Thay đổi một phần không ảnh hưởng đến phần khác  
✅ **Đa nền tảng**: Frontend có thể chạy trên nhiều thiết bị khác nhau  
✅ **Tái sử dụng API**: Backend API có thể được sử dụng bởi nhiều client khác nhau

---

## 🏗 Kiến trúc Client-Server

### Sơ đồ tổng quan

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         React Frontend Application                   │   │
│  │  - User Interface (UI Components)                    │   │
│  │  - State Management (React Hooks)                    │   │
│  │  - API Service Layer                                 │   │
│  │  - Authentication (Supabase Auth)                    │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                   │
│                          │ HTTP/REST API                     │
│                          │ (JSON)                            │
│                          ▼                                   │
└─────────────────────────────────────────────────────────────┘
                          │
                          │
┌─────────────────────────────────────────────────────────────┐
│                        SERVER LAYER                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Spring Boot REST API                         │   │
│  │  ┌──────────────────────────────────────────────┐    │   │
│  │  │  Controllers (REST Endpoints)                 │    │   │
│  │  │  - /api/products                              │    │   │
│  │  │  - /api/inventory                             │    │   │
│  │  │  - /api/suppliers                             │    │   │
│  │  │  - /api/purchase-orders                       │    │   │
│  │  │  - /api/sales                                 │    │   │
│  │  │  - /api/users                                 │    │   │
│  │  │  - /api/gemini/chat                           │    │   │
│  │  └──────────────────────────────────────────────┘    │   │
│  │  ┌──────────────────────────────────────────────┐    │   │
│  │  │  Service Layer (Business Logic)                │    │   │
│  │  │  - ProductService                             │    │   │
│  │  │  - InventoryService                           │    │   │
│  │  │  - SupplierService                            │    │   │
│  │  │  - PurchaseOrderService                       │    │   │
│  │  │  - SaleTransactionService                     │    │   │
│  │  │  - GeminiService                              │    │   │
│  │  └──────────────────────────────────────────────┘    │   │
│  │  ┌──────────────────────────────────────────────┐    │   │
│  │  │  Repository Layer (Data Access)               │    │   │
│  │  │  - JPA Repositories                           │    │   │
│  │  │  - Spring Data JPA                            │    │   │
│  │  └──────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                   │
│                          │ JDBC                              │
│                          │                                   │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         PostgreSQL Database                          │   │
│  │  - Schema: phf                                       │   │
│  │  - Tables: products, inventory_batches, suppliers,   │   │
│  │           purchase_orders, sales, users, etc.        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Mô hình 3-Tier Architecture

Dự án này sử dụng mô hình **3-Tier Architecture**:

1. **Presentation Tier (Tầng trình bày)**
   - React Frontend Application
   - Chạy trên trình duyệt người dùng
   - Xử lý giao diện người dùng và tương tác

2. **Application Tier (Tầng ứng dụng)**
   - Spring Boot REST API
   - Xử lý logic nghiệp vụ
   - Xác thực và phân quyền
   - Tích hợp với các service bên ngoài (Gemini AI)

3. **Data Tier (Tầng dữ liệu)**
   - PostgreSQL Database
   - Lưu trữ dữ liệu persistent
   - Quản lý bởi Flyway migrations

---

## 🔧 Các thành phần chính

### 1. Frontend (Client) - `phf-front-end/`

**Công nghệ:**
- **Framework**: React 18.3.1
- **Build Tool**: Vite 7.1.7
- **UI Library**: Radix UI + Tailwind CSS
- **State Management**: React Hooks
- **HTTP Client**: Fetch API

**Cấu trúc:**
```
phf-front-end/
├── src/
│   ├── components/          # React components
│   │   ├── auth/           # Authentication components
│   │   ├── inventory/      # Inventory management
│   │   ├── pos/            # Point of Sale
│   │   ├── orders/         # Purchase orders
│   │   ├── reports/        # Reports
│   │   └── ui/             # Reusable UI components
│   ├── services/
│   │   └── api.js          # API service layer
│   ├── utils/              # Utility functions
│   └── App.jsx             # Main application component
```

**Chức năng:**
- Hiển thị giao diện người dùng
- Xử lý tương tác người dùng
- Gửi HTTP requests đến Backend API
- Quản lý state của ứng dụng
- Xác thực người dùng qua Supabase Auth

### 2. Backend (Server) - `phf-back-end/`

**Công nghệ:**
- **Framework**: Spring Boot 3.5.7
- **Language**: Java 17
- **ORM**: Spring Data JPA / Hibernate
- **Database Migration**: Flyway
- **Build Tool**: Maven

**Cấu trúc:**
```
phf-back-end/
├── src/main/java/com/example/phfbackend/
│   ├── controller/         # REST Controllers
│   │   ├── ProductController.java
│   │   ├── InventoryController.java
│   │   ├── SupplierController.java
│   │   ├── PurchaseOrderController.java
│   │   ├── SaleTransactionController.java
│   │   ├── PharmacyUserController.java
│   │   ├── POSController.java
│   │   ├── SystemLogController.java
│   │   ├── GeminiChatController.java
│   │   └── RegistrationController.java
│   ├── service/            # Business Logic Layer
│   │   ├── impl/           # Service implementations
│   │   └── *.java          # Service interfaces
│   ├── repository/         # Data Access Layer
│   │   └── *.java          # JPA Repositories
│   ├── entities/           # JPA Entities
│   │   ├── product/
│   │   ├── inventory/
│   │   ├── supplier/
│   │   ├── purchase/
│   │   ├── sale/
│   │   └── user/
│   ├── dto/                # Data Transfer Objects
│   │   ├── request/        # Request DTOs
│   │   └── response/       # Response DTOs
│   └── config/             # Configuration classes
│       ├── CorsConfig.java
│       └── SecurityConfig.java
└── src/main/resources/
    ├── application.yml     # Application configuration
    └── db/migration/       # Flyway migrations
```

**Chức năng:**
- Xử lý HTTP requests từ Frontend
- Thực thi logic nghiệp vụ
- Truy cập và quản lý dữ liệu trong database
- Xác thực và phân quyền
- Tích hợp với Gemini AI

### 3. Database - PostgreSQL

**Cấu hình:**
- **Database**: PostgreSQL (Supabase)
- **Schema**: `phf`
- **Migration Tool**: Flyway

**Các bảng chính:**
- `products` - Thông tin sản phẩm
- `inventory_batches` - Lô hàng tồn kho
- `suppliers` - Nhà cung cấp
- `purchase_orders` - Đơn đặt hàng
- `purchase_order_lines` - Chi tiết đơn hàng
- `sale_transactions` - Giao dịch bán hàng
- `sale_transaction_lines` - Chi tiết giao dịch bán hàng
- `pharmacy_users` - Người dùng hệ thống
- `inventory_adjustments` - Điều chỉnh tồn kho
- `system_logs` - Nhật ký hệ thống

---

## 🔄 Luồng giao tiếp

### Luồng xử lý request điển hình

```
1. User Action (Frontend)
   │
   ├─► User clicks button/fills form
   │
   ▼
2. Frontend API Call
   │
   ├─► Component calls service/api.js
   │   Example: productAPI.create(productData)
   │
   ▼
3. HTTP Request
   │
   ├─► Fetch API sends POST request
   │   URL: http://localhost:8080/api/products
   │   Method: POST
   │   Headers: { 'Content-Type': 'application/json' }
   │   Body: JSON data
   │
   ▼
4. Backend Controller
   │
   ├─► ProductController.createProduct()
   │   @PostMapping("/api/products")
   │   Validates request data
   │
   ▼
5. Service Layer
   │
   ├─► ProductService.create()
   │   Business logic validation
   │   Data transformation
   │
   ▼
6. Repository Layer
   │
   ├─► ProductRepository.save()
   │   JPA/Hibernate operations
   │
   ▼
7. Database
   │
   ├─► INSERT INTO products ...
   │   Transaction committed
   │
   ▼
8. Response Flow (ngược lại)
   │
   ├─► Database returns saved entity
   │   Repository returns entity
   │   Service returns DTO
   │   Controller returns ResponseEntity
   │
   ▼
9. Frontend receives response
   │
   ├─► JSON response parsed
   │   Component state updated
   │   UI re-rendered
```

### Ví dụ cụ thể: Tạo sản phẩm mới

**Frontend (`InventoryManager.jsx`):**
```javascript
const handleCreateProduct = async (productData) => {
  try {
    const response = await productAPI.create(productData);
    // Update UI with new product
    setProducts([...products, response]);
  } catch (error) {
    // Handle error
    console.error('Failed to create product:', error);
  }
};
```

**API Service (`services/api.js`):**
```javascript
export const productAPI = {
  create: (data) => apiCall('/products', { 
    method: 'POST', 
    body: JSON.stringify(data) 
  }),
};
```

**Backend Controller (`ProductController.java`):**
```java
@PostMapping
public ResponseEntity<ProductResponse> createProduct(
    @Valid @RequestBody ProductRequest request) {
    Product product = productService.create(request);
    return ResponseEntity.ok(toResponse(product));
}
```

**Backend Service (`ProductService.java`):**
```java
public Product create(ProductRequest request) {
    // Business logic validation
    Product product = toEntity(request);
    return productRepository.save(product);
}
```

---

## 🏛 Kiến trúc Backend

### Layered Architecture Pattern

Backend sử dụng **Layered Architecture Pattern** với các tầng:

#### 1. Controller Layer (Presentation Layer)
- **Trách nhiệm**: Nhận HTTP requests, validate input, trả về HTTP responses
- **Annotations**: `@RestController`, `@RequestMapping`, `@GetMapping`, `@PostMapping`, etc.
- **Ví dụ**: `ProductController`, `InventoryController`

#### 2. Service Layer (Business Logic Layer)
- **Trách nhiệm**: Xử lý logic nghiệp vụ, validation, transformation
- **Pattern**: Interface + Implementation
- **Ví dụ**: `ProductService`, `InventoryService`

#### 3. Repository Layer (Data Access Layer)
- **Trách nhiệm**: Truy cập database, CRUD operations
- **Technology**: Spring Data JPA
- **Ví dụ**: `ProductRepository`, `InventoryRepository`

#### 4. Entity Layer (Domain Model)
- **Trách nhiệm**: Đại diện cho các bảng trong database
- **Technology**: JPA Entities
- **Ví dụ**: `Product`, `InventoryBatch`, `Supplier`

### Dependency Flow

```
Controller → Service → Repository → Database
    ↓          ↓          ↓
   DTO      Entity    Entity
```

**Quy tắc:**
- Controller chỉ gọi Service, không gọi Repository trực tiếp
- Service gọi Repository để truy cập database
- Controller sử dụng DTOs để giao tiếp với client
- Service làm việc với Entities

---

## 🎨 Kiến trúc Frontend

### Component-Based Architecture

Frontend sử dụng **Component-Based Architecture** với React:

#### 1. Component Hierarchy
```
App.jsx (Root Component)
├── Sidebar.jsx (Layout)
├── Dashboard.jsx
├── InventoryManager.jsx
│   ├── ProductForm (Dialog)
│   ├── ProductTable
│   └── ProductFilters
├── POSSystem.jsx
├── SupplierManager.jsx
└── ...
```

#### 2. Service Layer Pattern
- **File**: `src/services/api.js`
- **Chức năng**: Tập trung tất cả API calls
- **Lợi ích**: Dễ bảo trì, tái sử dụng, dễ test

#### 3. State Management
- **Local State**: `useState` hook cho component state
- **No Global State**: Không sử dụng Redux/Context API (có thể thêm sau)
- **Data Fetching**: `useEffect` + API calls

### Data Flow

```
User Action
    ↓
Component Event Handler
    ↓
API Service Call (api.js)
    ↓
HTTP Request to Backend
    ↓
Response received
    ↓
Update Component State
    ↓
UI Re-render
```

---

## 🗄 Database Schema

### Entity Relationships

```
pharmacy_users (1) ──┐
                     │
suppliers (1) ───────┼──► purchase_orders (N)
                     │         │
products (1) ────────┼─────────┼──► purchase_order_lines (N)
                     │         │
                     │         │
inventory_batches (N)──┘         │
                              │
                              ▼
                    sale_transactions (N)
                              │
                              ▼
                    sale_transaction_lines (N)
```

### Key Relationships

1. **Product ↔ InventoryBatch**: One-to-Many
   - Một sản phẩm có nhiều lô hàng

2. **Supplier ↔ PurchaseOrder**: One-to-Many
   - Một nhà cung cấp có nhiều đơn hàng

3. **PurchaseOrder ↔ PurchaseOrderLine**: One-to-Many
   - Một đơn hàng có nhiều dòng sản phẩm

4. **SaleTransaction ↔ SaleTransactionLine**: One-to-Many
   - Một giao dịch bán hàng có nhiều dòng sản phẩm

---

## 🔒 Bảo mật

### Authentication & Authorization

1. **Frontend Authentication**
   - **Provider**: Supabase Auth
   - **Methods**: Email/Password, OAuth2 (Google)
   - **Token Storage**: Browser session

2. **Backend Security**
   - **Framework**: Spring Security
   - **CORS**: Configured for frontend origins
   - **CSRF**: Disabled (API-only, stateless)
   - **Password Encoding**: BCrypt

### CORS Configuration

Backend cho phép requests từ:
- `http://localhost:3000`
- `http://localhost:5173` (Vite dev server)
- `http://localhost:5174`
- `http://127.0.0.1:5173`
- `http://127.0.0.1:5174`

### API Security

- **Content-Type**: `application/json`
- **Methods**: GET, POST, PUT, DELETE, OPTIONS, PATCH
- **Credentials**: Allowed (for future JWT implementation)

---

## 🚀 Deployment

### Development Environment

```
Frontend: http://localhost:3000 (hoặc 5173 với Vite)
Backend:  http://localhost:8080
Database: PostgreSQL (Supabase)
```

### Production Deployment

#### Option 1: Docker Containers

```yaml
# docker-compose.yml
services:
  backend:
    image: phf-backend:latest
    ports:
      - "8080:8080"
    environment:
      - SPRING_DATASOURCE_URL=...
  
  frontend:
    image: phf-frontend:latest
    ports:
      - "80:80"
    depends_on:
      - backend
```

#### Option 2: Separate Servers

- **Frontend**: Deploy lên static hosting (Vercel, Netlify, Nginx)
- **Backend**: Deploy lên cloud server (AWS, Azure, GCP)
- **Database**: Managed PostgreSQL (Supabase, AWS RDS)

### Environment Variables

**Backend (`application.yml`):**
```yaml
spring:
  datasource:
    url: ${SPRING_DATASOURCE_URL}
    username: ${SPRING_DATASOURCE_USERNAME}
    password: ${SPRING_DATASOURCE_PASSWORD}
```

**Frontend (`.env`):**
```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## 📊 Tóm tắt

### Kiến trúc Client-Server: Có

✅ **Dự án này SỬ DỤNG kiến trúc Client-Server**

**Đặc điểm:**
- Frontend (Client) và Backend (Server) tách biệt hoàn toàn
- Giao tiếp qua HTTP/REST API
- Backend xử lý logic nghiệp vụ và database
- Frontend xử lý giao diện và tương tác người dùng
- Có thể scale và deploy độc lập

**Lợi ích:**
- Dễ bảo trì và phát triển
- Có thể sử dụng API cho nhiều client khác nhau (web, mobile, desktop)
- Tách biệt concerns rõ ràng
- Phù hợp cho team phát triển lớn

**So sánh với các kiến trúc khác:**
- ❌ **Monolithic**: Không phải (Frontend và Backend tách biệt)
- ❌ **Microservices**: Không phải (Backend là một service duy nhất)
- ✅ **Client-Server**: Đúng (Frontend là client, Backend là server)
- ✅ **3-Tier**: Đúng (Presentation, Application, Data tiers)

---

## 📚 Tài liệu tham khảo

- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [React Documentation](https://react.dev/)
- [REST API Best Practices](https://restfulapi.net/)
- [Client-Server Architecture](https://en.wikipedia.org/wiki/Client%E2%80%93server_model)

---

**Tài liệu này mô tả kiến trúc của dự án PharmaFlow tại thời điểm hiện tại. Kiến trúc có thể thay đổi khi dự án phát triển.**

