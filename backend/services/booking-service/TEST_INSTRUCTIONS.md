# Guest Booking Lookup - Test Instructions

## Setup Test Data

First, create a test booking with the new format `BKYYYYMMDDXXX`:

```bash
docker exec bus-ticket-postgres psql -U postgres -d bus_ticket_dev -c "
INSERT INTO bookings (
  booking_reference, 
  trip_id, 
  user_id, 
  contact_email, 
  contact_phone, 
  status, 
  locked_until, 
  subtotal, 
  service_fee, 
  total_price, 
  currency
) VALUES (
  'BK20251209001', 
  '7195f79f-c867-407c-b8bc-31ad6794951b', 
  NULL, 
  'test@example.com', 
  '+84973994154', 
  'confirmed', 
  NOW() + INTERVAL '10 minutes', 
  500000, 
  25000, 
  525000, 
  'VND'
);"
```

## Test via Docker Container

Since the booking service port is not exposed to host, test from inside the container:

```bash
# Test with email
docker exec bus-ticket-booking-service wget -q -O - \
  "http://localhost:3004/guest/lookup?bookingReference=BK20251209001&email=test@example.com"

# Test with phone
docker exec bus-ticket-booking-service wget -q -O - \
  "http://localhost:3004/guest/lookup?bookingReference=BK20251209001&phone=%2B84973994154"
```

## Test via Frontend

1. Navigate to: `http://localhost:5173/booking-lookup`
2. Enter:
   - **Booking Reference:** `BK20251209001`
   - **Email:** `test@example.com`
   - **OR Phone:** `+84973994154` or `0973994154`
3. Click "Search"

## Expected Response

```json
{
  "success": true,
  "data": {
    "bookingId": "...",
    "bookingReference": "BK20251209001",
    "tripId": "...",
    "userId": null,
    "contactEmail": "test@example.com",
    "contactPhone": "+84973994154",
    "status": "confirmed",
    "lockedUntil": "2025-12-09T...",
    "pricing": {
      "subtotal": 500000,
      "serviceFee": 25000,
      "total": 525000,
      "currency": "VND"
    },
    "passengers": [],
    "tripDetails": {
      "route": { ... },
      "operator": { ... },
      "bus": { ... },
      "schedule": { ... }
    }
  },
  "message": "Booking retrieved successfully",
  "timestamp": "..."
}
```

## Test Cases

### ✅ Valid Cases

1. **With phone:** `BK20251209001` + `+84973994154`
2. **With email:** `BK20251209001` + `test@example.com`
3. **Phone with 0 prefix:** `BK20251209001` + `0973994154`

### ❌ Error Cases

1. **Invalid format:** `INVALID123` → 400 (pattern mismatch)
2. **Wrong phone:** `BK20251209001` + `+84999999999` → 403 (contact mismatch)
3. **Wrong email:** `BK20251209001` + `wrong@example.com` → 403 (contact mismatch)
4. **Not found:** `BK20251209999` → 404 (booking not found)
5. **Missing contact:** `BK20251209001` (no phone/email) → 400 (validation error)

## Booking Reference Format

- **Pattern:** `BKYYYYMMDDXXX`
- **Example:** `BK20251209001`
- **Length:** 13 characters
- **Structure:**
  - `BK`: Prefix (2 letters)
  - `20251209`: Date YYYYMMDD (8 digits)
  - `001`: Sequence (3 digits, 000-999)

## Create More Test Bookings

```bash
# Booking 2
docker exec bus-ticket-postgres psql -U postgres -d bus_ticket_dev -c "
INSERT INTO bookings (booking_reference, trip_id, user_id, contact_email, contact_phone, status, locked_until, subtotal, service_fee, total_price, currency) 
VALUES ('BK20251209042', '7195f79f-c867-407c-b8bc-31ad6794951b', NULL, 'user2@example.com', '+84912345678', 'pending', NOW() + INTERVAL '10 minutes', 600000, 30000, 630000, 'VND');"

# Booking 3
docker exec bus-ticket-postgres psql -U postgres -d bus_ticket_dev -c "
INSERT INTO bookings (booking_reference, trip_id, user_id, contact_email, contact_phone, status, locked_until, subtotal, service_fee, total_price, currency) 
VALUES ('BK20251209100', 'e3c47a55-c2ea-41fb-9167-e68d61db6ca6', NULL, 'guest@test.com', '+84987654321', 'confirmed', NOW() + INTERVAL '10 minutes', 450000, 22500, 472500, 'VND');"
```

## Troubleshooting

### Port Not Exposed

If you get "connection refused" when testing from host:
- Service port 3004 is only accessible within Docker network
- Use `docker exec` to test from inside container
- Or add port mapping to `docker-compose.yml`:
  ```yaml
  booking-service:
    ports:
      - "3004:3004"
  ```

### Booking Not Found

Check if booking exists:
```bash
docker exec bus-ticket-postgres psql -U postgres -d bus_ticket_dev -c \
  "SELECT booking_reference, contact_email, contact_phone, status FROM bookings ORDER BY created_at DESC LIMIT 5;"
```

### Service Not Running

Restart booking service:
```bash
cd backend
docker-compose restart booking-service
```

Check logs:
```bash
docker logs bus-ticket-booking-service --tail 50
```
