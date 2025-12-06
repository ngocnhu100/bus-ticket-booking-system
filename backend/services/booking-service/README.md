# Booking Service

Microservice quản lý đặt vé xe khách, hỗ trợ **Guest Checkout** (đặt vé không cần đăng nhập) và **Authenticated Booking** (đặt vé với tài khoản).

## 🎯 Tính năng chính

- ✅ **Guest Checkout**: Đặt vé mà không cần đăng nhập
- ✅ **Redis Seat Locking**: Khóa ghế trong 10 phút khi đang đặt
- ✅ **Booking Reference**: Tự động tạo mã đặt vé (VD: BK202512071234)
- ✅ **Optional JWT Authentication**: Hỗ trợ cả guest và user đã đăng nhập
- ✅ **Real-time Seat Availability**: Kiểm tra ghế có sẵn từ database
- ✅ **Validation**: Kiểm tra email và số điện thoại bắt buộc cho guest

## 📋 Yêu cầu hệ thống

- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (optional)

## 🚀 Cài đặt

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Cấu hình môi trường

Tạo file `.env`:

```env
PORT=3004
NODE_ENV=development

# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=bus_ticket_db
DB_USER=admin
DB_PASSWORD=admin123

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# JWT Secret (để verify token từ auth-service)
JWT_SECRET=your-secret-key-here
```

### 3. Chạy service

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

**Docker:**
```bash
docker-compose up -d
```

## 📡 API Endpoints

### 1. Tạo đặt vé (Guest hoặc Authenticated)

**Endpoint:** `POST /bookings`

**Headers (Optional):**
```
Authorization: Bearer <JWT_TOKEN>
```

**Request Body:**

```json
{
  "tripId": "TRIP_TEST_001",
  "isGuestCheckout": true,
  "contactEmail": "guest@example.com",
  "contactPhone": "+84901234567",
  "passengers": [
    {
      "fullName": "Nguyen Van A",
      "documentType": "CITIZEN_ID",
      "documentId": "001234567890",
      "phone": "+84901234567",
      "seatNumber": "A1"
    }
  ],
  "paymentMethod": "cash",
  "totalPrice": 250000
}
```

**Response (Success):**

```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "bookingId": "123e4567-e89b-12d3-a456-426614174000",
    "bookingReference": "BK202512071234",
    "tripId": "TRIP_TEST_001",
    "userId": null,
    "contactEmail": "guest@example.com",
    "contactPhone": "+84901234567",
    "totalPrice": 250000,
    "status": "pending",
    "passengers": [
      {
        "passengerId": "123e4567-e89b-12d3-a456-426614174001",
        "fullName": "Nguyen Van A",
        "seatNumber": "A1",
        "documentType": "CITIZEN_ID",
        "documentId": "001234567890"
      }
    ],
    "createdAt": "2025-12-07T10:30:00Z"
  }
}
```

**Validation Rules:**

✅ **Guest Checkout** (`isGuestCheckout: true`):
- `contactEmail`: **BẮT BUỘC** - Email hợp lệ
- `contactPhone`: **BẮT BUỘC** - Số điện thoại hợp lệ

✅ **Authenticated Booking** (có JWT token):
- `contactEmail`: Optional (lấy từ user profile)
- `contactPhone`: Optional

✅ **Passengers:**
- Tối thiểu 1 hành khách
- `fullName`: Bắt buộc
- `seatNumber`: Bắt buộc và phải available

### 2. Tra cứu đặt vé

**Endpoint:** `GET /bookings/:bookingReference`

**Query Parameters (Optional):**
```
contactEmail=guest@example.com
contactPhone=+84901234567
```

**Response:**

```json
{
  "success": true,
  "data": {
    "bookingId": "123e4567-e89b-12d3-a456-426614174000",
    "bookingReference": "BK202512071234",
    "status": "confirmed",
    "tripId": "TRIP_TEST_001",
    "totalPrice": 250000,
    "passengers": [...]
  }
}
```

### 3. Lấy trạng thái ghế của chuyến xe

**Endpoint:** `GET /trips/:tripId/seats`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "seat_id": "uuid",
      "seat_code": "A1",
      "status": "available"
    },
    {
      "seat_id": "uuid",
      "seat_code": "A2",
      "status": "booked"
    }
  ]
}
```

**Seat Status:**
- `available`: Ghế trống, có thể đặt
- `booked`: Đã được đặt
- `locked`: Đang bị khóa (đang trong quá trình đặt)

## 🧪 Demo Guest Checkout

### Bước 1: Khởi động services

```bash
# Backend
cd backend
docker-compose up -d

# Frontend
cd frontend
npm run dev
```

### Bước 2: Truy cập demo page

Mở trình duyệt: `http://localhost:5173/booking-demo`

### Bước 3: Test guest checkout

1. **Chọn ghế** trên sơ đồ ghế ngồi (layout 2-2)
   - Ghế trống: màu trắng, click để chọn
   - Ghế đã chọn: màu xanh
   - Ghế đã đặt: màu xám, không click được

2. **Điền thông tin**
   - Email: Bắt buộc (VD: `guest@test.com`)
   - Số điện thoại: Bắt buộc (VD: `0901234567`)
   - Toggle "Book as Guest" = ON

3. **Nhập thông tin hành khách**
   - Họ tên đầy đủ
   - Số CMND/Passport (optional)
   - Số điện thoại (optional)

4. **Xác nhận đặt vé**
   - Click "Confirm Booking"
   - Nhận mã đặt vé (VD: `BK202512071234`)
   - Redirect đến trang xác nhận

