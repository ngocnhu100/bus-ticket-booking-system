# Admin Booking Management API

## Overview
Admin endpoints for managing all bookings in the system. Requires authentication with admin role.

**Base URL:** `http://localhost:3004`  
**Authentication:** Bearer Token (Admin JWT)

---

## 🔐 Authentication
All admin endpoints require:
```
Authorization: Bearer <ADMIN_JWT_TOKEN>
```

---

## 📋 API Endpoints

### 1. Get All Bookings (with Filters)
**GET** `/admin/bookings` or via API Gateway: `GET /bookings/admin`

#### Query Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | integer | No | 1 | Page number |
| limit | integer | No | 20 | Results per page |
| status | string | No | - | Filter by status: `pending`, `confirmed`, `cancelled`, `completed` |
| payment_status | string | No | - | Filter by payment status: `unpaid`, `paid`, `refunded` |
| fromDate | ISO8601 | No | - | Filter bookings created after this date |
| toDate | ISO8601 | No | - | Filter bookings created before this date |
| sortBy | string | No | created_at | Sort column: `created_at`, `updated_at`, `total_price`, `status`, `payment_status` |
| sortOrder | string | No | DESC | Sort order: `ASC` or `DESC` |

#### Example Request
```bash
# Direct to service (port 3004)
curl -X GET "http://localhost:3004/admin?page=1&limit=10&status=confirmed" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# Via API Gateway (port 3000)
curl -X GET "http://localhost:3000/bookings/admin?page=1&limit=10&status=confirmed" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

#### Success Response (200)
```json
{
  "success": true,
  "data": [
    {
      "booking_id": "uuid",
      "booking_reference": "BK20251226123",
      "trip_id": "uuid",
      "user_id": "uuid",
      "contact_email": "user@example.com",
      "contact_phone": "+84901234567",
      "status": "confirmed",
      "payment_status": "paid",
      "total_price": 320000,
      "currency": "VND",
      "created_at": "2025-12-26T10:00:00.000Z",
      "updated_at": "2025-12-26T10:05:00.000Z",
      "user": {
        "email": "user@example.com",
        "name": "John Doe"
      },
      "passengerCount": 2
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15
  },
  "timestamp": "2025-12-26T11:00:00.000Z"
}
```

---

### 2. Get Booking Details
**GET** `/admin/bookings/:id` or via API Gateway: `GET /bookings/admin/:id`

#### Path Parameters
- `id` (string, required) - Booking UUID

#### Example Request
```bash
# Direct to service
curl -X GET "http://localhost:3004/admin/<booking_id>" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# Via API Gateway
curl -X GET "http://localhost:3000/bookings/admin/<booking_id>" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "booking_id": "uuid",
    "booking_reference": "BK20251226123",
    "trip_id": "uuid",
    "user_id": "uuid",
    "contact_email": "user@example.com",
    "contact_phone": "+84901234567",
    "status": "confirmed",
    "payment_status": "paid",
    "total_price": 320000,
    "subtotal": 300000,
    "service_fee": 20000,
    "currency": "VND",
    "created_at": "2025-12-26T10:00:00.000Z",
    "updated_at": "2025-12-26T10:05:00.000Z",
    "passengers": [
      {
        "passenger_id": "uuid",
        "full_name": "John Doe",
        "phone": "+84901234567",
        "id_number": "123456789",
        "seat_code": "A1"
      },
      {
        "passenger_id": "uuid",
        "full_name": "Jane Smith",
        "phone": "+84901234568",
        "id_number": "987654321",
        "seat_code": "A2"
      }
    ],
    "trip": {
      "trip_id": "uuid",
      "route": {
        "origin": "Ho Chi Minh City",
        "destination": "Da Lat"
      },
      "schedule": {
        "departureTime": "2025-12-27T08:00:00.000Z",
        "arrivalTime": "2025-12-27T14:00:00.000Z"
      },
      "pricing": {
        "basePrice": 150000
      }
    }
  },
  "timestamp": "2025-12-26T11:00:00.000Z"
}
```

#### Error Response (404)
```json
{
  "success": false,
  "error": {
    "code": "BOOK_002",
    "message": "Booking not found"
  },
  "timestamp": "2025-12-26T11:00:00.000Z"
}
```

---

### 3. Update Booking Status
**PUT** `/admin/bookings/:id/status` or via API Gateway: `PUT /bookings/admin/:id/status`

#### Path Parameters
- `id` (string, required) - Booking UUID

#### Request Body
```json
{
  "status": "confirmed"
}
```

**Valid statuses:** `confirmed`, `cancelled`, `completed`

**Note:** When updating status to `confirmed`, the booking will be confirmed and tickets will be generated and sent to the customer via email, but the payment_status remains unchanged (typically 'unpaid' for manual confirmations).

#### Example Request
```bash
# Direct to service
curl -X PUT "http://localhost:3004/admin/<booking_id>/status" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"status": "confirmed"}'

