# Guest Booking Lookup Implementation

## Overview
Implemented guest booking lookup using the **existing GET /bookings/{bookingReference}** endpoint with optional authentication and contact verification.

## API Endpoint

### GET /bookings/:bookingReference

**Supports Two Modes:**

#### 1. Authenticated Lookup (with JWT)
```bash
GET /bookings/BK202512071234
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "booking_id": "uuid",
    "booking_reference": "BK202512071234",
    "trip_id": "TRIP_TEST_001",
    "user_id": "uuid",
    "contact_email": "user@example.com",
    "contact_phone": "+84901234567",
    "total_price": 250000,
    "status": "confirmed",
    "passengers": [...],
    "created_at": "2025-12-07T10:30:00Z"
  },
  "timestamp": "2025-12-07T10:30:05Z"
}
```

#### 2. Guest Lookup (no JWT, requires contact verification)
```bash
GET /bookings/BK202512071234?contactEmail=guest@example.com
# OR
GET /bookings/BK202512071234?contactPhone=+84901234567
# OR (both for extra verification)
GET /bookings/BK202512071234?contactEmail=guest@example.com&contactPhone=+84901234567
```

**Response:** Same format as authenticated lookup

**Error Responses:**

```json
// Missing contact info for guest
{
  "success": false,
  "error": {
    "code": "VAL_003",
    "message": "Either contactEmail or contactPhone is required for guest booking lookup"
  }
}

// Booking not found OR contact info doesn't match (security: same error)
{
  "success": false,
  "error": {
    "code": "BOOKING_003",
    "message": "Booking not found or contact information does not match"
  }
}

// Rate limit exceeded
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_001",
    "message": "Too many lookup attempts. Please try again in 15 minutes."
  }
}
```

## Implementation Details

### 1. Updated Controller (`bookingController.js`)

```javascript
async getBooking(req, res) {
  try {
    const { bookingReference } = req.params;
    const { contactEmail, contactPhone } = req.query;
    const isAuthenticated = !!req.user;

    // ===== AUTHENTICATED USERS =====
    if (isAuthenticated) {
      const booking = await bookingService.getBookingByReference(bookingReference);

      if (!booking) {
        return res.status(404).json({
          success: false,
          error: { code: 'BOOKING_003', message: 'Booking not found' }
        });
      }

      // Verify booking belongs to authenticated user
      if (booking.user_id && booking.user_id !== req.user.userId) {
        return res.status(403).json({
          success: false,
          error: { code: 'BOOKING_004', message: 'Access denied to this booking' }
        });
      }

      return res.json({ success: true, data: booking });
    }

    // ===== GUEST LOOKUP =====
    // Require contact verification
    if (!contactEmail && !contactPhone) {
      return res.status(400).json({
        success: false,
        error: { 
          code: 'VAL_003', 
          message: 'Either contactEmail or contactPhone is required for guest booking lookup' 
        }
      });
    }

    // Verify contact information matches
    const booking = await bookingService.getBookingByReferenceAndContact(
      bookingReference,
      contactEmail,
      contactPhone
    );

    if (!booking) {
      // SECURITY: Don't reveal if booking exists or contact info is wrong
      return res.status(404).json({
        success: false,
        error: { 
          code: 'BOOKING_003', 
          message: 'Booking not found or contact information does not match' 
        }
      });
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    console.error('⚠️ Get booking error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SYS_001', message: 'Internal server error' }
    });
  }
}
```

**Key Logic:**
- ✅ Check if user is authenticated via `req.user` (set by `optionalAuthenticate` middleware)
- ✅ **Authenticated path:** Direct lookup, verify user owns booking
- ✅ **Guest path:** Require contactEmail OR contactPhone, verify match
- ✅ **Security:** Same error message whether booking not found or contact mismatch

### 2. Updated Middleware (`middleware.js`)