### Test bằng cURL

```bash
# Guest Checkout
curl -X POST http://localhost:3000/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "tripId": "TRIP_TEST_001",
    "isGuestCheckout": true,
    "contactEmail": "guest@test.com",
    "contactPhone": "0901234567",
    "passengers": [
      {
        "fullName": "Nguyen Van A",
        "documentType": "CITIZEN_ID",
        "documentId": "001234567890",
        "phone": "0901234567",
        "seatNumber": "A1"
      }
    ],
    "paymentMethod": "cash",
    "totalPrice": 250000
  }'

# Tra cứu đặt vé
curl "http://localhost:3000/bookings/BK202512071234?contactEmail=guest@test.com"
```

## 🔒 Redis Seat Locking

Service sử dụng Redis để khóa ghế ngồi trong 10 phút:

```javascript
// Khóa ghế khi bắt đầu đặt vé
await redis.setex(`seat_lock:${tripId}:${seatNumber}`, 600, bookingId)

// Kiểm tra ghế có bị khóa không
const locked = await redis.get(`seat_lock:${tripId}:${seatNumber}`)

// Xóa lock sau khi hoàn tất
await redis.del(`seat_lock:${tripId}:${seatNumber}`)
```

**Time-to-Live (TTL):** 10 phút (600 giây)

## 🗄️ Database Schema

### Bảng `bookings`

```sql
CREATE TABLE bookings (
  booking_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_reference VARCHAR(20) UNIQUE NOT NULL,
  trip_id VARCHAR(50) NOT NULL,
  user_id UUID,  -- NULL cho guest checkout
  contact_email VARCHAR(255),  -- Bắt buộc cho guest
  contact_phone VARCHAR(20),   -- Bắt buộc cho guest
  total_price DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Bảng `booking_passengers`

```sql
CREATE TABLE booking_passengers (
  passenger_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(booking_id),
  full_name VARCHAR(255) NOT NULL,
  document_type VARCHAR(50),
  document_id VARCHAR(100),
  phone VARCHAR(20),
  seat_number VARCHAR(10) NOT NULL,
  price DECIMAL(10,2) NOT NULL
);
```

## 🏗️ Kiến trúc

```
booking-service/
├── src/
│   ├── index.js              # Express app & routes
│   ├── bookingController.js  # Request handlers
│   ├── bookingService.js     # Business logic
│   ├── bookingRepository.js  # Database operations
│   ├── validators.js         # Joi validation schemas
│   ├── middleware.js         # optionalAuthenticate, authenticate
│   ├── database.js           # PostgreSQL connection
│   └── redis.js              # Redis client
├── Dockerfile
├── package.json
└── README.md
```

## 🔐 Authentication Flow

### Guest Checkout (No JWT)
```
Client → API Gateway → Booking Service (optionalAuthenticate)
                                    ↓
                            user = null, isGuest = true
                                    ↓
                        Validation: email + phone required
                                    ↓
                        Create booking with user_id = NULL
```

### Authenticated Booking (With JWT)
```
Client + JWT → API Gateway → Booking Service (optionalAuthenticate)
                                         ↓
                                 Verify JWT → user object
                                         ↓
                         Use user.email from token
                                         ↓
                  Create booking with user_id = user.userId
```

## 🐛 Troubleshooting

### Lỗi: "Both contactEmail and contactPhone are required"

**Nguyên nhân:** Guest checkout cần cả email và phone

**Giải pháp:**
```json
{
  "isGuestCheckout": true,
  "contactEmail": "guest@test.com",     // ✅ Bắt buộc
  "contactPhone": "+84901234567"        // ✅ Bắt buộc
}
```

### Lỗi: "Seat A1 is not available"

**Nguyên nhân:** Ghế đã được đặt hoặc đang bị khóa

**Giải pháp:**
1. Check Redis: `redis-cli GET seat_lock:TRIP_TEST_001:A1`
2. Check DB: `SELECT * FROM seats WHERE seat_code = 'A1' AND trip_id = 'TRIP_TEST_001'`
3. Chọn ghế khác

### Lỗi: Cannot connect to PostgreSQL/Redis

**Giải pháp:**
```bash
# Kiểm tra containers đang chạy
docker ps

# Restart services
docker-compose restart postgres redis
```

## 📝 Logs

```bash
# Docker logs
docker logs bus-ticket-booking-service -f

# Local logs
npm run dev  # Console logs hiển thị trực tiếp
```

## 🧪 Testing

```bash
# Unit tests (coming soon)
npm test

# Integration tests
npm run test:integration

# Manual testing với test scripts
node test-booking.js
```

## 🚢 Deployment

### Docker Production

```bash
docker build -t booking-service:latest .
docker run -d \
  -p 3004:3004 \
  --env-file .env.production \
  --name booking-service \
  booking-service:latest
```

### Environment Variables (Production)

```env
NODE_ENV=production
PORT=3004
DB_HOST=production-db.example.com
REDIS_HOST=production-redis.example.com
JWT_SECRET=strong-production-secret
```

## 📚 Tài liệu liên quan

- [Guest Checkout Test Guide](../../../frontend/GUEST_CHECKOUT_TEST_GUIDE.md)
- [Guest Checkout Implementation](../../../GUEST_CHECKOUT_IMPLEMENTATION.md)
- [API Gateway Configuration](../../api-gateway/README.md)
- [Database Schema](../../sql/README.md)

## 👥 Contributors

Developed for Bus Ticket Booking System

## 📄 License

Private - Internal use only
