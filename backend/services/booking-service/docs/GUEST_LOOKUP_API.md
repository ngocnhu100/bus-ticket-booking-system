# Guest Booking Lookup API

## Overview
The Guest Booking Lookup system allows non-registered users to retrieve their booking information using their booking reference code and either their phone number or email address. This provides a secure way for guests to access their bookings without requiring authentication.

## Endpoint

### GET `/guest/lookup`

**Access:** Public (no authentication required)

**Description:** Retrieve booking details for guest users by providing booking reference and contact information.

## Request

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bookingReference` | string | Yes | 13-character booking reference (format: BKYYYYMMDDXXX, e.g., BK20251209042) |
| `phone` | string | Conditional* | Vietnamese phone number (+84XXXXXXXXX or 0XXXXXXXXX) |
| `email` | string | Conditional* | Email address used during booking |

**Note:** Either `phone` OR `email` must be provided (at least one is required).

### Booking Reference Format
- **Pattern:** `BKYYYYMMDDXXX`
- **Example:** `BK20251209042`
- **Length:** 13 characters
- **Structure:**
  - `BK`: Prefix (2 letters)
  - `20251209`: Date (YYYYMMDD - 8 digits)
  - `042`: Sequence number (XXX - 3 digits)

### Phone Number Formats Accepted
- `+84973994154` (international format)
- `0973994154` (Vietnamese format)
- `+84 973 994 154` (with spaces)

### Example Requests

**Using phone number:**
```bash
GET /guest/lookup?bookingReference=BK20251209042&phone=0973994154
```

**Using email:**
```bash
GET /guest/lookup?bookingReference=BK20251209042&email=guest@example.com
```

**Using cURL:**
```bash
# With phone
curl -X GET "http://localhost:3004/guest/lookup?bookingReference=BK20251209042&phone=%2B84973994154"

# With email
curl -X GET "http://localhost:3004/guest/lookup?bookingReference=BK20251209042&email=guest%40example.com"
```

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "bookingId": "123e4567-e89b-12d3-a456-426614174000",
    "bookingReference": "BK20251209042",
    "tripId": "456e7890-e89b-12d3-a456-426614174001",
    "userId": null,
    "contactEmail": "guest@example.com",
    "contactPhone": "+84973994154",
    "status": "pending",
    "lockedUntil": "2025-12-09T09:00:00.000Z",
    "subtotal": 500000,
    "serviceFee": 25000,
    "totalPrice": 525000,
    "currency": "VND",
    "passengers": [
      {
        "passengerId": 1,
        "fullName": "Nguyen Van A",
        "phone": "+84973994154",
        "seatCode": "1A",
        "price": 500000
      }
    ],
    "tripDetails": {
      "tripId": "456e7890-e89b-12d3-a456-426614174001",
      "route": {
        "origin": "Ho Chi Minh City",
        "destination": "Da Lat"
      },
      "operator": {
        "name": "Phuong Trang"
      },
      "bus": {
        "busModel": "Limousine 40 seats"
      },
      "schedule": {
        "departureTime": "2025-12-15T08:00:00Z",
        "arrivalTime": "2025-12-15T14:00:00Z"
      }
    }
  },
  "message": "Booking retrieved successfully",
  "timestamp": "2025-12-09T08:30:00.000Z"
}
```

### Error Responses

#### 400 Bad Request - Missing Parameters
```json
{
  "success": false,
  "error": {
    "code": "VAL_001",
    "message": "Either phone or email must be provided"
  },
  "timestamp": "2025-12-09T08:30:00.000Z"
}
```

#### 400 Bad Request - Invalid Format
```json
{
  "success": false,
  "error": {
    "code": "VAL_001",
    "message": "Booking reference must be in format: BKYYYYMMDDXXX (e.g., BK20251209001)"
  },
  "timestamp": "2025-12-09T08:30:00.000Z"
}
```

#### 403 Forbidden - Contact Mismatch
```json
{
  "success": false,
  "error": {
    "code": "BOOKING_403",
    "message": "Contact information does not match booking records. Please verify your phone number or email."
  },
  "timestamp": "2025-12-09T08:30:00.000Z"
}
```

