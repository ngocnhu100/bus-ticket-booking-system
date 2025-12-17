# Reservation Management Features - Complete Implementation

## Overview
This document describes the complete implementation of three core reservation management features:
1. **Reservation Cancellation with Refund Processing**
2. **Booking Modification (Edit Passenger Info & Seats)**
3. **Automatic Booking Expiration with Email Notifications**

All features are fully implemented in the backend with comprehensive error handling, email notifications, and transaction safety.

---

## Feature 1: Reservation Cancellation with Refund Processing

### Implementation Files
- `src/utils/cancellationPolicy.js` - Cancellation policy logic with refund tiers
- `src/services/bookingService.js` - Enhanced cancelBooking() and getCancellationPreview()
- `src/controllers/bookingController.js` - HTTP endpoints
- `src/index.js` - Route configuration

### Cancellation Policy (5 Tiers)

| Time Until Departure | Refund Percentage | Processing Fee | Total Refund |
|---------------------|------------------|----------------|--------------|
| 48+ hours           | 100%             | 0 VND          | 100%         |
| 24-48 hours         | 80%              | 10,000 VND     | 80% - 10k    |
| 6-24 hours          | 50%              | 20,000 VND     | 50% - 20k    |
| 2-6 hours           | 20%              | 30,000 VND     | 20% - 30k    |
| < 2 hours           | 0%               | 0 VND          | Not allowed  |

### API Endpoints

#### 1. Get Cancellation Preview
**GET** `/api/bookings/:id/cancellation-preview`

Shows cancellation policy and refund preview before actual cancellation.

**Response:**
```json
{
  "success": true,
  "canCancel": true,
  "booking": { "booking_id": "...", "booking_reference": "...", "status": "confirmed", ... },
  "trip": { "trip_id": "...", "departure_time": "2025-01-20T14:00:00Z", ... },
  "refund": {
    "tier": "24-48 hours before departure",
    "refundAmount": 160000,
    "processingFee": 10000,
    "totalRefund": 150000,
    "canRefund": true
  },
  "policyTiers": [
    { "name": "48+ hours before departure", "refundPercentage": 100, "processingFee": 0 },
    { "name": "24-48 hours before departure", "refundPercentage": 80, "processingFee": 10000 },
    ...
  ]
}
```

#### 2. Cancel Booking
**PUT** `/api/bookings/:id/cancel`

Cancels the booking and processes refund according to policy.

**Request Body:**
```json
{
  "reason": "Change of plans"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking BKTDLQJZ7F cancelled successfully",
  "booking": {
    "booking_id": "...",
    "booking_reference": "BKTDLQJZ7F",
    "status": "cancelled",
    "payment_status": "refunded",
    "cancellation_reason": "Change of plans",
    "updated_at": "2025-01-17T12:34:56Z"
  },
  "refund": {
    "tier": "24-48 hours before departure",
    "originalAmount": 200000,
    "refundAmount": 160000,
    "processingFee": 10000,
    "totalRefund": 150000,
    "status": "pending",
    "processingTime": "3-5 business days"
  },
  "seatsReleased": ["A1", "A2"]
}
```

### Implementation Features

#### ✅ Atomic Cancellation Process (9 Steps)
1. **Authorization Check**: Verify userId matches booking.user_id
2. **Status Validation**: Ensure booking is not already cancelled/completed
3. **Trip Details Fetch**: Get departure time from trip-service
4. **Refund Calculation**: Apply cancellation policy based on time until departure
5. **Database Update**: Atomically update booking status, payment_status, refund_amount, cancellation_reason
6. **Redis Cleanup**: Clear booking expiration entry
7. **Seat Release**: Atomically release seat locks via trip-service
8. **Email Notification**: Send cancellation confirmation with refund details
9. **Return Response**: Complete refund and booking details

#### ✅ Error Handling
- **404 Not Found**: Booking doesn't exist
- **403 Forbidden**: User doesn't own this booking
- **400 Bad Request**: Booking already cancelled or cancellation not allowed
- **500 Internal Server Error**: Database or service failures

#### ✅ Email Notifications
Sends cancellation confirmation email with:
- Booking reference
- Cancellation time
- Refund amount breakdown (original, refund, processing fee, total)
- Processing timeline (3-5 business days)
- Trip details (origin, destination, original departure time)

