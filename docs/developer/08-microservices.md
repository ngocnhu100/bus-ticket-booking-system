# Microservices Documentation

## Overview

The system is composed of 8 independent microservices, each responsible for specific business domains.

## Service Details

### 1. API Gateway (Port 3000)

**Purpose:** Single entry point, request routing, authentication

**Key Features:**

- Routes requests to appropriate services
- JWT token validation
- CORS configuration
- Rate limiting
- Request/response logging

**Technology:** Express.js, Axios

**Environment Variables:**

```env
PORT=3000
AUTH_SERVICE_URL=http://auth-service:3001
TRIP_SERVICE_URL=http://trip-service:3002
BOOKING_SERVICE_URL=http://booking-service:3004
NOTIFICATION_SERVICE_URL=http://notification-service:3003
PAYMENT_SERVICE_URL=http://payment-service:3005
JWT_SECRET=your-jwt-secret
```

---

### 2. Auth Service (Port 3001)

**Purpose:** Authentication, user management, authorization

**Key Features:**

- User registration and login
- JWT token generation and validation
- Google OAuth integration
- Password reset via email
- Email verification
- Token blacklist (logout)
- Role-based access control

**Technology:** Express.js, bcrypt, JWT, Passport.js, Google Auth Library

**Database Tables:** `users`

**Redis Keys:**

- `blacklist:{token}` - Blacklisted tokens
- `session:{userId}` - User sessions
- `reset:{token}` - Password reset tokens

**Endpoints:**

- POST `/register` - Register new user
- POST `/login` - Login
- POST `/oauth/google` - Google OAuth
- POST `/refresh` - Refresh tokens
- POST `/logout` - Logout
- GET `/me` - Get profile
- PUT `/me` - Update profile

---

### 3. Trip Service (Port 3002)

**Purpose:** Trip search, fleet management, seat management

**Key Features:**

- Advanced trip search with filters
- Seat locking (Redis)
- Bus and route management
- Rating and review system
- Admin trip management

**Technology:** Express.js, PostgreSQL, Redis

**Database Tables:** `trips`, `routes`, `buses`, `bus_models`, `operators`, `route_stops`, `seats`, `ratings`

**Redis Keys:**

- `seat_lock:{tripId}:{seatCode}` - Seat locks (10 min TTL)
- `trip_search:{hash}` - Cached search results

**Key Endpoints:**

- GET `/trips/search` - Search trips
- GET `/trips/:id` - Get trip details
- GET `/trips/:id/seats` - Get seat availability
- POST `/trips/:id/seats/lock` - Lock seats
- POST `/trips/:id/seats/release` - Release seats

---

### 4. Notification Service (Port 3003)

**Purpose:** Email notifications, SMS, weather alerts

**Key Features:**

- SendGrid email integration
- E-ticket delivery
- Booking confirmations
- Weather alerts for trip day
- Notification templates

**Technology:** Express.js, SendGrid, PostgreSQL

**Database Tables:** `notifications`

**Key Endpoints:**

- POST `/notifications/send-email` - Send email
- GET `/notifications/user/:userId` - Get user notifications
- POST `/notifications/weather/:tripId` - Send weather alert

---

### 5. Booking Service (Port 3004)

**Purpose:** Booking management, e-ticket generation

**Key Features:**

- Guest checkout support
- Booking creation & management
- E-ticket PDF generation with QR codes
- Booking reference generation (Redis counter)
- Seat locking (10-minute hold)
- Booking lookup with contact verification
- Auto-expiration job for unpaid bookings

**Technology:** Express.js, PostgreSQL, Redis, PDFKit, QRCode

**Database Tables:** `bookings`, `booking_passengers`

**Redis Keys:**

- `booking_ref_counter` - Atomic counter for unique references
- `seat_lock:{tripId}:{seatCode}` - Seat reservations
- `booking_expiry:{bookingId}` - Expiration tracking

**Key Endpoints:**

- POST `/bookings` - Create booking (guest/authenticated)
- GET `/bookings/:reference` - Get by reference
- POST `/bookings/lookup` - Lookup (reference + email)
- GET `/bookings/user/:userId` - User's bookings
- PUT `/bookings/:id/cancel` - Cancel booking
- GET `/tickets/:filename` - Download e-ticket PDF

---

### 6. Payment Service (Port 3005)

**Purpose:** Payment processing, webhooks

**Key Features:**

- Multi-gateway support (PayOS, Momo, ZaloPay, Stripe)
- Webhook handling
- Payment verification
- Refund processing

**Technology:** Express.js, PostgreSQL, Payment SDKs

**Database Tables:** `payments`, `refunds`

**Key Endpoints:**

