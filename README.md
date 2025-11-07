# PharmaFlow - Pharmacy Management System

PharmaFlow là hệ thống quản lý nhà thuốc toàn diện, giúp quản lý sản phẩm, tồn kho, nhà cung cấp, đơn hàng, bán hàng và báo cáo một cách hiệu quả.

## 📋 Mục lục

- [Tổng quan](#tổng-quan)
- [Tính năng](#tính-năng)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Cấu trúc project](#cấu-trúc-project)
- [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
- [Cài đặt và chạy](#cài-đặt-và-chạy)
- [Cấu hình](#cấu-hình)
- [Docker](#docker)
- [API Documentation](#api-documentation)

## 🎯 Tổng quan

PharmaFlow là một hệ thống quản lý nhà thuốc hiện đại được xây dựng với kiến trúc microservices, bao gồm:

- **Front-end**: React application với giao diện người dùng hiện đại
- **Back-end**: Spring Boot REST API với JPA và PostgreSQL
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth với hỗ trợ OAuth2

## ✨ Tính năng

### 🔐 Xác thực và Phân quyền
- Đăng nhập/Đăng ký với email và password
- Đăng nhập bằng Google (OAuth2)
- Phân quyền theo vai trò: Owner, Admin, Staff

### 📦 Quản lý Sản phẩm
- Thêm, sửa, xóa sản phẩm
- Quản lý thông tin sản phẩm: SKU, tên, hoạt chất, liều lượng, danh mục
- Thiết lập mức tồn kho tối thiểu
- Theo dõi trạng thái hoạt động của sản phẩm

### 📊 Quản lý Tồn kho
- Quản lý lô hàng (batch) với số lô, số lượng, giá nhập, giá bán
- Theo dõi ngày nhập và ngày hết hạn
- Điều chỉnh tồn kho
- Cảnh báo tồn kho thấp và sắp hết hạn

### 🏢 Quản lý Nhà cung cấp
- Quản lý thông tin nhà cung cấp
- Liên kết sản phẩm với nhà cung cấp
- Ghi chú và thông tin liên hệ

### 🛒 Quản lý Đơn hàng
- Tạo và quản lý đơn đặt hàng từ nhà cung cấp
- Theo dõi trạng thái đơn hàng
- Quản lý chi tiết đơn hàng

### 💰 Point of Sale (POS)
- Hệ thống bán hàng tại quầy
- Quét mã vạch sản phẩm
- Tính toán tổng tiền tự động
- Lịch sử giao dịch bán hàng

### 📈 Báo cáo
- Báo cáo doanh thu
- Báo cáo tồn kho
- Báo cáo sản phẩm bán chạy
- Xuất báo cáo

### 👥 Quản lý Người dùng
- Quản lý tài khoản nhân viên
- Phân quyền theo vai trò
- Kích hoạt/Vô hiệu hóa tài khoản

## 🛠 Công nghệ sử dụng

### Back-end
- **Framework**: Spring Boot 3.5.7
- **Language**: Java 17
- **Build Tool**: Maven
- **Database**: PostgreSQL
- **ORM**: Spring Data JPA / Hibernate
- **Migration**: Flyway
- **Security**: Spring Security + OAuth2
- **Lombok**: Giảm boilerplate code

### Front-end
- **Framework**: React 18.3.1
- **Build Tool**: Vite 7.1.7
- **UI Library**: Radix UI
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Forms**: React Hook Form
- **Charts**: Recharts
- **Authentication**: Supabase Auth
- **State Management**: React Hooks

### Database & Infrastructure
- **Database**: PostgreSQL (Supabase)
- **Authentication Service**: Supabase Auth
- **Containerization**: Docker
- **Web Server**: Nginx (production)

## 📁 Cấu trúc project

```
project/
├── phf-back-end/              # Spring Boot Backend
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/
│   │   │   │   └── com/example/phfbackend/
│   │   │   │       ├── controller/      # REST Controllers
│   │   │   │       ├── entities/        # JPA Entities
│   │   │   │       │   ├── inventory/  # Inventory entities
│   │   │   │       │   ├── product/     # Product entities
│   │   │   │       │   ├── purchase/    # Purchase order entities
│   │   │   │       │   ├── sale/        # Sale transaction entities
│   │   │   │       │   ├── supplier/    # Supplier entities
│   │   │   │       │   └── user/        # User entities
│   │   │   │       ├── repository/      # JPA Repositories
│   │   │   │       ├── service/         # Business Logic
│   │   │   │       └── dto/             # Data Transfer Objects
│   │   │   └── resources/
│   │   │       ├── application.yml      # Configuration
│   │   │       └── db/migration/         # Flyway migrations
│   │   └── test/                        # Unit tests
│   ├── pom.xml                          # Maven dependencies
│   ├── Dockerfile                       # Docker configuration
│   └── .dockerignore
│
├── phf-front-end/            # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/         # Authentication components
│   │   │   ├── inventory/    # Inventory management
│   │   │   ├── layout/      # Layout components
│   │   │   ├── orders/      # Purchase orders
│   │   │   ├── pos/         # Point of Sale
│   │   │   ├── reports/     # Reports
│   │   │   ├── settings/    # Settings
│   │   │   ├── suppliers/   # Supplier management
│   │   │   └── ui/          # UI components
│   │   ├── utils/           # Utility functions
│   │   ├── styles/          # Global styles
│   │   └── App.jsx          # Main app component
│   ├── package.json
│   ├── vite.config.js
│   ├── Dockerfile
│   └── .dockerignore
│
└── README.md                 # This file
```

## 💻 Yêu cầu hệ thống

### Back-end
- **Java**: JDK 17 hoặc cao hơn
- **Maven**: 3.6+ (hoặc sử dụng Maven Wrapper)
- **Database**: PostgreSQL 12+ (hoặc Supabase)
- **Memory**: Tối thiểu 2GB RAM

### Front-end
- **Node.js**: 18.x hoặc cao hơn
- **npm**: 9.x hoặc cao hơn
- **Memory**: Tối thiểu 1GB RAM

### Docker (Optional)
- **Docker**: 20.10+
- **Docker Compose**: 2.0+ (nếu sử dụng)

## 🚀 Cài đặt và chạy

### 1. Clone repository

```bash
git clone <repository-url>
cd project
```

### 2. Cấu hình Back-end

#### 2.1. Cấu hình Database

Chỉnh sửa file `phf-back-end/src/main/resources/application.yml`:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://your-db-host:5432/your-database
    username: your-username
    password: your-password
```

#### 2.2. Chạy Back-end

**Cách 1: Sử dụng Maven Wrapper (Khuyến nghị)**

```bash
cd phf-back-end
./mvnw spring-boot:run
# Hoặc trên Windows:
mvnw.cmd spring-boot:run
```

**Cách 2: Sử dụng Maven**

```bash
cd phf-back-end
mvn spring-boot:run
```

**Cách 3: Build và chạy JAR**

```bash
cd phf-back-end
mvn clean package
java -jar target/phf-back-end-0.0.1-SNAPSHOT.jar
```

Back-end sẽ chạy tại: `http://localhost:8080`

### 3. Cấu hình Front-end

#### 3.1. Cấu hình Supabase

Chỉnh sửa file `phf-front-end/src/utils/supabase/info.jsx`:

```javascript
export const projectId = 'your-supabase-project-id';
export const publicAnonKey = 'your-supabase-anon-key';
```

#### 3.2. Cài đặt dependencies

```bash
cd phf-front-end
npm install
```

#### 3.3. Chạy Front-end

```bash
npm run dev
```

Front-end sẽ chạy tại: `http://localhost:3000`

### 4. Truy cập ứng dụng

Mở trình duyệt và truy cập: `http://localhost:3000`

## ⚙️ Cấu hình

### Back-end Configuration

File cấu hình chính: `phf-back-end/src/main/resources/application.yml`

**Các cấu hình quan trọng:**

- **Database Connection**: Cấu hình kết nối PostgreSQL
- **JPA Settings**: Cấu hình Hibernate và JPA
- **Flyway**: Cấu hình database migration
- **Security**: Cấu hình Spring Security và OAuth2

### Front-end Configuration

**Supabase Configuration**: `phf-front-end/src/utils/supabase/info.jsx`

**Vite Configuration**: `phf-front-end/vite.config.js`

### Environment Variables

Tạo file `.env` trong thư mục `phf-front-end` (nếu cần):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 🐳 Docker

### Build Docker Images

**Build Back-end:**

```bash
cd phf-back-end
docker build -t phf-backend:latest .
```

**Build Front-end:**

```bash
cd phf-front-end
docker build -t phf-frontend:latest .
```

### Chạy với Docker

**Back-end:**

```bash
docker run -d \
  -p 8080:8080 \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://host:5432/db \
  -e SPRING_DATASOURCE_USERNAME=user \
  -e SPRING_DATASOURCE_PASSWORD=pass \
  phf-backend:latest
```

**Front-end:**

```bash
docker run -d -p 80:80 phf-frontend:latest
```

### Docker Compose (Optional)

Tạo file `docker-compose.yml` ở root để chạy cả hai services:

```yaml
version: '3.8'

services:
  backend:
    build: ./phf-back-end
    ports:
      - "8080:8080"
    environment:
      - SPRING_DATASOURCE_URL=jdbc:postgresql://db-host:5432/db
      - SPRING_DATASOURCE_USERNAME=user
      - SPRING_DATASOURCE_PASSWORD=pass
    depends_on:
      - db

  frontend:
    build: ./phf-front-end
    ports:
      - "80:80"
    depends_on:
      - backend
```

Chạy:

```bash
docker-compose up -d
```

## 📚 API Documentation

### Endpoints chính

#### Products
- `GET /api/products` - Lấy danh sách sản phẩm
- `POST /api/products` - Tạo sản phẩm mới
- `GET /api/products/{id}` - Lấy thông tin sản phẩm
- `PUT /api/products/{id}` - Cập nhật sản phẩm
- `DELETE /api/products/{id}` - Xóa sản phẩm

#### Inventory
- `GET /api/inventory` - Lấy danh sách tồn kho
- `POST /api/inventory` - Thêm lô hàng mới
- `PUT /api/inventory/{id}` - Cập nhật tồn kho

#### Suppliers
- `GET /api/suppliers` - Lấy danh sách nhà cung cấp
- `POST /api/suppliers` - Tạo nhà cung cấp mới

#### Purchase Orders
- `GET /api/purchase-orders` - Lấy danh sách đơn hàng
- `POST /api/purchase-orders` - Tạo đơn hàng mới

#### Sales
- `GET /api/sales` - Lấy lịch sử bán hàng
- `POST /api/sales` - Tạo giao dịch bán hàng

#### Users
- `GET /api/users` - Lấy danh sách người dùng
- `POST /api/users` - Tạo người dùng mới

## 🗄️ Database Schema

Database sử dụng PostgreSQL với các bảng chính:

- `products` - Sản phẩm
- `inventory_batches` - Lô hàng tồn kho
- `suppliers` - Nhà cung cấp
- `purchase_orders` - Đơn đặt hàng
- `purchase_order_lines` - Chi tiết đơn hàng
- `sale_transactions` - Giao dịch bán hàng
- `sale_transaction_lines` - Chi tiết giao dịch bán hàng
- `pharmacy_users` - Người dùng hệ thống
- `inventory_adjustments` - Điều chỉnh tồn kho

Database migrations được quản lý bởi Flyway trong thư mục `phf-back-end/src/main/resources/db/migration/`.

## 🔒 Security

- **Authentication**: Supabase Auth với JWT tokens
- **Authorization**: Role-based access control (RBAC)
- **Password**: Bcrypt hashing
- **HTTPS**: Khuyến nghị sử dụng HTTPS trong production
- **CORS**: Cấu hình CORS cho front-end

## 🧪 Testing

### Back-end Tests

```bash
cd phf-back-end
mvn test
```

### Front-end Tests

```bash
cd phf-front-end
npm test
```

## 📝 Scripts hữu ích

### Back-end

```bash
# Build project
mvn clean package

# Chạy với profile cụ thể
mvn spring-boot:run -Dspring-boot.run.profiles=dev

# Chạy tests
mvn test

# Kiểm tra dependencies
mvn dependency:tree
```

### Front-end

```bash
# Development server
npm run dev

# Build production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 🐛 Troubleshooting

### Back-end không kết nối được database

1. Kiểm tra thông tin kết nối trong `application.yml`
2. Đảm bảo database đang chạy
3. Kiểm tra firewall và network settings

### Front-end không kết nối được Supabase

1. Kiểm tra `projectId` và `publicAnonKey` trong `info.jsx`
2. Đảm bảo Supabase project đang hoạt động
3. Kiểm tra CORS settings trong Supabase

### Docker build fails

1. Kiểm tra Dockerfile syntax
2. Đảm bảo có đủ disk space
3. Kiểm tra network connection để download dependencies

## 📄 License

[Thêm thông tin license nếu có]

## 👥 Contributors

[Thêm danh sách contributors nếu có]

## 📞 Support

Nếu gặp vấn đề, vui lòng tạo issue trên repository hoặc liên hệ team phát triển.

---

**PharmaFlow** - Quản lý nhà thuốc thông minh, hiện đại và hiệu quả.