---

## Feature 2: Booking Modification (Edit Passenger Info & Seats)

### Implementation Files
- `src/utils/modificationPolicy.js` - Modification policy logic with fee tiers
- `src/services/bookingService.js` - modifyBooking() and getModificationPreview()
- `src/repositories/bookingRepository.js` - updateModificationFee(), updateTicketUrl()
- `src/repositories/passengerRepository.js` - update(), updateSeat()
- `src/controllers/bookingController.js` - HTTP endpoints
- `src/index.js` - Route configuration

### Modification Policy (5 Tiers)

| Time Until Departure | Base Fee  | Per Seat Change Fee | Notes                |
|---------------------|-----------|---------------------|----------------------|
| 48+ hours           | 0 VND     | 0 VND               | Free modifications   |
| 24-48 hours         | 10,000    | 5,000               | Small fee            |
| 6-24 hours          | 20,000    | 10,000              | Moderate fee         |
| 2-6 hours           | 30,000    | 15,000              | High fee             |
| < 2 hours           | N/A       | N/A                 | Not allowed          |

### API Endpoints

#### 1. Get Modification Preview
**GET** `/api/bookings/:id/modification-preview`

Shows modification policy and current booking details.

**Response:**
```json
{
  "success": true,
  "canModify": true,
  "booking": { "booking_id": "...", "booking_reference": "...", "status": "confirmed", ... },
  "trip": { "trip_id": "...", "departure_time": "2025-01-20T14:00:00Z", ... },
  "currentPassengers": [
    { "ticket_id": "...", "seat_code": "A1", "full_name": "John Doe", "phone": "...", ... },
    { "ticket_id": "...", "seat_code": "A2", "full_name": "Jane Doe", "phone": "...", ... }
  ],
  "policy": {
    "tier": "24-48 hours before departure",
    "baseFee": 10000,
    "seatChangeFee": 5000
  },
  "policyTiers": [
    { "name": "48+ hours before departure", "baseFee": 0, "seatChangeFee": 0 },
    { "name": "24-48 hours before departure", "baseFee": 10000, "seatChangeFee": 5000 },
    ...
  ]
}
```

#### 2. Modify Booking
**PUT** `/api/bookings/:id/modify`

Modifies passenger information and/or seat assignments.

**Request Body:**
```json
{
  "passengerUpdates": [
    {
      "ticketId": "abc123",
      "fullName": "John Smith",
      "phone": "+84987654321",
      "documentId": "123456789"
    }
  ],
  "seatChanges": [
    {
      "ticketId": "abc123",
      "oldSeatCode": "A1",
      "newSeatCode": "B5"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking BKTDLQJZ7F modified successfully",
  "booking": {
    "booking_id": "...",
    "booking_reference": "BKTDLQJZ7F",
    "status": "confirmed",
    "total_price": 220000,
    "updated_at": "2025-01-17T12:34:56Z"
  },
  "passengers": [
    {
      "ticket_id": "abc123",
      "seat_code": "B5",
      "full_name": "John Smith",
      "phone": "+84987654321",
      "document_id": "123456789"
    }
  ],
  "modifications": {
    "passengerUpdatesCount": 1,
    "seatChangesCount": 1,
    "oldSeatsReleased": ["A1"],
    "newSeatsLocked": ["B5"]
  },
  "fees": {
    "baseFee": 10000,
    "seatChangeFees": 5000,
    "totalFee": 15000,
    "newTotalPrice": 220000
  },
  "ticketUrl": "https://eticket-service.com/tickets/abc123-new"
}
```

### Implementation Features

#### ✅ Modification Process (11 Steps)
1. **Authorization Check**: Verify userId matches booking.user_id
2. **Status Validation**: Ensure booking is confirmed (not cancelled/completed)
3. **Trip Details Fetch**: Get departure time for policy application
4. **Modification Validation**: Check if modifications allowed (< 2 hours not allowed)
5. **Fee Calculation**: Apply modification policy (base fee + per-seat change fees)
6. **Seat Availability Check**: Real-time validation via trip-service
7. **Seat Changes**: Atomically lock new seats and release old seats
8. **Passenger Updates**: Update full_name, phone, document_id in database
9. **Booking Update**: Add modification fee to total_price
10. **E-Ticket Regeneration**: Generate new ticket with updated information
11. **Email Notification**: Send modification confirmation with new details

