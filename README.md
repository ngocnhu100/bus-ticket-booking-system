# Bus Ticket Booking System

## Overview

This is Assignment 1 for the course, building the foundational authentication, authorization, and dashboard components for a bus ticket booking system. The project demonstrates secure auth flows, role-based access, and data APIs for a dashboard.

## Architecture

The system is built using a **microservices architecture** with the following services:

- **API Gateway** (Port 3000): Entry point for all client requests, routes to appropriate services
- **Auth Service** (Port 3001): Handles user authentication, authorization, and user management
- **Notification Service** (Port 3003): Manages email notifications (verification, password reset)
- **PostgreSQL** (Port 5432): Primary database for user data and business entities
- **Redis** (Port 6379): Cache for JWT refresh tokens and session management

### Architecture

```
backend/
├── app.js                    # API Gateway (proxy only)
├── routes/
│   ├── authRoutes.js        # Proxies to auth-service:3001
│   └── dashboardRoutes.js   # Local dashboard
└── services/                # Microservices
    ├── auth-service/        # Auth business logic
    └── notification-service/
```

## Features

- **Authentication**: Email/password signup/login, Google OAuth integration
- **Authorization**: Role-based access (passenger, admin)
- **Email Verification**: SendGrid integration for email verification and password reset
- **Dashboard**: Data endpoints for summary, activity, and stats
- **API**: RESTful endpoints following the provided specification

## Tech Stack

- **Backend**: Node.js, Express.js, PostgreSQL, Redis
- **Auth**: JWT (Access + Refresh tokens)
- **Email**: SendGrid for notifications
- **Testing**: Jest, Supertest
- **Containerization**: Docker & Docker Compose for local development

## Local Development

### Prerequisites

- Node.js 18+
- PostgreSQL 13+
- Redis
- Docker & Docker Compose (optional, for containerized development)

### Setup

#### Option 1: Docker Compose (Recommended)

1. Clone the repository:

   ```bash
   git clone https://github.com/ngocnhu100/bus-ticket-booking-system.git
   cd bus-ticket-booking-system/backend
   ```

2. Set up environment variables:

   - Copy `.env` and update values (DB credentials, JWT secrets, Google Client ID, SendGrid API key)

3. Start all services with Docker Compose:

   ```bash
   docker-compose up --build
   ```

4. The services will be available at:
   - API Gateway: http://localhost:3000
   - Auth Service: http://localhost:3001
   - Notification Service: http://localhost:3003
   - PostgreSQL: localhost:5432
   - Redis: localhost:6379

#### Option 2: Manual Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/ngocnhu100/bus-ticket-booking-system.git
   cd bus-ticket-booking-system
   ```

2. Install dependencies for all services:

   ```bash
   # API Gateway (main backend)
   cd backend
   npm install

   # Auth Service
   cd services/auth-service
   npm install

   # Notification Service
   cd ../notification-service
   npm install
   ```

3. Set up environment variables:

   - Copy `.env` files to each service directory and update values

4. Set up database:

   - Create PostgreSQL database: `bus_ticket_dev`
   - Run migrations from `backend/sql/` directory

5. Start services:

   - **PostgreSQL**: Start your PostgreSQL server
   - **Redis**: Run the startup script from backend directory:

     ```bash
     # Windows
     .\scripts\start-redis.bat

     # Linux/Mac
     ./scripts/start-redis.sh
     ```

   - **API Gateway**: `cd backend && npm run dev`
   - **Auth Service**: `cd backend/services/auth-service && npm run dev`
   - **Notification Service**: `cd backend/services/notification-service && npm run dev`

6. Test health checks:
   ```bash
   curl http://localhost:3000/health  # API Gateway
   curl http://localhost:3001/health  # Auth Service
   curl http://localhost:3003/health  # Notification Service
   ```

### API Endpoints

All API requests go through the API Gateway at `http://localhost:3000`. The gateway routes requests to the appropriate microservice.

#### Authentication

All auth endpoints are proxied to the auth service:

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login with email/phone
- `POST /auth/oauth/google` - Google OAuth login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout
- `GET /auth/verify-email` - Verify email with token
- `POST /auth/resend-verification` - Resend verification email
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password with token

#### Dashboard

- `GET /dashboard/summary` - Summary metrics
- `GET /dashboard/activity` - Recent activities
- `GET /dashboard/stats` - Statistics (role-based)
- `GET /dashboard/admin-data` - Admin-only data

#### Service Health Checks

- `GET /health` - API Gateway health

### Authentication & Authorization Design

#### Token Handling

- **Access Token**: Short-lived (15 min), used for API access
- **Refresh Token**: Long-lived (7 days), stored in Redis for revocation
- **Storage**: Tokens sent in Authorization header; refresh tokens server-side only
- **Choice**: JWT over sessions for stateless, scalable auth

#### Roles & Enforcement

- **Roles**: 'passenger' (default), 'admin'
- **Server-Side**: Middleware checks JWT payload for role; 403 for insufficient access
- **Client-Side**: Frontend should use route guards and hide UI based on role (not implemented here)

#### External Setup

- **Google OAuth**: Obtain Client ID/Secret from Google Cloud Console, set in `.env`
- **Database**: PostgreSQL with connection pooling
- **Redis**: For refresh token storage

### Decisions & Tradeoffs

- **Microservices Architecture**: Proper separation with API Gateway proxying vs monolithic implementation
- **JWT vs Sessions**: JWT chosen for stateless auth, but requires refresh logic for security
- **Password Hashing**: bcrypt with salt rounds 12 for security
- **Role-Based Auth**: Simple roles over scopes for this assignment; extensible
- **Mock Data**: Dashboard uses mock data; replace with real DB queries later
- **Code Organization**: Removed duplication by implementing proper service boundaries

## Testing

Run the test suite for individual services:

```bash
# Auth Service tests
cd backend/services/auth-service
npm test

# API Gateway tests (when implemented)
cd ../../api-gateway
npm test
```

Tests cover:

- Authentication endpoints (register, login, Google OAuth, refresh, logout)
- Authorization middleware (role-based access control)
- Dashboard data APIs (summary, activity, stats with role filtering)

All tests use mocked dependencies for fast, reliable execution.

## Deployment

The backend is deployed on Railway. Live URL: [To be added after deployment]

### Deployment Steps

1. Connect GitHub repo to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on push to main branch
4. Database: Use Railway PostgreSQL
5. Redis: Use Railway Redis

### Environment Variables

#### API Gateway (.env)

```
NODE_ENV=development
PORT=3000
AUTH_SERVICE_URL=http://localhost:3001
NOTIFICATION_SERVICE_URL=http://localhost:3003
```

#### Auth Service (.env)

```
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://postgres:password@localhost:5432/bus_ticket_dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
GOOGLE_CLIENT_ID=your-google-client-id
NOTIFICATION_SERVICE_URL=http://localhost:3003
```

#### Notification Service (.env)

```
NODE_ENV=development
PORT=3003
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@busticket.com
FRONTEND_URL=http://localhost:5173
```

#### Docker Environment Variables

For Docker Compose deployment, set these in your shell or create a `.env` file in the backend directory:

```
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
GOOGLE_CLIENT_ID=your-google-client-id
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@busticket.com
FRONTEND_URL=http://localhost:5173
```