# Via API Gateway
curl -X PUT "http://localhost:3000/bookings/admin/<booking_id>/status" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"status": "confirmed"}'
```

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "booking_id": "uuid",
    "booking_reference": "BK20251226123",
    "status": "confirmed",
    "updated_at": "2025-12-26T11:10:00.000Z"
  },
  "message": "Booking status updated to confirmed",
  "timestamp": "2025-12-26T11:10:00.000Z"
}
```

#### Error Response (422)
```json
{
  "success": false,
  "error": {
    "code": "VAL_001",
    "message": "Invalid status. Must be one of: confirmed, cancelled, completed"
  },
  "timestamp": "2025-12-26T11:00:00.000Z"
}
```

#### Error Response (409)
```json
{
  "success": false,
  "error": {
    "code": "BOOK_006",
    "message": "Cannot update status of completed booking"
  },
  "timestamp": "2025-12-26T11:00:00.000Z"
}
```

---

### 4. Process Refund
**POST** `/admin/bookings/:id/refund` or via API Gateway: `POST /bookings/admin/:id/refund`

#### Path Parameters
- `id` (string, required) - Booking UUID

#### Request Body
```json
{
  "refundAmount": 240000,
  "reason": "Customer complaint - service not provided"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| refundAmount | number | Yes | Amount to refund (must be > 0) |
| reason | string | No | Reason for refund (default: "Admin-initiated refund") |

**Notes:**
- Booking must have `payment_status = 'paid'`
- Booking status can be `confirmed` or `cancelled` (admin can refund already cancelled bookings)
- Cannot refund a booking that already has a refund amount

#### Example Request
```bash
# Direct to service
curl -X POST "http://localhost:3004/admin/<booking_id>/refund" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"refundAmount": 240000, "reason": "Customer complaint"}'

# Via API Gateway
curl -X POST "http://localhost:3000/bookings/admin/<booking_id>/refund" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"refundAmount": 240000, "reason": "Customer complaint"}'
```

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "booking": {
      "booking_id": "uuid",
      "booking_reference": "BK20251226123",
      "status": "cancelled",
      "refund_amount": 240000,
      "cancellation_reason": "Customer complaint - service not provided",
      "updated_at": "2025-12-26T11:15:00.000Z"
    },
    "refund": {
      "amount": 240000,
      "reason": "Customer complaint - service not provided",
      "processedAt": "2025-12-26T11:15:00.000Z",
      "status": "pending"
    }
  },
  "message": "Refund processed successfully",
  "timestamp": "2025-12-26T11:15:00.000Z"
}
```

#### Error Response (422)
```json
{
  "success": false,
  "error": {
    "code": "VAL_001",
    "message": "Invalid refund amount"
  },
  "timestamp": "2025-12-26T11:00:00.000Z"
}
```

