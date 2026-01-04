# System Architecture

## Overview

The Bus Ticket Booking System is built using a **microservices architecture** with a centralized API Gateway. This design promotes scalability, maintainability, and independent service deployment.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Client Layer                                 │
│                                                                      │
│  ┌─────────────────┐         ┌──────────────────┐                 │
│  │  Web Frontend   │         │  Mobile App      │                 │
│  │  (React + Vite) │         │  (Future)        │                 │
│  │  Port: 5173     │         │                  │                 │
│  └────────┬────────┘         └────────┬─────────┘                 │
│           │                           │                            │
└───────────┼───────────────────────────┼────────────────────────────┘
            │                           │
            └───────────┬───────────────┘
                        │ HTTP/JSON
                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                               │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                   API Gateway (Express)                       │  │
│  │                      Port: 3000                               │  │
│  │                                                               │  │
│  │  • Request Routing & Load Balancing                          │  │
│  │  • Authentication Middleware (JWT Validation)                │  │
│  │  • Rate Limiting & Throttling                                │  │
│  │  • Request/Response Logging                                  │  │
│  │  • CORS Configuration                                        │  │
│  │  • Error Handling & Response Formatting                      │  │
│  └───────┬───────┬──────┬──────┬──────┬──────┬──────┬──────────┘  │
│          │       │      │      │      │      │      │              │
└──────────┼───────┼──────┼──────┼──────┼──────┼──────┼──────────────┘
           │       │      │      │      │      │      │
           ▼       ▼      ▼      ▼      ▼      ▼      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Microservices Layer                               │
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐                │
│  │   Auth      │  │    Trip     │  │  Booking     │                │
│  │  Service    │  │  Service    │  │  Service     │                │
│  │  Port: 3001 │  │  Port: 3002 │  │  Port: 3004  │                │
│  └─────────────┘  └─────────────┘  └──────────────┘                │
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐                │
│  │ Notification│  │  Payment    │  │  Analytics   │                │
│  │  Service    │  │  Service    │  │  Service     │                │
│  │  Port: 3003 │  │  Port: 3005 │  │  Port: 3006  │                │
│  └─────────────┘  └─────────────┘  └──────────────┘                │
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐                                  │
│  │  Chatbot    │  │    User     │                                  │
│  │  Service    │  │  Service    │                                  │
│  │  Port: 3007 │  │  Port: 3008 │                                  │
│  └─────────────┘  └─────────────┘                                  │
│                                                                      │
└──────────┬───────────────────────┬───────────────────────────────────┘
           │                       │
           ▼                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Data Layer                                      │
│                                                                      │
│  ┌──────────────────────────┐    ┌───────────────────────────────┐ │
│  │   PostgreSQL Database    │    │      Redis Cache              │ │
│  │      Port: 5432          │    │      Port: 6379               │ │
│  │                          │    │                               │ │
│  │  • Users                 │    │  • Session Storage            │ │
│  │  • Trips                 │    │  • Seat Locking               │ │
│  │  • Bookings              │    │  • Token Blacklist            │ │
│  │  • Routes                │    │  • Search Caching             │ │
│  │  • Buses                 │    │  • Rate Limiting Counters     │ │
│  │  • Operators             │    │  • Booking Reference Counter  │ │
│  └──────────────────────────┘    └───────────────────────────────┘ │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

## Design Principles

### 1. Microservices Architecture

Each service is:

- **Independent**: Can be developed, deployed, and scaled independently
- **Focused**: Single responsibility principle - one service per business domain
- **Loosely Coupled**: Services communicate via well-defined APIs
- **Technology Agnostic**: Can use different tech stacks if needed

### 2. API Gateway Pattern

The API Gateway serves as:

- **Single Entry Point**: All client requests go through the gateway
- **Request Router**: Routes requests to appropriate microservices
- **Authentication Layer**: Validates JWT tokens before forwarding requests
- **Aggregator**: Can combine multiple service responses if needed

### 3. Database Per Service

Each service can have its own database schema:

- **Data Isolation**: Services don't directly access other services' data
- **Independent Scaling**: Databases can be scaled independently
- **Technology Freedom**: Can use different databases if needed

### 4. Caching Strategy

Redis is used for:

- **Session Management**: JWT token blacklist
- **Seat Locking**: Temporary seat reservations (10-minute TTL)
- **Search Caching**: Trip search results
- **Rate Limiting**: API throttling counters
- **Atomic Operations**: Booking reference generation

## Service Communication

### Synchronous Communication (REST)

Services communicate via HTTP REST APIs:

```
Auth Service → Notification Service
  POST /internal/notifications/send-email
  (Email verification, password reset)

Booking Service → Trip Service
  GET /internal/trips/:id
  (Validate trip, get pricing)

Booking Service → Notification Service
  POST /internal/notifications/send-eticket
  (Send e-ticket after booking)

Payment Service → Booking Service
  PATCH /internal/bookings/:id/payment-status
  (Update payment status)
```

### Internal Service Authentication

Internal service-to-service calls use a shared secret key:

```javascript
headers: {
  'x-internal-service-key': process.env.INTERNAL_SERVICE_KEY
}
```

## Technology Stack

### Frontend

- **Framework**: React 19
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Date Handling**: date-fns, Luxon
- **UI Components**: Radix UI, shadcn/ui

### Backend

- **Runtime**: Node.js 18
- **Framework**: Express.js
- **Language**: JavaScript (ES6+)
- **Validation**: Joi
- **Authentication**: JWT, Passport.js
- **Database Client**: node-postgres (pg)
- **Cache Client**: Redis
- **Email**: SendGrid
- **PDF Generation**: PDFKit
- **QR Code**: qrcode library

### Infrastructure

- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Reverse Proxy**: Nginx (production)

### Payment Gateways

- **PayOS**: Credit/debit cards, e-wallets
- **Momo**: Mobile wallet
- **ZaloPay**: Digital wallet
- **Stripe**: International cards

## Security Architecture

### Authentication Flow

```
1. User Login
   ↓
2. Auth Service validates credentials
   ↓
3. Generate JWT Access Token (15 min) + Refresh Token (7 days)
   ↓
4. Return tokens to client
   ↓
5. Client stores tokens (localStorage/sessionStorage)
   ↓
6. Client includes Access Token in Authorization header
   ↓
7. API Gateway validates token
   ↓
8. Forward request to target service with user context
```

### JWT Structure

**Access Token Payload:**

```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "role": "passenger|admin",
  "iat": 1234567890,
  "exp": 1234568790
}
```

**Refresh Token Payload:**

```json
{
  "userId": "uuid",
  "tokenId": "uuid",
  "iat": 1234567890,
  "exp": 1235172690
}
```

### Security Features

1. **JWT-based Authentication**
   - Short-lived access tokens (15 minutes)
   - Long-lived refresh tokens (7 days)
   - Token blacklist on logout

2. **Password Security**
   - bcrypt hashing with salt rounds = 10
   - Password reset via email token
   - Failed login attempt tracking

3. **API Security**
   - Rate limiting (100 requests/15 minutes per IP)
   - CORS configuration
   - Helmet.js security headers
   - Input validation with Joi

4. **Database Security**
   - Parameterized queries (SQL injection prevention)
   - Role-based access control
   - UUID primary keys

## Scalability Patterns

### Horizontal Scaling

Services can be scaled independently:

```yaml
# Docker Compose example
booking-service:
  replicas: 3
  deploy:
    resources:
      limits:
        cpus: "0.5"
        memory: 512M
```

### Caching Layers

1. **Redis Cache**: Short-term data (sessions, locks)
2. **CDN**: Static assets (images, CSS, JS)
3. **Database Indexes**: Optimized queries

### Database Optimization

- **Indexes**: All foreign keys and search columns
- **Connection Pooling**: max 20 connections per service
- **Read Replicas**: For analytics and reporting (future)

## Monitoring & Logging

### Logging Strategy

Each service logs to stdout/stderr:

```javascript
// Structured logging format
{
  timestamp: '2026-01-04T10:30:00Z',
  level: 'info',
  service: 'booking-service',
  message: 'Booking created',
  context: {
    bookingId: 'uuid',
    userId: 'uuid',
    tripId: 'uuid'
  }
}
```

### Health Checks

All services expose `/health` endpoint:

```json
GET /health
{
  "service": "booking-service",
  "status": "healthy",
  "timestamp": "2026-01-04T10:30:00Z",
  "version": "1.0.0",
  "dependencies": {
    "database": "connected",
    "redis": "connected"
  }
}
```

## Data Flow Examples

### Complete Booking Flow

```
1. User searches trips
   Frontend → API Gateway → Trip Service
   ↓
2. User selects seats
   Frontend → API Gateway → Booking Service → Redis (lock seats)
   ↓
3. User enters passenger info
   Frontend (form validation)
   ↓
4. User confirms booking
   Frontend → API Gateway → Booking Service
   ├─→ Trip Service (validate trip)
   ├─→ Redis (check seat locks)
   ├─→ PostgreSQL (create booking)
   └─→ Payment Service (initiate payment)
   ↓
5. Payment completed
   Payment Gateway → Payment Service (webhook)
   ├─→ Booking Service (update status)
   ├─→ Notification Service (send e-ticket)
   └─→ Redis (release locks)
```

### Guest Checkout Flow

```
1. Guest enters contact info (email + phone)
   ↓
2. Booking created with user_id = NULL
   ↓
3. Booking reference generated (Redis atomic counter)
   ↓
4. E-ticket sent to email
   ↓
5. Booking lookup via reference + contact verification
```

## Deployment Architecture

### Development Environment

```
localhost:5173  → Frontend (Vite dev server)
localhost:3000  → API Gateway
localhost:3001  → Auth Service
localhost:3002  → Trip Service
localhost:3003  → Notification Service
localhost:3004  → Booking Service
localhost:3005  → Payment Service
localhost:5432  → PostgreSQL
localhost:6379  → Redis
```

### Docker Environment

```
docker-compose.yml defines:
  - bus-ticket-network (bridge network)
  - All services communicate via service names
  - Volume mounts for development
  - Health checks for dependencies
```

### Production Environment (Not documented in current project)

Not available in current project documentation.

## Performance Considerations

### Database Query Optimization

- Indexes on all foreign keys
- Composite indexes for common queries
- Connection pooling (max 20 connections)

### Redis Usage

- TTL for all cached data
- Atomic operations for counters
- Pub/Sub for real-time updates (future)

### API Response Times

Target response times:

- Health checks: < 50ms
- Authentication: < 200ms
- Trip search: < 500ms
- Booking creation: < 1s
- Payment processing: < 3s

## Future Enhancements

Potential architectural improvements (not implemented):

1. **Message Queue**: RabbitMQ/Kafka for asynchronous processing
2. **Service Mesh**: Istio for advanced traffic management
3. **API Documentation**: Swagger/OpenAPI generation
4. **GraphQL Gateway**: Alternative to REST for flexible queries
5. **Event Sourcing**: For booking state management
6. **CQRS**: Separate read/write models for analytics

## Related Documentation

- [Getting Started](./01-getting-started.md) - Setup instructions
- [Microservices Details](./08-microservices.md) - Service-specific architecture
- [Database Schema](./05-database-schema.md) - Data model
- [API Reference](./06-api-reference.md) - API documentation
