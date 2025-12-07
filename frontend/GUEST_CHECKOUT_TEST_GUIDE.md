# Guest Checkout Testing Guide

## 🎯 Quick Test - Demo Page

### Access Demo Page

```
http://localhost:5173/booking-demo
```

Trang demo này cho phép bạn test guest checkout flow hoàn chỉnh mà không cần:

- ❌ Tìm kiếm chuyến xe
- ❌ Database có trip thật
- ❌ Đăng nhập

### Demo Features

- ✅ Mock trip data (TP.HCM → Đà Lạt)
- ✅ Mock seat map (16 ghế, 3 ghế đã đặt)
- ✅ Select multiple seats
- ✅ Real-time price calculation
- ✅ Guest checkout form
- ✅ Booking confirmation

---

## 📝 Test Steps

### **Test 1: Guest Checkout (Không đăng nhập)**

1. **Truy cập demo page:**

   ```
   http://localhost:5173/booking-demo
   ```

2. **Chọn ghế:**
   - Click vào các ghế màu trắng (available)
   - Ghế màu xám là đã đặt (không click được)
   - Chọn ít nhất 1 ghế

3. **Click "Proceed to Booking"**

4. **Điền thông tin:**
   - ✅ Guest mode: ON (default)
   - ✅ Contact Email: `guest@example.com` HOẶC
   - ✅ Contact Phone: `+84987654321`
   - ✅ Passenger 1 - Full Name: `Nguyễn Văn A`
   - ⚠️ ID Number & Phone (optional)

5. **Click "Confirm Booking"**

6. **Kiểm tra confirmation page:**
   - Booking reference: `BK20241207XXXXXX`
   - Status: PENDING
   - Payment Status: PENDING
   - Contact info hiển thị đúng
   - Passenger details hiển thị đúng

### **Test 2: Logged-in User Guest Checkout**

1. **Đăng nhập trước:**

   ```
   http://localhost:5173/login
   Email: user@example.com
   Password: password123
   ```

2. **Vào demo page:**

   ```
   http://localhost:5173/booking-demo
   ```

3. **Chọn ghế và proceed**

4. **Toggle Guest Mode:**
   - Bật guest checkout ON
   - Notice: "No login required for this booking"

5. **Điền contact info (required khi guest mode):**
   - Email hoặc Phone

6. **Confirm booking**

7. **Verify:**
   - Booking tạo thành công
   - `userId` = `null` trong database
   - Không hiển thị trong user dashboard

---

## 🔍 Test Cases

### **✅ Valid Test Cases**

| Test Case        | Contact Email     | Contact Phone   | Expected Result |
| ---------------- | ----------------- | --------------- | --------------- |
| 1. Email only    | ✅ guest@test.com | ❌              | Success         |
| 2. Phone only    | ❌                | ✅ +84123456789 | Success         |
| 3. Both provided | ✅ guest@test.com | ✅ +84123456789 | Success         |

### **❌ Invalid Test Cases**

| Test Case               | Contact Email     | Contact Phone | Expected Error                                           |
| ----------------------- | ----------------- | ------------- | -------------------------------------------------------- |
| 4. Missing both         | ❌                | ❌            | "Please provide either an email address or phone number" |
| 5. Invalid email        | ✅ invalid-email  | ❌            | "Please provide a valid email address"                   |
| 6. Invalid phone        | ❌                | ✅ abc123     | "Please provide a valid phone number"                    |
| 7. Empty passenger name | ✅ guest@test.com | -             | "Please provide full name for passenger 1"               |

---

## 🔧 Backend Testing

### **Start Backend Services:**

```powershell
cd C:\Users\ADMIN\Documents\GitHub\bus-ticket-booking-system\backend
docker-compose up -d
```

### **Check Service Health:**

```powershell
# API Gateway
curl http://localhost:3000/health

# Booking Service
curl http://localhost:3004/health
```

### **Test API Directly:**

```powershell
# Create guest booking (PowerShell)
$body = @{
    tripId = "123e4567-e89b-12d3-a456-426614174000"
    passengers = @(
        @{
            fullName = "Nguyen Van A"
            seatNumber = "A1"
            price = 250000
        }
    )
    contactEmail = "guest@test.com"
    isGuestCheckout = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/bookings" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "bookingId": "uuid...",
    "bookingReference": "BK20241207ABC123",
    "userId": null,
    "contactEmail": "guest@test.com",
    "status": "pending",
    "paymentStatus": "pending",
    "totalPrice": 250000,
    "passengers": [...]
  },
  "message": "Booking created successfully"
}
```

---

## 🗄️ Database Verification

### **Connect to PostgreSQL:**

```powershell
docker exec -it bus-ticket-booking-system-postgres-1 psql -U admin -d bus_ticket_db
```

### **Check Guest Bookings:**

```sql
-- View all bookings
SELECT
    booking_reference,
    user_id,
    contact_email,
    contact_phone,
    status,
    payment_status,
    total_price,
    created_at
FROM bookings
ORDER BY created_at DESC
LIMIT 5;

-- Count guest bookings
SELECT COUNT(*) as guest_bookings
FROM bookings
WHERE user_id IS NULL;

-- View passengers for a booking
SELECT
    b.booking_reference,
    bp.full_name,
    bp.seat_code,
    bp.price
FROM bookings b
JOIN booking_passengers bp ON b.booking_id = bp.booking_id
WHERE b.booking_reference = 'BK20241207ABC123';
```