- POST `/payment/create` - Initiate payment
- POST `/webhooks/payos` - PayOS webhook
- POST `/webhooks/momo` - Momo webhook
- POST `/webhooks/zalopay` - ZaloPay webhook
- POST `/webhooks/card` - Stripe webhook

---

### 7. Analytics Service (Port 3006)

**Purpose:** Business intelligence, reporting

**Key Features:**

- Booking statistics
- Revenue analytics
- Top routes and operators
- Cancellation rate analysis
- Admin dashboard data

**Technology:** Express.js, PostgreSQL

**Key Endpoints:**

- GET `/analytics/bookings` - Booking analytics (date range, groupBy)
- GET `/analytics/revenue` - Revenue analysis
- GET `/analytics/top-routes` - Popular routes
- GET `/analytics/cancellations` - Cancellation stats

**Access:** Admin only (authenticated + role check via API Gateway)

---

### 8. Chatbot Service (Port 3007)

**Purpose:** AI-powered conversational assistant

**Key Features:**

- **Google Gemini AI** integration (gemini-2.5-flash model)
- Natural language trip search
- Conversational booking assistance
- FAQ handling
- Session management (30-minute expiry)
- Support for guest and authenticated users

**Technology:** Express.js, Google AI (Gemini), PostgreSQL, Redis

**Database Tables:** `chatbot_sessions`, `chatbot_messages`

**Redis Keys:**

- `chatbot_session:{sessionId}` - Active sessions

**Environment Variables:**

- `GOOGLE_AI_API_KEY` - Gemini API key
- `GOOGLE_AI_MODEL` - Model name (default: gemini-2.5-flash)
- `GOOGLE_AI_TEMPERATURE` - Response temperature (default: 0.7)
- `GOOGLE_AI_MAX_TOKENS` - Max response tokens (default: 1000)

**Key Endpoints:**

- POST `/chatbot/query` - Send message to chatbot
- GET `/chatbot/sessions/:sessionId/history` - Get conversation history
- POST `/chatbot/sessions/:sessionId/reset` - Reset session
- POST `/chatbot/book` - Process booking via chatbot

---

### 9. User Service (Port 3008)

**Purpose:** User profile management

**Key Features:**

- Profile updates (name, phone, avatar)
- Password change
- Cloudinary avatar upload
- User preferences

**Technology:** Express.js, PostgreSQL, Redis, Cloudinary

**Database Tables:** `users` (shared with auth-service)

**Key Endpoints:**

- GET `/users/profile` - Get user profile
- PUT `/users/profile` - Update profile (with avatar upload)
- POST `/users/change-password` - Change password

**Access via API Gateway:**

- `/users/profile` → user-service:3008
- `/users/change-password` → user-service:3008

---

## Service Communication

### Synchronous (REST)

Services communicate via HTTP REST APIs:

```javascript
// Example: Booking Service → Trip Service
const tripResponse = await axios.get(
  `${TRIP_SERVICE_URL}/internal/trips/${tripId}`,
  {
    headers: {
      "x-internal-service-key": INTERNAL_SERVICE_KEY,
    },
  },
);
```

### Internal Authentication

Internal service calls use shared secret key:

```javascript
// Middleware
function validateInternalServiceKey(req, res, next) {
  const key = req.headers["x-internal-service-key"];

  if (key !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({ error: "Forbidden" });
  }

  next();
}
```

## Service Dependencies

```
API Gateway
├── Auth Service
├── Trip Service
├── Booking Service
│   ├── Trip Service
│   ├── Notification Service
│   └── Payment Service (indirectly)
├── Payment Service
│   └── Booking Service
├── Notification Service
├── Analytics Service
├── User Service
└── Chatbot Service

All Services
├── PostgreSQL
└── Redis
```

## Health Checks

All services expose `/health` endpoint:

```javascript
app.get("/health", (req, res) => {
  res.json({
    service: "booking-service",
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    dependencies: {
      database: "connected",
      redis: "connected",
    },
  });
});
```

## Logging

Each service logs to stdout:

```javascript
console.log(
  JSON.stringify({
    timestamp: new Date().toISOString(),
    level: "info",
    service: "booking-service",
    message: "Booking created",
    context: {
      bookingId: "uuid",
      userId: "uuid",
    },
  }),
);
```

## Error Handling

Standardized error responses:

```javascript
app.use((error, req, res, next) => {
  console.error(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "error",
      service: "booking-service",
      error: error.message,
      stack: error.stack,
    }),
  );

  res.status(error.statusCode || 500).json({
    success: false,
    error: {
      code: error.code || "SERVER_ERROR",
      message: error.message,
    },
    timestamp: new Date().toISOString(),
  });
});
```

## Related Documentation

- [Architecture Overview](./02-architecture.md)
- [API Reference](./06-api-reference.md)
- [Database Schema](./05-database-schema.md)
- [Redis Caching](./09-redis-caching.md)