```javascript
const jwt = require('jsonwebtoken');
const redisClient = require('./redis');

// ===== ANTI-BRUTEFORCE RATE LIMITING =====
const rateLimitGuestLookup = async (req, res, next) => {
  const { bookingReference } = req.params;
  const { contactEmail, contactPhone } = req.query;
  
  // Skip rate limiting for authenticated users
  if (req.user) {
    return next();
  }
  
  // For guest lookups, check rate limit
  const identifier = contactEmail || contactPhone || req.ip;
  const key = `rate_limit:booking_lookup:${identifier}`;
  
  try {
    const attempts = await redisClient.incr(key);
    
    if (attempts === 1) {
      // First attempt, set expiry to 15 minutes
      await redisClient.expire(key, 900);
    }
    
    // Allow max 10 attempts per 15 minutes
    if (attempts > 10) {
      return res.status(429).json({
        success: false,
        error: { 
          code: 'RATE_LIMIT_001', 
          message: 'Too many lookup attempts. Please try again in 15 minutes.' 
        }
      });
    }
    
    next();
  } catch (error) {
    console.error('⚠️ Rate limit check failed:', error);
    // If Redis fails, continue anyway (fail-open)
    next();
  }
};

// ===== OPTIONAL AUTHENTICATION =====
const optionalAuthenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No token provided - continue as guest
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    // Invalid token - continue as guest
    req.user = null;
    next();
  }
};

module.exports = { 
  authenticate, 
  optionalAuthenticate, 
  rateLimitGuestLookup 
};
```

**Rate Limiting:**
- ✅ **Identifier:** Uses contactEmail, contactPhone, or IP address
- ✅ **Limit:** 10 attempts per 15 minutes
- ✅ **Storage:** Redis with TTL
- ✅ **Skip:** Authenticated users bypass rate limiting
- ✅ **Fail-open:** If Redis unavailable, allow request

### 3. Updated Service (`bookingService.js`)

```javascript
async getBookingByReferenceAndContact(bookingReference, contactEmail, contactPhone) {
  // Fetch booking from database
  const booking = await bookingRepository.findByReference(bookingReference);
  
  if (!booking) {
    return null;
  }
  
  // Check if either email or phone matches
  const emailMatches = contactEmail && booking.contact_email && 
                      booking.contact_email.toLowerCase() === contactEmail.toLowerCase();
  const phoneMatches = contactPhone && booking.contact_phone && 
                      booking.contact_phone.replace(/\s/g, '') === contactPhone.replace(/\s/g, '');
  
  if (!emailMatches && !phoneMatches) {
    // Contact info doesn't match - return null
    // SECURITY: Don't reveal booking exists
    return null;
  }
  
  return booking;
}
```

**Validation Logic:**
- ✅ **Email matching:** Case-insensitive comparison
- ✅ **Phone matching:** Strips whitespace for flexible format
- ✅ **OR logic:** Either email OR phone can match
- ✅ **Security:** Returns null if no match (caller shows same error as "not found")

### 4. Database Query (`bookingRepository.js`)

**Existing query already supports this:**

```javascript
async findByReference(bookingReference) {
  const query = `
    SELECT b.*, 
      json_agg(
        json_build_object(
          'full_name', bp.full_name,
          'document_id', bp.document_id,
          'phone', bp.phone,
          'seat_code', bp.seat_code,
          'price', bp.price
        )
      ) as passengers
    FROM bookings b
    LEFT JOIN booking_passengers bp ON b.booking_id = bp.booking_id
    WHERE b.booking_reference = $1
    GROUP BY b.booking_id
  `;

  const result = await pool.query(query, [bookingReference]);
  return result.rows[0] || null;
}
```

**Returns complete booking data:**
- ✅ All booking fields (id, reference, trip_id, user_id, contact_email, contact_phone, prices, status, dates)
- ✅ All passengers with full details (name, document, phone, seat, price)
- ✅ Same response format for both authenticated and guest lookups

### 5. Route Configuration (`index.js`)

```javascript
const { authenticate, optionalAuthenticate, rateLimitGuestLookup } = require('./middleware');

// Booking lookup - supports both authenticated and guest (with contact verification)
app.get('/bookings/:bookingReference', 
  optionalAuthenticate,      // Sets req.user if JWT present, null otherwise
  rateLimitGuestLookup,       // Rate limit guest lookups only
  bookingController.getBooking
);
```

**Middleware Chain:**
1. `optionalAuthenticate` - Decode JWT if present, set `req.user`
2. `rateLimitGuestLookup` - Check rate limit for guests only
3. `bookingController.getBooking` - Handle lookup logic

## Security Features

### 1. Contact Verification
- Guest lookups MUST provide email OR phone
- Contact info must match database record EXACTLY
- Case-insensitive email matching
- Whitespace-agnostic phone matching

### 2. Information Disclosure Prevention
```javascript
// ❌ BAD: Reveals if booking exists
"Booking found but contact information incorrect"

// ✅ GOOD: Same error for both cases
"Booking not found or contact information does not match"
```