#### Error Response (409)
```json
{
  "success": false,
  "error": {
    "code": "BOOK_007",
    "message": "Booking has already been refunded"
  },
  "timestamp": "2025-12-26T11:00:00.000Z"
}
```

#### Error Response (400) - Unpaid Booking
```json
{
  "success": false,
  "error": {
    "code": "SYS_001",
    "message": "Failed to process refund"
  },
  "timestamp": "2025-12-26T11:00:00.000Z"
}
```
*Note: Check that booking has `payment_status = 'paid'` in database*

---

## 🔍 Filter Examples

### Filter by Status
```bash
GET /bookings/admin?status=confirmed&page=1&limit=20
```

### Filter by Payment Status
```bash
GET /bookings/admin?payment_status=paid&page=1&limit=20
```

### Filter by Date Range
```bash
GET /bookings/admin?fromDate=2025-12-01T00:00:00.000Z&toDate=2025-12-31T23:59:59.999Z
```

### Combined Filters
```bash
GET /bookings/admin?status=confirmed&payment_status=paid&fromDate=2025-12-01&toDate=2025-12-31&sortBy=total_price&sortOrder=DESC
```

### Sort by Total Price
```bash
GET /bookings/admin?sortBy=total_price&sortOrder=DESC&limit=10
```

---

## 📊 Business Logic

### Status Update Rules
- Cannot update status of `completed` bookings
- Valid transitions:
  - `pending` → `confirmed` ✅ (triggers ticket generation and email confirmation, payment_status unchanged)
  - `pending` → `cancelled` ✅
  - `confirmed` → `completed` ✅
  - `confirmed` → `cancelled` ✅

### Payment Status Values
- `unpaid`: Payment not yet processed (default for new bookings)
- `paid`: Payment successfully completed (either by customer or admin confirmation)
- `refunded`: Refund has been processed

**Note:** Admin manual confirmation sets status to 'confirmed' but keeps payment_status as 'unpaid' unless actual payment was processed.

### Refund Processing
1. **Validation**
   - Booking must exist
   - Payment status must be `paid` (checks both `payment_status` and `paymentStatus` fields)
   - Cannot refund already refunded bookings (refund_amount > 0)
   - Booking can be `confirmed` or `cancelled` status

2. **Processing**
   - Updates booking status to `cancelled` (if not already)
   - Records refund amount and reason
   - Sends notification email to customer
   - *TODO: Integration with payment-service for actual refund*

3. **User Refund vs Admin Refund**
   - **User Cancellation:** Uses cancellation policy tiers (time-based)
   - **Admin Refund:** Manual refund amount (flexible, override policy)
   - **Admin can refund cancelled bookings:** Useful for adjusting refund amounts after initial cancellation

---

## 🔐 Authorization

All endpoints require:
1. Valid JWT token
2. User role = `admin`

**Middleware:** `authenticate` → `authorize(['admin'])`

---

## 🧪 Testing

Run automated tests:
```bash
cd backend/services/booking-service
node test-admin-api.js
```

Before running tests:
1. Start booking-service: `npm start`
2. Get admin JWT token from auth-service
3. Update `ADMIN_TOKEN` in `test-admin-api.js`

---

## 📝 Error Codes

| Code | Description |
|------|-------------|
| VAL_001 | Validation error |
| AUTH_003 | Unauthorized access |
| BOOK_002 | Booking not found |
| BOOK_006 | Cannot update status |
| BOOK_007 | Already refunded |
| SYS_001 | Internal server error |

---

## 🚀 Future Enhancements

1. **Payment Integration**
   - Auto-process refunds via payment-service
   - Support multiple payment methods

2. **Advanced Filters**
   - Filter by user email/phone
   - Filter by trip route
   - Filter by booking reference

3. **Bulk Operations**
   - Bulk status updates
   - Bulk refunds

4. **Export**
   - Export bookings to CSV/Excel
   - Generate reports

5. **Audit Trail**
   - Track all admin actions
   - Log status changes
