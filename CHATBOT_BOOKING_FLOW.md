# Chatbot Booking Flow - Complete Implementation Plan

## Overview
This document describes the complete conversational booking flow for the chatbot system, allowing users to search trips, select seats, provide passenger information, and complete payment through natural conversation.

## Flow Diagram

```
User Input → Trip Search → Trip Selection → Seat Display → Seat Selection → 
Passenger Info Collection → Payment Link Generation
```

## Detailed Flow Steps

### Step 1: Trip Search
**User Input:** "Tôi muốn đặt chuyến đi từ Hồ Chí Minh tới Đà Lạt vào ngày 15/01/2026"

**Chatbot Actions:**
- Extract entities: origin, destination, date
- Call Trip Service API to search trips
- Display results with action buttons

**Response Format:**
```json
{
  "text": "Tôi tìm thấy 5 chuyến khách từ Hồ Chí Minh đến Đà Lạt vào 15/01/2026. Chọn một chuyến để tiếp tục.",
  "actions": [
    {
      "type": "trip_selection",
      "trips": [
        {
          "trip_id": "uuid",
          "departure_time": "08:00",
          "arrival_time": "14:00",
          "price": 300000,
          "available_seats": 20,
          "operator_name": "Phương Trang",
          "bus_type": "Giường nằm"
        }
      ]
    }
  ],
  "suggestions": ["Xem thêm", "Đổi ngày", "Hủy"]
}
```

### Step 2: Trip Selection
**User Action:** Click on a specific trip or say "Chọn chuyến thứ 2"

**Chatbot Actions:**
- Save selected trip to session context
- Fetch seat layout for the selected trip
- Display seat map

**Response Format:**
```json
{
  "text": "Bạn đã chọn chuyến xe Phương Trang khởi hành lúc 08:00. Đây là sơ đồ ghế trống:",
  "actions": [
    {
      "type": "seat_map",
      "trip_id": "uuid",
      "seats": [
        {
          "seat_id": "uuid",
          "seat_number": "A1",
          "seat_type": "standard",
          "position": { "row": 1, "column": 1 },
          "is_available": true,
          "price": 300000
        }
      ],
      "layout": {
        "rows": 10,
        "columns": 4,
        "floors": 1
      }
    }
  ],
  "suggestions": ["Chọn ghế", "Quay lại", "Hủy"]
}
```

### Step 3: Seat Selection
**User Action:** Click on seats or say "Tôi muốn ghế A1, A2"

**Chatbot Actions:**
- Lock selected seats temporarily (5 minutes)
- Save seats to session context
- Ask for number of passengers or proceed to passenger info

**Response Format:**
```json
{
  "text": "Bạn đã chọn 2 ghế: A1, A2 (600,000 VNĐ). Vui lòng cung cấp thông tin hành khách cho từng ghế:",
  "actions": [
    {
      "type": "passenger_info_form",
      "seats": ["A1", "A2"],
      "required_fields": ["full_name", "phone", "email", "id_number"]
    }
  ],
  "context": {
    "seats_locked_until": "2026-01-15T08:05:00Z"
  }
}
```

### Step 4: Passenger Information Collection
**User Input:** Submits passenger form data

**Chatbot Actions:**
- After seat selection, automatically send passenger info form
- Generate one form section per selected seat
- Validate information (phone, email, ID format) on submit
- Save to session context

**Response Format (Auto-send after seat selection):**
```json
{
  "text": "Bạn đã chọn 2 ghế: A1, A2 (600,000 VNĐ). Vui lòng điền thông tin hành khách:",
  "actions": [
    {
      "type": "passenger_info_form",
      "seats": [
        {
          "seat_code": "A1",
          "price": 300000
        },
        {
          "seat_code": "A2", 
          "price": 300000
        }
      ],
      "required_fields": [
        {
          "name": "full_name",
          "type": "text",
          "label": "Họ và tên",
          "placeholder": "Nguyễn Văn A",
          "required": true,
          "validation": "min:2,max:100"
        },
        {
          "name": "phone",
          "type": "tel",
          "label": "Số điện thoại",
          "placeholder": "0909123456",
          "required": true,
          "validation": "phone:VN"
        },
        {
          "name": "email",
          "type": "email",
          "label": "Email",
          "placeholder": "example@email.com",
          "required": true,
          "validation": "email"
        },
        {
          "name": "id_number",
          "type": "text",
          "label": "CMND/CCCD",
          "placeholder": "001234567890",
          "required": false,
          "validation": "digits:9,12"
        }
      ]
    }
  ],
  "suggestions": ["Hủy đặt vé"]
}
```

**After Form Submission:**
```json
{
  "text": "Đã thu thập đầy đủ thông tin 2 hành khách. Tổng cộng: 600,000 VNĐ",
  "actions": [
    {
      "type": "booking_summary",
      "trip_details": {
        "route": "Hồ Chí Minh → Đà Lạt",
        "date": "15/01/2026",
        "time": "08:00"
      },
      "seats": ["A1", "A2"],
      "passengers": [
        {
          "seat": "A1",
          "full_name": "Nguyễn Văn A",
          "phone": "0909123456",
          "email": "nguyenvana@gmail.com"
        },
        {
          "seat": "A2",
          "full_name": "Trần Thị B",
          "phone": "0909123457",
          "email": "tranthib@gmail.com"
        }
      ],
      "total_price": 600000
    }
  ],
  "suggestions": ["Xác nhận và thanh toán", "Sửa thông tin", "Hủy"]
}
```

### Step 5: Payment Link Generation
**User Action:** Confirms booking details

**Chatbot Actions:**
- Create booking in database (status: pending)
- Generate unique booking reference
- Create payment link with pre-filled information
- Send link to user