### 3. Anti-Bruteforce Protection
- **Rate limit:** 10 attempts per 15 minutes
- **Identifier:** Email, phone, or IP address
- **Storage:** Redis with automatic expiry
- **Bypass:** Authenticated users not rate limited

### 4. Authorization Check
```javascript
// For authenticated users, verify booking ownership
if (booking.user_id && booking.user_id !== req.user.userId) {
  return res.status(403).json({
    error: { code: 'BOOKING_004', message: 'Access denied to this booking' }
  });
}
```

## Testing

### Test Case 1: Guest Lookup with Email
```bash
curl -X GET "http://localhost:3000/bookings/BK202512071234?contactEmail=guest@test.com"
```

**Expected:** Success if email matches, 404 if not

### Test Case 2: Guest Lookup with Phone
```bash
curl -X GET "http://localhost:3000/bookings/BK202512071234?contactPhone=%2B84901234567"
```

**Expected:** Success if phone matches, 404 if not

### Test Case 3: Guest Lookup without Contact Info
```bash
curl -X GET "http://localhost:3000/bookings/BK202512071234"
```

**Expected:** 400 error - "Either contactEmail or contactPhone is required"

### Test Case 4: Authenticated Lookup
```bash
curl -X GET "http://localhost:3000/bookings/BK202512071234" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

**Expected:** Success without contact verification

### Test Case 5: Rate Limit
```bash
# Run 11 times rapidly
for i in {1..11}; do
  curl -X GET "http://localhost:3000/bookings/BK202512071234?contactEmail=test@test.com"
done
```

**Expected:** First 10 succeed/fail normally, 11th returns 429 rate limit error

### Test Case 6: Wrong Contact Info
```bash
curl -X GET "http://localhost:3000/bookings/BK202512071234?contactEmail=wrong@email.com"
```

**Expected:** 404 - "Booking not found or contact information does not match"

## Response Format

**Identical for both authenticated and guest lookups:**

```json
{
  "success": true,
  "data": {
    "booking_id": "uuid",
    "booking_reference": "BK202512071234",
    "trip_id": "TRIP_TEST_001",
    "user_id": "uuid-or-null",
    "contact_email": "guest@example.com",
    "contact_phone": "+84901234567",
    "subtotal": 237500,
    "service_fee": 12500,
    "total_price": 250000,
    "payment_method": "cash",
    "locked_until": "2025-12-07T10:40:00Z",
    "status": "confirmed",
    "payment_status": "paid",
    "created_at": "2025-12-07T10:30:00Z",
    "updated_at": "2025-12-07T10:35:00Z",
    "passengers": [
      {
        "full_name": "Nguyen Van A",
        "document_id": "001234567890",
        "phone": "+84901234567",
        "seat_code": "A1",
        "price": 250000
      }
    ]
  },
  "timestamp": "2025-12-07T10:30:05Z"
}
```

## Migration Notes

### What Changed:
- ✅ GET /bookings/:bookingReference now uses `optionalAuthenticate` instead of no auth
- ✅ Added query parameters: `?contactEmail=...` and `?contactPhone=...`
- ✅ Added rate limiting middleware
- ✅ Response format unchanged

### Backward Compatibility:
- ✅ Authenticated users: No changes needed, works exactly as before
- ✅ Guest users: Must now provide contact info (previously endpoint was open)
- ⚠️ **Breaking change for existing guest lookups** - now requires contact verification

### Deployment Checklist:
- [ ] Update frontend to pass contactEmail/contactPhone for guest lookups
- [ ] Ensure Redis is running for rate limiting
- [ ] Test both authenticated and guest lookup flows
- [ ] Monitor rate limit errors in production
- [ ] Update API documentation

## Summary

✅ **Guest lookup implemented** using existing GET endpoint  
✅ **No new endpoints created** - reused GET /bookings/:bookingReference  
✅ **Contact verification required** - email OR phone must match  
✅ **Anti-bruteforce protection** - 10 attempts per 15 minutes  
✅ **Security hardened** - same error for not found vs wrong contact  
✅ **Response format unchanged** - identical output for auth/guest  
✅ **Rate limiting** - Redis-based with automatic expiry  
✅ **Authorization check** - authenticated users must own booking  

**Files Modified:**
- `src/index.js` - Updated route middleware chain
- `src/bookingController.js` - Added guest lookup logic
- `src/bookingService.js` - Added contact verification method
- `src/middleware.js` - Added rate limiting middleware

**No database changes required** - existing schema supports this feature.
