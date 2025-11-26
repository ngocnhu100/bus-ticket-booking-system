## Overview

This project is a bus ticket booking system built as Assignment 1 for a course, focusing on secure authentication, role-based authorization, and dashboard features. It uses a microservices architecture to handle user management, notifications, and API routing. The backend is implemented with Node.js/Express, while the frontend uses Vite/React with Tanstack Query for state management.

Key features include:

- User registration and login (email/password, Google OAuth)
- Role-based access (passenger and admin)
- Email verification and password reset via SendGrid
- Dashboards for passengers (trip history, profile, payments, notifications) and admins (stats, bookings)
- Protected routes and personalized data display

## Architecture

The system follows a microservices pattern:

- **API Gateway** (Port 3000): Proxies requests to services and handles dashboard endpoints.
- **Auth Service** (Port 3001): Manages authentication, JWT tokens, and user data.
- **Notification Service** (Port 3003): Sends emails for verification and resets.
- **PostgreSQL** (Port 5432): Stores user and business data.
- **Redis** (Port 6379): Caches refresh tokens and sessions.

Frontend routes are protected using React Context for auth state and React Router for navigation.

```
backend/
├── api-gateway/             # Entry point and proxy
├── auth-service/            # Auth logic
├── notification-service/    # Email handling
frontend/
├── src/api/                 # API clients (auth.js)
├── src/context/             # AuthContext.tsx
├── src/pages/               # Login, dashboards, etc.
├── src/components/          # Layouts, protected routes
```

## Tech Stack

- **Backend**: Node.js, Express.js, PostgreSQL, Redis, JWT, bcrypt, SendGrid
- **Frontend**: Vite/React, React Router, Tanstack Query, Shadcn/UI, Tailwind CSS
- **Testing**: Jest, Supertest
- **Containerization**: Docker & Docker Compose

## How to Run the App Locally

### Prerequisites

- Node.js 18+
- PostgreSQL 13+
- Redis 6+
- Docker & Docker Compose (recommended for easy setup)
- Git

### Installation

1. Clone the repository:

   ```
   git clone <repository-url>
   cd bus-ticket-booking-system
   ```

2. Install backend dependencies (for all services):
   ```
   cd backend
   npm install
   cd ../frontend
   npm install
   ```

### Development Start

#### Using Docker Compose (Recommended for Full Stack)

1. Create a `.env` file in `backend/` with required variables (see Environment Variables section).

2. Start services:

   ```
   docker-compose up -d
   ```

   - This starts PostgreSQL, Redis, API Gateway, Auth Service, and Notification Service.
   - Access API at `http://localhost:3000`

3. Start frontend:
   ```
   cd frontend
   npm run dev
   ```
   - Access app at `http://localhost:5173`

#### Manual Start (Without Docker)

1. Start PostgreSQL and Redis locally (or use cloud instances).

2. Set environment variables in `.env` files for each backend service.

3. Start backend services:

   - API Gateway: `cd backend/api-gateway && npm start`
   - Auth Service: `cd backend/auth-service && npm start`
   - Notification Service: `cd backend/notification-service && npm start`

4. Start frontend: `cd frontend && npm run dev`

### Build for Production