#### 404 Not Found - Booking Not Found
```json
{
  "success": false,
  "error": {
    "code": "BOOKING_404",
    "message": "Booking not found with the provided reference"
  },
  "timestamp": "2025-12-09T08:30:00.000Z"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": {
    "code": "SYS_001",
    "message": "Failed to retrieve booking"
  },
  "timestamp": "2025-12-09T08:30:00.000Z"
}
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VAL_001 | 400 | Validation error (missing or invalid parameters) |
| BOOKING_403 | 403 | Contact information mismatch |
| BOOKING_404 | 404 | Booking not found |
| SYS_001 | 500 | Internal server error |

## Validation Rules

### Booking Reference
- **Format:** 13 characters (2 letters + 11 digits)
- **Pattern:** `/^[A-Z]{2}\d{11}$/i`
- **Structure:** BKYYYYMMDDXXX
- **Examples:** 
  - ✅ `BK20251209042`
  - ✅ `BK20251209999`
  - ✅ `bk20251209042` (case-insensitive)
  - ❌ `BK20251209A3K` (contains letters in suffix)
  - ❌ `BK20251209` (too short)
  - ❌ `BK-20251209-042` (contains special characters)

### Phone Number
- **Format:** Vietnamese phone number
- **Pattern:** `/^(\+84|0)[0-9]{9,10}$/`
- **Examples:**
  - ✅ `+84973994154`
  - ✅ `0973994154`
  - ✅ `+84 973 994 154` (spaces normalized)
  - ❌ `123456` (too short)
  - ❌ `+1234567890` (wrong country code)

### Email
- **Format:** Valid email address
- **Case:** Case-insensitive comparison
- **Examples:**
  - ✅ `guest@example.com`
  - ✅ `GUEST@EXAMPLE.COM` (case insensitive)
  - ❌ `notanemail`
  - ❌ `@example.com`

## Security Features

1. **Contact Verification:** 
   - Phone or email must match the booking's contact information
   - Prevents unauthorized access to booking details

2. **Phone Normalization:**
   - Handles both `+84` and `0` prefixes
   - Removes spaces for comparison
   - Case-insensitive for emails

3. **No Authentication Required:**
   - Public endpoint suitable for guest users
   - No JWT token needed
   - Secure through contact information verification

4. **Rate Limiting:**
   - Consider implementing rate limiting on this endpoint
   - Prevents brute force attacks on booking references

## Implementation Details

### Architecture
```
Controller (bookingController.js)
    ↓
Service (bookingService.js)
    ↓
Repository (bookingRepository.js)
    ↓
Database (PostgreSQL)
```

### Key Functions

**Validator:** `guestLookupSchema` in `validators/bookingValidators.js`
- Validates query parameters
- Ensures either phone or email is provided

**Service Method:** `guestLookupBooking()` in `services/bookingService.js`
- Finds booking by reference
- Verifies contact information
- Returns complete booking with passengers and trip details

**Controller:** `guestLookup()` in `controllers/bookingController.js`
- Handles HTTP request/response
- Implements error handling with proper status codes

## Testing

Run unit tests:
```bash
npm test -- guestLookup.test.js
```

### Test Coverage
- ✅ Success with valid phone
- ✅ Success with valid email
- ✅ Phone normalization (spaces, 0 prefix)
- ✅ Case-insensitive email
- ✅ 404 - Booking not found
- ✅ 403 - Phone mismatch
- ✅ 403 - Email mismatch
- ✅ 400 - Missing parameters
- ✅ 400 - Invalid formats
- ✅ Data integrity checks

## Frontend Integration

### Example React/TypeScript Implementation

```typescript
interface GuestLookupParams {
  bookingReference: string;
  phone?: string;
  email?: string;
}

async function lookupGuestBooking(params: GuestLookupParams) {
  const queryParams = new URLSearchParams({
    bookingReference: params.bookingReference,
    ...(params.phone && { phone: params.phone }),
    ...(params.email && { email: params.email })
  });

  const response = await fetch(
    `http://localhost:3004/guest/lookup?${queryParams}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error.message);
  }

  return response.json();
}

// Usage
try {
  const booking = await lookupGuestBooking({
    bookingReference: 'ABC123',
    phone: '0973994154'
  });
  console.log('Booking found:', booking.data);
} catch (error) {
  console.error('Lookup failed:', error.message);
}
```

## Migration Path

This endpoint complements the existing `/reference/:reference?email=...` endpoint:

| Old Endpoint | New Endpoint | Benefits |
|--------------|--------------|----------|
| `/reference/:reference?email=...` | `/guest/lookup?bookingReference=...&email=...` | - Accepts phone OR email<br>- Better parameter validation<br>- Clearer error messages<br>- RESTful design |

**Note:** The old endpoint remains available for backward compatibility.

## Future Enhancements

1. **SMS Verification:** Add OTP verification for phone lookups
2. **Rate Limiting:** Implement per-IP rate limiting
3. **Audit Logging:** Log all lookup attempts for security monitoring
4. **Caching:** Cache booking data with short TTL
5. **Analytics:** Track lookup patterns and success rates

## Changelog

### Version 1.0.0 (2025-12-09)
- Initial implementation of guest booking lookup
- Support for phone or email verification
- Comprehensive validation and error handling
- Unit tests with 100% coverage
- Documentation completed
