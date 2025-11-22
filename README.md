# Bus Ticket Booking System

## Overview

This is Assignment 1 for the course, building the foundational authentication, authorization, and dashboard components for a bus ticket booking system. The project demonstrates secure auth flows, role-based access, and data APIs for a dashboard.

## Features

- **Authentication**: Email/password signup/login, Google OAuth integration
- **Authorization**: Role-based access (passenger, admin)
- **Dashboard**: Data endpoints for summary, activity, and stats
- **API**: RESTful endpoints following the provided specification

## Tech Stack

- **Backend**: Node.js, Express.js, PostgreSQL, Redis
- **Auth**: JWT (Access + Refresh tokens)
- **Testing**: Jest, Supertest

## Local Development

### Prerequisites

- Node.js 18+
- PostgreSQL 13+
- Redis

### Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/ngocnhu100/bus-ticket-booking-system.git
   cd bus-ticket-booking-system
   ```

2. Install dependencies:

   ```bash
   cd backend
   npm install
   ```

3. Set up environment variables:

   - Copy `.env` and update values (DB credentials, JWT secrets, Google Client ID)

4. Set up database:

   - Create PostgreSQL database: `bus_ticket_dev`
   - Run migration: `psql -U postgres -d bus_ticket_dev -f sql/001_create_users_table.sql`

5. Start services:

   - **PostgreSQL**: Start your PostgreSQL server
   - **Redis**: Run the startup script from backend directory:

     ```bash
     # Windows
     .\scripts\start-redis.bat

     # Linux/Mac
     ./scripts/start-redis.sh
     ```

   - **Backend**: `npm run dev` (runs on port 3000)

6. Test health check:
   ```bash
   curl http://localhost:3000/health
   ```

### API Endpoints

#### Authentication

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login with email/phone
- `POST /auth/oauth/google` - Google OAuth login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout

#### Dashboard

- `GET /dashboard/summary` - Summary metrics
- `GET /dashboard/activity` - Recent activities
- `GET /dashboard/stats` - Statistics (role-based)
- `GET /dashboard/admin-data` - Admin-only data

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

- **JWT vs Sessions**: JWT chosen for stateless auth, but requires refresh logic for security
- **Password Hashing**: bcrypt with salt rounds 12 for security
- **Role-Based Auth**: Simple roles over scopes for this assignment; extensible
- **Mock Data**: Dashboard uses mock data; replace with real DB queries later

## Testing

Run the test suite:

```bash
cd backend
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

```
NODE_ENV=production
PORT=3001
DB_HOST=...
DB_PORT=5432
DB_NAME=...
DB_USER=...
DB_PASSWORD=...
REDIS_HOST=...
REDIS_PORT=6379
JWT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

## Next Steps

See `NEXT_STEPS.md` for future enhancements.