1. Backend: Each service can be built individually (though Express doesn't require build; use PM2 or similar for production).

   ```
   # Example for API Gateway
   cd backend/api-gateway
   npm run build  # If using TypeScript; otherwise, skip
   ```

2. Frontend:
   ```
   cd frontend
   npm run build
   ```
   - Output in `dist/` – serve with Nginx or similar.

## Authentication and Authorization Design

### Authentication

- **Login/Register**: Uses email/phone + password (hashed with bcrypt). Google OAuth is integrated for social login.
- **Tokens**: JWT-based.
  - **Access Token**: Short-lived (e.g., 15m), signed with `JWT_SECRET`, contains user claims (id, role).
  - **Refresh Token**: Long-lived (e.g., 7d), stored in Redis for revocation, used to generate new access tokens.
- **Storage**:
  - Access Token: In-memory (JS variable `accessTokenInMemory` in `frontend/src/api/auth.js`) for security (avoids XSS).
  - Refresh Token: localStorage (key: `refreshToken`) for persistence across reloads.
  - User Info (id, name, email, role): localStorage (key: `user`) for quick access and role-based rendering.
- **Flow**:
  1. Login → Auth Service verifies credentials → Issues tokens + user data.
  2. Frontend stores tokens/user via `storeTokens` and `AuthContext`.
  3. API calls include `Authorization: Bearer <accessToken>`.
  4. On expiration, refresh endpoint uses refresh token to get new access token.

### Authorization

- **Roles**: Stored in DB (`users` table, `role` column: `'passenger'` or `'admin'`). Defaults to `'passenger'`.
- **Representation**: JWT payload includes `role`. No scopes; simple role-based checks.
- **Backend**: Middleware (`authenticate` verifies JWT via Auth Service; `authorize(roles)` checks `req.user.role`).
- **Frontend**: `AuthContext` holds role; Protected Routes (`PassengerRoute`, `AdminRoute`) check `user.role` and redirect if mismatch.
- **Redirect**: Post-login, `AuthContext.login` navigates based on role (`/dashboard` for passenger, `/admin` for admin).

## Backend or External Setup Required

### Backend Setup

- **Database**: Run PostgreSQL migrations (if any) or ensure `users` table exists with columns: `user_id`, `email`, `phone`, `password_hash`, `full_name`, `role`, `email_verified`, `failed_login_attempts`, `account_locked_until`.
- **Redis**: Required for refresh tokens; configure `REDIS_URL`.
- **Environment Variables**: See sample in provided README. Critical: `JWT_SECRET`, `SENDGRID_API_KEY`, `GOOGLE_CLIENT_ID`.

### External Services

- **Google OAuth**:
  - Create a Google Cloud project → Enable Google+ API → Create OAuth 2.0 Client ID (web app type).
  - Set `Authorized redirect URIs`: `http://localhost:5173/auth/google/callback`.
  - Add `GOOGLE_CLIENT_ID` to Auth Service `.env`.
- **SendGrid**: For emails (verification, resets).
  - Sign up for SendGrid → Get API key → Set `SENDGRID_API_KEY` and `EMAIL_FROM` in Notification Service `.env`.
  - Verify domain/sender for production.

No other externals required for core functionality.

## Decisions and Tradeoffs

- **Microservices Architecture**: Chosen for scalability and separation of concerns (auth vs notifications). Tradeoff: Increased complexity in local dev (multiple services) vs monolith simplicity. Mitigated by Docker Compose for easy startup.
- **JWT for Auth**: Stateless, scalable. Access in memory for security (prevents XSS); refresh in localStorage for UX (auto-refresh on reload). Tradeoff: localStorage vulnerable to XSS if not careful, but mitigated by no sensitive data in user object.
- **Role-Based over Scope-Based**: Simpler for assignment (passenger/admin). Easy to extend to scopes later. Tradeoff: Less granular than RBAC with permissions, but sufficient for current needs.
- **Frontend State Management**: React Context + localStorage for auth. Tradeoff: Simpler than Redux/Zustand, but less scalable for complex state. Tanstack Query used for data fetching to avoid over-fetching.
- **Protected Routes**: Client-side checks (role in context) + server-side middleware. Tradeoff: Client can be bypassed, but server enforces security.
- **No Additional Packages**: Relied on built-in libs where possible (e.g., no extra ORM like Prisma; raw SQL in repositories). Tradeoff: More code, but lightweight.
- **Error Handling**: Custom error codes (e.g., AUTH_001). Tradeoff: Verbose logs, but aids debugging.
- **Testing/Deployment**: Focused on local Docker for dev; Railway for prod. Tradeoff: Easy setup, but requires env vars management.
  > > > > > > > origin/main