---

## 🔒 Redis Seat Locking Test

### **Connect to Redis:**

```powershell
docker exec -it bus-ticket-booking-system-redis-1 redis-cli
```

### **Check Locked Seats:**

```redis
# View all seat locks
KEYS seat_lock:*

# Check specific seat lock
GET seat_lock:123e4567-e89b-12d3-a456-426614174000:A1

# Check TTL (time to live)
TTL seat_lock:123e4567-e89b-12d3-a456-426614174000:A1
# Should show ~600 seconds (10 minutes)
```

### **Test Seat Conflict:**

1. Chọn ghế A1 và bắt đầu booking (không submit)
2. Trong 10 phút, thử chọn ghế A1 lại → Should show error
3. Sau 10 phút, seat lock tự động expire

---

## 🎨 UI Testing Checklist

### **Guest Checkout Toggle (Logged-in Users)**

- [ ] Toggle hiển thị khi user đã đăng nhập
- [ ] Toggle không hiển thị khi chưa đăng nhập
- [ ] Text thay đổi: "Booking as guest" / "Booking as user@email.com"
- [ ] Contact form hiện khi toggle ON
- [ ] Contact form ẩn khi toggle OFF

### **Contact Information Form**

- [ ] Email field có icon mail
- [ ] Phone field có icon phone
- [ ] Asterisk (\*) hiện khi field required
- [ ] Email validation: format check
- [ ] Phone validation: number format check
- [ ] Error message hiển thị rõ ràng

### **Passenger Information**

- [ ] Hiển thị đúng số lượng passengers = số ghế đã chọn
- [ ] Seat number hiển thị đúng cho mỗi passenger
- [ ] Price hiển thị đúng
- [ ] Full Name required
- [ ] ID Number optional
- [ ] Phone optional

### **Booking Summary**

- [ ] Selected seats hiển thị đúng
- [ ] Number of tickets đúng
- [ ] Price per ticket đúng
- [ ] Total amount tính đúng

### **Error Handling**

- [ ] Missing contact info → Clear error message
- [ ] Invalid email → "Please provide a valid email address"
- [ ] Empty passenger name → "Please provide full name for passenger X"
- [ ] Seat conflict (409) → "One or more seats are currently being booked"
- [ ] Network error → Generic error message

### **Confirmation Page**

- [ ] Booking reference hiển thị lớn, rõ ràng
- [ ] Status badges có màu đúng (pending = yellow)
- [ ] Contact info hiển thị đầy đủ
- [ ] Passenger list với seat assignments
- [ ] Total amount hiển thị đúng
- [ ] Timestamps formatted correctly
- [ ] "Back to Home" button works

---

## 🚨 Common Issues & Solutions

### **Issue 1: Booking Service Not Available**

```
Error: Booking service is currently unavailable (503)
```

**Solution:**

```powershell
# Check if booking service is running
docker ps | Select-String booking-service

# Restart if needed
cd backend
docker-compose restart booking-service

# Check logs
docker logs bus-ticket-booking-system-booking-service-1
```

### **Issue 2: Database Connection Error**

```
Error: Cannot connect to PostgreSQL
```

**Solution:**

```powershell
# Check PostgreSQL health
docker exec bus-ticket-booking-system-postgres-1 pg_isready

# Restart if needed
docker-compose restart postgres
```

### **Issue 3: Redis Connection Error**

```
Error: Redis client not connected
```

**Solution:**

```powershell
# Check Redis
docker exec bus-ticket-booking-system-redis-1 redis-cli ping
# Should return: PONG

# Restart if needed
docker-compose restart redis
```

### **Issue 4: Trip Not Found**

```
Error: Trip not found (404)
```

**Note:** Demo page sử dụng mock data, không cần trip thật trong database. Nếu test với API trực tiếp, cần tạo trip trước:

```sql
-- Insert mock trip (if needed)
INSERT INTO trips (trip_id, route_id, bus_id, departure_time, arrival_time, price, available_seats, status)
VALUES (
    '123e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174001',
    '123e4567-e89b-12d3-a456-426614174002',
    '2024-12-20 08:00:00',
    '2024-12-20 14:30:00',
    250000,
    25,
    'scheduled'
);
```

---

## 📊 Success Metrics

### **Test Passed If:**

✅ Guest user có thể book mà không cần đăng nhập  
✅ Contact validation hoạt động đúng (email OR phone)  
✅ Passenger validation hoạt động đúng  
✅ Seat locking ngăn chặn double booking  
✅ Booking reference được tạo unique  
✅ Database lưu đúng (user_id = NULL)  
✅ Confirmation page hiển thị đầy đủ thông tin  
✅ Logged-in user có thể chuyển sang guest mode  
✅ Error messages rõ ràng và helpful

---

## 🎉 Quick Start Command

```powershell
# Terminal 1: Start backend
cd backend
docker-compose up

# Terminal 2: Start frontend
cd frontend
npm run dev

# Browser: Open demo page
start http://localhost:5173/booking-demo
```

**That's it! Bắt đầu test ngay! 🚀**