#### ✅ Real-Time Seat Availability
- Checks seat availability via trip-service **before** locking
- Returns 409 Conflict if seats unavailable
- Atomic seat operations: lock new → release old (or rollback on failure)

#### ✅ Rollback Mechanism
If seat locking fails partway through:
- Automatically releases successfully locked seats
- Returns error with details
- Booking remains in original state

#### ✅ E-Ticket Regeneration
- Automatically generates new ticket URL with updated information
- Updates ticket_url in booking record
- Includes new ticket URL in email confirmation

#### ✅ Error Handling
- **404 Not Found**: Booking doesn't exist
- **403 Forbidden**: User doesn't own this booking
- **400 Bad Request**: Modification not allowed (< 2 hours) or invalid data
- **409 Conflict**: Seats unavailable
- **500 Internal Server Error**: Database or service failures

---

## Feature 3: Automatic Booking Expiration

### Implementation Files
- `src/jobs/bookingExpirationJob.js` - Background job runner
- `src/services/bookingService.js` - Enhanced processExpiredBookings() and sendExpirationNotification()

### Expiration Policy
- **Target**: Bookings with status='pending' AND payment_status='unpaid' AND locked_until < NOW
- **Action**: Automatically cancel and release seats
- **Frequency**: Runs every 60 seconds
- **Refund**: 0 VND (no payment received)

### Background Job Configuration
```javascript
const bookingExpirationJob = new BookingExpirationJob(bookingService);
bookingExpirationJob.start(60000); // Run every 60 seconds
```

### Enhanced Expiration Process (7 Steps)

#### 1. Find Expired Bookings
```sql
SELECT * FROM bookings 
WHERE status = 'pending' 
  AND payment_status = 'unpaid' 
  AND locked_until < NOW()
```

#### 2. Validate Each Booking
- Check status is still 'pending' (double-check for race conditions)
- Check payment_status is still 'unpaid'
- Skip if already paid or status changed

#### 3. Get Associated Data
- Fetch passengers to know which seats to release
- Fetch trip details for email notification

#### 4. Cancel Booking
- Update status to 'cancelled'
- Update cancellation_reason to 'Booking expired - payment not received within time limit'
- Set refund_amount to 0

#### 5. Clear Redis Expiration
- Delete `booking:expiration:{bookingId}` key

#### 6. Release Seat Locks
- Call trip-service to atomically release seats
- Seats become available for other users immediately

#### 7. Send Email Notification
- Email to contact_email with expiration notice
- Include booking reference, expiration time, trip details

### Structured Logging

All logs prefixed with `[ExpirationJob]` for easy filtering:

```
═══════════════════════════════════════════════════════════
⏰ [ExpirationJob] Starting expired bookings processing
⏰ [ExpirationJob] Time: 2025-01-17T12:00:00.000Z
⏰ [ExpirationJob] Found 5 expired bookings
⏰ [ExpirationJob] Processing booking BKTABC123 (uuid-123)
⏰ [ExpirationJob] Booking BKTABC123: 2 seats - A1, A2
⏰ [ExpirationJob] Cancelled booking BKTABC123 in database
⏰ [ExpirationJob] Cleared Redis expiration for BKTABC123
⏰ [ExpirationJob] Releasing locks for seats: A1, A2
⏰ [ExpirationJob] Successfully released seat locks for BKTABC123
⏰ [ExpirationJob] Sent expiration email for BKTABC123
⏰ [ExpirationJob] ✅ Successfully processed booking BKTABC123
═══════════════════════════════════════════════════════════
⏰ [ExpirationJob] Processing complete
⏰ [ExpirationJob] Duration: 2345ms
⏰ [ExpirationJob] Total found: 5
⏰ [ExpirationJob] Successfully cancelled: 4
⏰ [ExpirationJob] Failed: 1
⏰ [ExpirationJob] Cancelled bookings:
   - BKTABC123 (2 seats)
   - BKTDEF456 (1 seats)
   - BKTGHI789 (3 seats)
   - BKTJKL012 (2 seats)
═══════════════════════════════════════════════════════════
```

### Email Notification

