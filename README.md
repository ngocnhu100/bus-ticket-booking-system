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
├── api-gateway
└── services/                # Microservices
    ├── auth-service/        # Auth business logic
    └── notification-service/ # Manages email notifications
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

7. **Run tests**:

   ```bash
   # API Gateway tests
   cd backend/api-gateway
   npm test

   # Auth Service tests
   cd ../services/auth-service
   npm test
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

- `GET /dashboard/summary` - Summary metrics (authenticated users)
- `GET /dashboard/activity` - Recent user activities (authenticated users)
- `GET /dashboard/passenger-profile` - Passenger profile data (passengers only)
- `GET /dashboard/upcoming-trips` - Upcoming trips (passengers only)
- `GET /dashboard/trip-history` - Trip history (passengers only)
- `GET /dashboard/payment-history` - Payment history (passengers only)
- `GET /dashboard/notifications` - User notifications (passengers only)
- `GET /dashboard/stats` - General statistics (admin only)
- `GET /dashboard/admin/stats` - Admin statistics (admin only)
- `GET /dashboard/admin/bookings-trend` - Bookings trend data (admin only)
- `GET /dashboard/admin/top-routes` - Top performing routes (admin only)
- `GET /dashboard/admin/recent-bookings` - Recent bookings (admin only)

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

## Layout & Design System

### Global Theme

- **Color Tokens**: Primary (`#007bff`), Secondary (`#6c757d`), Surface (`#ffffff`), Error (`#dc3545`), Success (`#28a745`). Defined in `frontend/tailwind.config.ts`.
- **Typography Scale**: H1 (2rem, bold), Body (1rem), Caption (0.875rem). Uses Inter font from Google Fonts.
- **Spacing Scale**: Sm (0.5rem), Md (1rem), Lg (1.5rem). Applied via Tailwind utilities.

### Reusable Components

- **AppShell**: Layout wrapper with header (nav + logo), sidebar (role-based menu), content area, and footer. Responsive with Tailwind breakpoints.
- **Card**: Container for widgets (e.g., `border rounded-lg p-4`).
- **Button**: Variants (primary, secondary) with hover states.
- **FormField**: Input wrapper with labels, validation errors.
- **Theme Switcher**: Toggle between light/dark modes (stored in localStorage).

### Implementation

- **Framework**: Tailwind CSS for utility-first styling. Components in `frontend/src/components` are modular with props (e.g., `Button` accepts `variant`, `size`). Designed for reusability across pages.
- **Responsiveness**: Mobile-first design; AppShell collapses sidebar on small screens.

## Dashboard

### Implementation

- **Widgets**:
  - SummaryCards: Displays booking count, revenue (admins see totals; passengers see personal stats).
  - ActivityList: Recent user actions (filtered by role).
  - TripHistory: Upcoming trips (passengers only).
- **Interactivity**: Widgets fetch data from API. Real-time updates via Tanstack Query polling.
- **Role Adaptation**: Admins see extra widgets (e.g., admin stats via `/dashboard/admin/stats`); passengers see personalized data. Enforced via `AuthContext` and conditional rendering.
- **Data Handling**: API responses are typed (TypeScript interfaces) and cached. Error states show fallbacks.

### Features

- Responsive grid layout using Tailwind CSS.
- Loading states and error handling for API calls.

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

# API Gateway tests
cd ../../api-gateway
npm test
```

Tests cover:

- Authentication endpoints (register, login, Google OAuth, refresh, logout)
- Authorization middleware (role-based access control)
- Dashboard data APIs (summary, activity, stats with role filtering)

All tests use mocked dependencies for fast, reliable execution.

## Deployment

- The frontend is deployed on Vercel. Live URL: https://bus-ticket-booking-system-neon.vercel.app
- The backend is deployed on Digital Ocean. Live URL: https://api.quad-n.me