**Response Format:**
```json
{
  "text": "Booking của bạn đã được tạo với mã BK20260115001. Click vào link bên dưới để hoàn tất thanh toán:",
  "actions": [
    {
      "type": "payment_link",
      "booking_id": "uuid",
      "booking_reference": "BK20260115001",
      "url": "http://localhost:5173/payment/confirm?booking=BK20260115001&token=temp_token",
      "expires_at": "2026-01-15T08:10:00Z"
    }
  ],
  "context": {
    "booking_created": true,
    "payment_pending": true
  }
}
```

## Implementation Checklist

### Backend Changes Needed

#### 1. Chatbot Service Updates
- [x] Fix trip search response parsing (handle different formats)
- [ ] Add `select_trip` intent handler
- [ ] Add `select_seats` intent handler
- [ ] Add `provide_passenger_info` intent handler
- [ ] Implement seat locking mechanism (5-minute temporary lock)
- [ ] Add passenger info validation
- [ ] Create booking with pending status
- [ ] Generate payment link with pre-filled data

#### 2. New API Endpoints
```javascript
// Get seat layout for a trip
GET /trips/:tripId/seats
Response: {
  seats: Array<Seat>,
  layout: { rows, columns, floors }
}

// Lock seats temporarily
POST /trips/:tripId/seats/lock
Body: { seat_ids: string[], session_id: string }
Response: { locked_until: timestamp }

// Create booking from chatbot
POST /bookings/chatbot
Body: {
  trip_id, 
  seats: [{ seat_id, passenger_info }],
  contact_email,
  contact_phone
}
Response: { booking_id, booking_reference, payment_url }
```

#### 3. Database Schema Updates
```sql
-- Add session context for seat locks
CREATE TABLE seat_locks (
  lock_id UUID PRIMARY KEY,
  trip_id UUID REFERENCES trips(trip_id),
  seat_id UUID REFERENCES seats(seat_id),
  session_id VARCHAR(255),
  locked_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  UNIQUE(seat_id, trip_id)
);

-- Add chatbot booking tracking
ALTER TABLE bookings 
ADD COLUMN chatbot_session_id VARCHAR(255),
ADD COLUMN created_via VARCHAR(50) DEFAULT 'web';
```

### Frontend Changes Needed

#### 1. Chatbot Component Updates
```tsx
// Add new action renderers
<ChatbotInterface>
  <TripSelectionCard trips={action.trips} onSelect={selectTrip} />
  <SeatMapDisplay seats={action.seats} layout={action.layout} onSelect={selectSeats} />
  <PassengerInfoForm seats={selectedSeats} onSubmit={submitPassengerInfo} />
  <BookingSummary booking={action.booking_summary} onConfirm={proceedToPayment} />
  <PaymentLinkCard url={action.payment_link.url} reference={action.booking_reference} />
</ChatbotInterface>
```

#### 2. Payment Page Enhancement
- Add query parameter support for pre-filled booking data
- Auto-load booking details from reference code
- Display countdown timer for payment expiration
- Support temporary token authentication for guest bookings

## State Management

### Session Context Structure
```json
{
  "session_id": "session_uuid",
  "user_id": "user_uuid",
  "conversation_state": "awaiting_passenger_info",
  "booking_context": {
    "selected_trip": {
      "trip_id": "uuid",
      "departure_time": "08:00",
      "price": 300000
    },
    "selected_seats": ["seat_id_1", "seat_id_2"],
    "seat_locks": {
      "expires_at": "2026-01-15T08:05:00Z"
    },
    "passengers": [
      {
        "seat_id": "seat_id_1",
        "full_name": "Nguyễn Văn A",
        "phone": "0909123456",
        "email": "nguyenvana@gmail.com",
        "id_number": "001234567890"
      }
    ],
    "pending_booking_id": "uuid",
    "payment_url": "http://..."
  }
}
```

## Error Handling

### Timeout Scenarios
1. **Seat Lock Expiration:** If user doesn't complete booking within 5 minutes
   - Release seat locks
   - Notify user: "Ghế đã được giải phóng do hết thời gian. Vui lòng chọn lại."

2. **Payment Timeout:** If user doesn't complete payment within 15 minutes
   - Cancel booking
   - Notify user: "Booking đã bị hủy do quá thời gian thanh toán."

### Validation Errors
- Invalid phone format
- Invalid email format
- Missing required passenger information
- Seats no longer available

## Testing Scenarios

1. **Happy Path:** Complete flow from search to payment
2. **Seat Unavailable:** Selected seat becomes unavailable during booking
3. **Timeout:** User takes too long to provide information
4. **Multiple Passengers:** Booking with 3+ passengers
5. **Guest User:** Non-logged-in user completing booking
6. **Logged-in User:** Pre-fill known user information

## Future Enhancements

1. Voice input support for passenger information
2. OCR for ID card scanning
3. Multi-language support (English, Vietnamese)
4. Payment integration within chat (QR code display)
5. Booking modification through chat
6. Real-time seat availability updates
7. Group booking support
8. Promotional code application

## API Integration Points

### Trip Service
- `GET /search` - Search trips
- `GET /:tripId` - Get trip details
- `GET /:tripId/seats` - Get seat layout and availability

### Booking Service  
- `POST /bookings` - Create booking
- `POST /bookings/:id/lock-seats` - Lock seats temporarily
- `GET /bookings/:reference` - Get booking by reference

### Payment Service
- `POST /payment/create-session` - Create payment session
- `GET /payment/methods` - Get available payment methods

---

**Status:** Document created - Ready for implementation
**Last Updated:** December 30, 2025