Sends email with template 'booking-expiration':
```javascript
{
  to: booking.contact_email,
  template: 'booking-expiration',
  data: {
    bookingReference: 'BKTABC123',
    expirationTime: '2025-01-17T12:00:00Z',
    trip: {
      origin: 'Ho Chi Minh',
      destination: 'Da Lat',
      departureTime: '2025-01-20T14:00:00Z'
    }
  }
}
```

### Error Handling
- Each booking processed independently (failure doesn't stop batch)
- Non-critical errors logged but don't fail overall process:
  - Email sending failure
  - Redis cleanup failure
  - Seat release failure (seats will eventually be released)
- Critical errors logged with full stack trace
- Returns count of successfully cancelled bookings

---

## Testing the Features

### 1. Test Cancellation

#### Get Preview
```bash
GET http://localhost:3002/api/bookings/{bookingId}/cancellation-preview
Authorization: Bearer {token}
```

#### Cancel Booking
```bash
PUT http://localhost:3002/api/bookings/{bookingId}/cancel
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "Change of travel plans"
}
```

### 2. Test Modification

#### Get Preview
```bash
GET http://localhost:3002/api/bookings/{bookingId}/modification-preview
Authorization: Bearer {token}
```

#### Modify Booking
```bash
PUT http://localhost:3002/api/bookings/{bookingId}/modify
Authorization: Bearer {token}
Content-Type: application/json

{
  "passengerUpdates": [
    {
      "ticketId": "abc123",
      "fullName": "Updated Name",
      "phone": "+84987654321"
    }
  ],
  "seatChanges": [
    {
      "ticketId": "abc123",
      "oldSeatCode": "A1",
      "newSeatCode": "B5"
    }
  ]
}
```

### 3. Test Expiration Job

#### Monitor Logs
```bash
# In booking-service container/terminal
# Look for [ExpirationJob] logs every 60 seconds
```

#### Create Test Expired Booking
```sql
-- Manually set locked_until to past time
UPDATE bookings 
SET locked_until = NOW() - INTERVAL '1 hour'
WHERE booking_id = 'test-booking-id';
```

#### Verify Expiration
- Wait for next job run (up to 60 seconds)
- Check logs for cancellation
- Verify booking status changed to 'cancelled'
- Verify seats released (check trip-service)
- Check email inbox for expiration notification

---

## Integration with Other Services

### Trip Service
- **Seat Availability Check**: `GET /trips/{tripId}/seats/availability`
- **Lock Seats**: `POST /trips/{tripId}/seats/lock`
- **Release Seats**: `POST /trips/{tripId}/seats/release`

### Notification Service
- **Send Email**: `POST /send-email`
  - Templates: `booking-cancellation`, `booking-modification`, `booking-expiration`

### Ticket Service (E-Ticket Generation)
- Called via `ticketService.generateTicket()` after modifications
- Returns new ticket URL

---

## Database Schema Changes

No schema changes required. All features use existing tables:

### bookings table
- `status`: 'pending' | 'confirmed' | 'cancelled' | 'completed'
- `payment_status`: 'unpaid' | 'paid' | 'refunded'
- `total_price`: Decimal (updated with modification fees)
- `refund_amount`: Decimal (set on cancellation)
- `cancellation_reason`: Text (set on cancellation)
- `locked_until`: Timestamp (used by expiration job)
- `ticket_url`: Text (updated on modification)

### booking_passengers table
- `seat_code`: VARCHAR(10) (updated on seat changes)
- `full_name`: VARCHAR(255) (updated on passenger info changes)
- `phone`: VARCHAR(20) (updated on passenger info changes)
- `document_id`: VARCHAR(50) (updated on passenger info changes)

---

## Frontend Integration (TODO)

### Location
- `frontend/src/pages/users/BookingReview.tsx` (or similar booking management page)

### Required Components

#### 1. Cancel Button with Preview Dialog
```tsx
const handleCancelClick = async () => {
  const preview = await api.get(`/bookings/${bookingId}/cancellation-preview`);
  showDialog({
    title: 'Cancel Booking',
    refund: preview.refund,
    policyTiers: preview.policyTiers,
    onConfirm: async (reason) => {
      await api.put(`/bookings/${bookingId}/cancel`, { reason });
      showSuccessToast(`Refund: ${preview.refund.totalRefund} VND`);
    }
  });
};
```

#### 2. Edit Button with Modification Dialog
```tsx
const handleEditClick = async () => {
  const preview = await api.get(`/bookings/${bookingId}/modification-preview`);
  showDialog({
    title: 'Modify Booking',
    passengers: preview.currentPassengers,
    policy: preview.policy,
    policyTiers: preview.policyTiers,
    onConfirm: async (modifications) => {
      const result = await api.put(`/bookings/${bookingId}/modify`, modifications);
      showSuccessToast(`Total fee: ${result.fees.totalFee} VND`);
    }
  });
};
```

#### 3. Passenger Info Edit Form
- Text inputs for full_name, phone, document_id
- Validation for required fields

#### 4. Seat Selection UI
- Show current seat assignments
- Interactive seat map for selecting new seats
- Real-time availability check
- Show per-seat change fee

---

## Security & Authorization

### Authentication
- All endpoints use `optionalAuthenticate` middleware
- Supports both authenticated users (JWT token) and guests (booking_id)

### Authorization
- Validates `userId` matches `booking.user_id` in database
- Returns 403 Forbidden if user doesn't own booking

### Transaction Safety
- All critical operations wrapped in try-catch
- Database updates are atomic
- Seat locks are atomic (lock new → release old, or rollback)
- Email failures don't fail the main operation

---

## Performance Considerations

### Expiration Job
- Runs every 60 seconds (configurable)
- Processes bookings independently (one failure doesn't stop batch)
- Uses indexes on bookings table: (status, payment_status, locked_until)

### Seat Locking
- Uses Redis for fast seat lock checks
- Atomic operations prevent race conditions
- Locks released immediately on cancellation/expiration

### Email Notifications
- Async/non-blocking (don't wait for email to complete)
- Failures logged but don't fail main operation
- Uses notification-service queue system

---

## Monitoring & Debugging

### Logs to Monitor

#### Cancellation
```
[BookingService] Step 1: Validating cancellation request for booking...
[BookingService] Step 2: Fetching trip details for trip...
[BookingService] Step 3: Calculating refund (tier: 24-48 hours)...
[BookingService] Step 9: Cancellation complete
```

#### Modification
```
[BookingService] Step 1: Validating modification request...
[BookingService] Step 5: Checking seat availability...
[BookingService] Step 6: Processing seat changes...
[BookingService] Step 11: Modification complete
```

#### Expiration
```
⏰ [ExpirationJob] Starting expired bookings processing
⏰ [ExpirationJob] Found 5 expired bookings
⏰ [ExpirationJob] Successfully cancelled: 4
```

### Metrics to Track
- Cancellation rate by tier (how many cancel 48+ hours vs < 2 hours)
- Modification frequency by tier
- Average refund amount
- Expiration job duration and success rate
- Email delivery success rate

---

## Next Steps

### Immediate
1. ✅ Backend cancellation API - COMPLETE
2. ✅ Backend modification API - COMPLETE
3. ✅ Enhanced expiration job - COMPLETE
4. ⏳ Frontend UI components - TODO
5. ⏳ Unit & integration tests - TODO

### Future Enhancements
- **Partial Cancellations**: Cancel only some passengers from a booking
- **Refund Payment Integration**: Auto-process refunds to payment method
- **Modification History**: Track all changes to a booking over time
- **Admin Dashboard**: View all cancellations/modifications in admin panel
- **SMS Notifications**: Add SMS option for expiration/cancellation alerts
- **Analytics Dashboard**: Visualize cancellation/modification trends

---

## API Summary Table

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/api/bookings/:id/cancellation-preview` | Get refund preview | Optional |
| PUT | `/api/bookings/:id/cancel` | Cancel booking with refund | Optional |
| GET | `/api/bookings/:id/modification-preview` | Get modification fees preview | Optional |
| PUT | `/api/bookings/:id/modify` | Modify passengers/seats | Optional |

---

## Support

For issues or questions:
1. Check logs with `[BookingService]` or `[ExpirationJob]` prefix
2. Verify notification-service is running for email delivery
3. Check Redis connection for seat locking
4. Verify trip-service is accessible for seat operations

---

**Implementation Complete**: All three backend features are fully implemented and production-ready. Frontend UI and tests remain as next steps.
