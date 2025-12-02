# Bus Ticket Booking System

Hệ thống đặt vé xe buýt trực tuyến với kiến trúc microservices, cung cấp giải pháp toàn diện cho việc tìm kiếm, đặt vé và quản lý chuyến xe.

## 🏗️ Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                        │
│                      Port: 5173 (Vite Dev)                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway (Express)                      │
│                         Port: 3000                              │
│  • Authentication Middleware                                    │
│  • Request Routing & Proxying                                   │
│  • Rate Limiting & Security                                     │
└──────┬──────────────────┬──────────────────┬────────────────────┘
       │                  │                  │
       ▼                  ▼                  ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────────┐
│Auth Service │   │Trip Service │   │Notification     │
│Port: 3001   │   │Port: 3005   │   │Service          │
│             │   │             │   │Port: 3003       │
└──────┬──────┘   └──────┬──────┘   └─────────────────┘
       │                  │
       └──────┬───────────┘
              │
    ┌─────────┴──────────┐
    ▼                    ▼
┌──────────┐      ┌─────────────┐
│PostgreSQL│      │Redis Cache  │
│Port: 5432│      │Port: 6379   │
└──────────┘      └─────────────┘
```

## 📦 Microservices

### 1. API Gateway (Port: 3000)

- **Chức năng**: Điểm truy cập duy nhất cho toàn bộ hệ thống
- **Nhiệm vụ**:
  - Route requests đến các microservices phù hợp
  - Authentication & Authorization middleware
  - Request/Response logging
  - CORS configuration
  - Error handling & response formatting
- **Technology**: Express.js, Axios, JWT

### 2. Auth Service (Port: 3001)

- **Chức năng**: Quản lý xác thực và phân quyền người dùng
- **Nhiệm vụ**:
  - User registration & login
  - JWT token generation & validation
  - Google OAuth integration
  - Password reset & email verification
  - Role-based access control (RBAC)
  - Session management với Redis
- **Technology**: Express.js, bcrypt, JWT, Google Auth Library

### 3. Trip Service (Port: 3005)

- **Chức năng**: Quản lý và tìm kiếm chuyến xe
- **Nhiệm vụ**:
  - Advanced trip search với multiple filters
  - Sorting (price, time, duration)
  - Pagination
  - Redis caching cho performance
  - Database indexing optimization
- **Technology**: Express.js, PostgreSQL, Redis
- **Chi tiết**: [Trip Service Documentation](./backend/services/trip-service/README.md)

### 4. Notification Service (Port: 3003)

- **Chức năng**: Gửi thông báo và email
- **Nhiệm vụ**:
  - Email notifications
  - Booking confirmations
  - Password reset emails
  - System alerts
- **Technology**: Express.js, SendGrid

## ✨ Tính năng chính

- ✅ User registration và login (email/password, Google OAuth)
- ✅ Role-based access control (passenger và admin)
- ✅ Email verification và password reset
- ✅ Dashboards cho passengers (trip history, profile, payments, notifications)
- ✅ Admin dashboards (stats, bookings management)
- ✅ Advanced trip search với multiple filters
- ✅ Trip sorting và pagination
- ✅ Redis caching cho performance
- ✅ Protected routes và personalized data display

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js, PostgreSQL, Redis, JWT, bcrypt, SendGrid
- **Frontend**: Vite/React, React Router, Tanstack Query, Shadcn/UI, Tailwind CSS, TypeScript
- **Testing**: Jest, Supertest, Vitest
- **Containerization**: Docker & Docker Compose
- **Code Quality**: Husky, lint-staged, ESLint, Prettier

## 🚀 Cài đặt và Chạy hệ thống

### Yêu cầu hệ thống

- Node.js >= 16.x
- PostgreSQL >= 13.x
- Redis >= 6.x
- Docker & Docker Compose (tùy chọn)
- Git

### 1. Cài đặt Dependencies

#### Root level (Husky & Lint-staged)

```bash
npm install
```

#### Backend services

```bash
cd backend
npm install

# Cài đặt cho từng service
cd api-gateway && npm install && cd ..
cd services/auth-service && npm install && cd ../..
cd services/trip-service && npm install && cd ../..
cd services/notification-service && npm install && cd ../..
```

#### Frontend

```bash
cd frontend
npm install
```

### 2. Cấu hình Environment Variables

#### Backend/.env

```env
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bus_ticket_dev
DB_USER=postgres
DB_PASSWORD=postgres

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Service URLs
AUTH_SERVICE_URL=http://localhost:3001
TRIP_SERVICE_URL=http://localhost:3005
NOTIFICATION_SERVICE_URL=http://localhost:3003

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# SendGrid (for email notifications)
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=noreply@busticket.com

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

#### Frontend/.env

```env
VITE_API_URL=http://localhost:3000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### 3. Khởi tạo Database

```bash
cd backend

# Chạy SQL migrations
psql -U postgres -d bus_ticket_dev -f sql/001_create_users_table.sql
psql -U postgres -d bus_ticket_dev -f sql/002_add_email_verification.sql
psql -U postgres -d bus_ticket_dev -f sql/003_add_password_reset.sql
psql -U postgres -d bus_ticket_dev -f sql/004_add_failed_login_attempts.sql
psql -U postgres -d bus_ticket_dev -f sql/005_seed_users.sql
psql -U postgres -d bus_ticket_dev -f sql/006_create_trips_table_with_indexes.sql
```

### 4. Chạy Services (Development)

#### Option A: Chạy thủ công từng service

**Terminal 1 - API Gateway:**

```bash
cd backend/api-gateway
npm run dev
```

**Terminal 2 - Auth Service:**

```bash
cd backend/services/auth-service
npm run dev
```

**Terminal 3 - Trip Service:**

```bash
cd backend/services/trip-service
npm run dev
```

**Terminal 4 - Notification Service:**

```bash
cd backend/services/notification-service
npm run dev
```

**Terminal 5 - Frontend:**

```bash
cd frontend
npm run dev
```

#### Option B: Chạy bằng Docker Compose

```bash
cd backend
docker-compose up --build
```

Sau đó chạy frontend riêng:

```bash
cd frontend
npm run dev
```

### 5. Kiểm tra Health Check

```bash
# API Gateway
curl http://localhost:3000/health

# Auth Service
curl http://localhost:3001/health

# Trip Service
curl http://localhost:3005/health

# Notification Service
curl http://localhost:3003/health
```

## 🧪 Testing

### Chạy toàn bộ tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Chạy tests từng service

```bash
# Auth Service
cd backend/services/auth-service
npm test

# Trip Service
cd backend/services/trip-service
npm test

# API Gateway
cd backend/api-gateway
npm test
```

### Frontend Tests

```bash
cd frontend

# All tests
npm test

# With coverage
npm run test:coverage

# With UI
npm run test:ui
```

**Frontend Test Coverage (35/35 passing):**

- Login.test.jsx (17 tests): Rendering, validation, login flow, Google OAuth, error handling, navigation
- Register.test.jsx (18 tests): Rendering, validation, registration flow, Google OAuth, error handling, navigation
- Tools: Vitest, React Testing Library, jsdom
- All external dependencies mocked (no backend/Google SDK required)
- Execution time: ~15s

### Build for Production

**Frontend:**

```bash
cd frontend
npm run build
```

Output in `dist/` – serve với Nginx hoặc tương tự.

**Backend:**
Each service có thể build riêng (Express không yêu cầu build; sử dụng PM2 hoặc tương tự cho production).

## 🔐 Authentication and Authorization Design

### Authentication

- **Login/Register**: Sử dụng email/phone + password (hashed với bcrypt). Google OAuth được tích hợp cho social login.
- **Tokens**: JWT-based.
  - **Access Token**: Short-lived (e.g., 15m), signed với `JWT_SECRET`, chứa user claims (id, role).
  - **Refresh Token**: Long-lived (e.g., 7d), stored trong Redis để revocation, dùng để generate new access tokens.
- **Storage**:
  - Access Token: In-memory (JS variable `accessTokenInMemory` trong `frontend/src/api/auth.js`) cho security (tránh XSS).
  - Refresh Token: localStorage (key: `refreshToken`) cho persistence across reloads.
  - User Info (id, name, email, role): localStorage (key: `user`) cho quick access và role-based rendering.
- **Flow**:
  1. Login → Auth Service verifies credentials → Issues tokens + user data.
  2. Frontend stores tokens/user via `storeTokens` và `AuthContext`.
  3. API calls include `Authorization: Bearer <accessToken>`.
  4. On expiration, refresh endpoint sử dụng refresh token để get new access token.

### Authorization

- **Roles**: Stored trong DB (`users` table, `role` column: `'passenger'` hoặc `'admin'`). Defaults to `'passenger'`.
- **Representation**: JWT payload includes `role`. Simple role-based checks.
- **Backend**: Middleware (`authenticate` verifies JWT via Auth Service; `authorize(roles)` checks `req.user.role`).
- **Frontend**: `AuthContext` holds role; Protected Routes (`PassengerRoute`, `AdminRoute`) check `user.role` và redirect nếu mismatch.
- **Redirect**: Post-login, `AuthContext.login` navigates based on role (`/dashboard` cho passenger, `/admin` cho admin).

## 🏗️ Cấu trúc thư mục

```
bus-ticket-booking-system/
├── backend/
│   ├── api-gateway/                    # API Gateway service
│   │   ├── src/
│   │   │   ├── index.js               # Main gateway server
│   │   │   └── authMiddleware.js      # Auth middleware
│   │   ├── tests/                     # Gateway tests
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── services/
│   │   ├── auth-service/              # Authentication service
│   │   │   ├── src/
│   │   │   │   ├── index.js           # Server entry
│   │   │   │   ├── routes/            # API routes
│   │   │   │   ├── controllers/       # Request handlers
│   │   │   │   ├── services/          # Business logic
│   │   │   │   ├── middleware/        # Custom middleware
│   │   │   │   └── config/            # Configuration
│   │   │   ├── tests/
│   │   │   ├── Dockerfile
│   │   │   └── package.json
│   │   │
│   │   ├── trip-service/              # Trip management service
│   │   │   ├── src/
│   │   │   │   ├── index.js
│   │   │   │   ├── routes/
│   │   │   │   ├── controllers/
│   │   │   │   ├── services/
│   │   │   │   ├── middleware/
│   │   │   │   └── config/
│   │   │   ├── tests/
│   │   │   └── package.json
│   │   │
│   │   └── notification-service/      # Notification service
│   │       ├── src/
│   │       └── package.json
│   │
│   ├── sql/                           # Database migrations
│   │   ├── 001_create_users_table.sql
│   │   ├── 002_add_email_verification.sql
│   │   └── ...
│   │
│   ├── scripts/                       # Utility scripts
│   ├── docker-compose.yml             # Docker dev environment
│   ├── docker-compose.prod.yml        # Docker production
│   └── package.json
│
├── frontend/                          # React frontend
│   ├── src/
│   │   ├── pages/                     # Page components
│   │   ├── components/                # Reusable components
│   │   ├── api/                       # API client
│   │   ├── context/                   # React Context
│   │   ├── hooks/                     # Custom hooks
│   │   ├── lib/                       # Utilities
│   │   └── types/                     # TypeScript types
│   ├── tests/                         # Frontend tests
│   ├── vite.config.ts                 # Vite configuration
│   └── package.json
│
├── docs/                              # Documentation
│   ├── API_TEMPLATE.md                # API documentation template
│   └── DEVELOPMENT_GUIDELINES.md      # Development guidelines
│
├── design/                            # Design files
│   ├── admin/
│   ├── trip/
│   └── user/
│
├── .husky/                            # Git hooks
├── package.json                       # Root package.json
└── README.md                          # This file
```

## 📝 Code Quality

### Linting

```bash
# Frontend
npm run lint:frontend

# Backend
npm run lint:backend
```

### Formatting

```bash
# Frontend
npm run format:frontend

# Backend
npm run format:backend
```

### Pre-commit Hooks

Project sử dụng Husky và lint-staged để tự động chạy linting và formatting trước mỗi commit.

## 🚢 Deployment

### Frontend

Frontend application được deploy trên Vercel và accessible tại: [https://bus-ticket-booking-system.vercel.app](https://bus-ticket-booking-system.vercel.app)

### Backend

Backend microservices (API Gateway, Auth Service, Notification Service, Trip Service) được deploy trên DigitalOcean sử dụng Docker containers và accessible tại: https://api.quad-n.me

### Docker Production Build

```bash
cd backend
docker-compose -f docker-compose.prod.yml up --build -d
```

### Environment Variables cho Production

Đảm bảo set các biến môi trường sau trong production:

- `NODE_ENV=production`
- `JWT_SECRET` - Strong secret key
- `DB_HOST`, `DB_USER`, `DB_PASSWORD` - Production database
- `REDIS_HOST` - Production Redis
- `FRONTEND_URL` - Production frontend URL
- `SENDGRID_API_KEY` - SendGrid API key
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` - Google OAuth

### Health Monitoring

Tất cả services đều có `/health` endpoint để monitoring:

```bash
curl http://your-domain.com/health
curl http://your-domain.com/auth/health
curl http://your-domain.com/trips/health
```

## 🔧 Backend và External Setup

### Backend Setup

- **Database**: Chạy PostgreSQL migrations hoặc ensure `users` table exists với columns: `user_id`, `email`, `phone`, `password_hash`, `full_name`, `role`, `email_verified`, `failed_login_attempts`, `account_locked_until`.
- **Redis**: Required cho refresh tokens; configure `REDIS_URL`.
- **Environment Variables**: See sample trong provided README. Critical: `JWT_SECRET`, `SENDGRID_API_KEY`, `GOOGLE_CLIENT_ID`.

### External Services

- **Google OAuth**:
  - Create Google Cloud project → Enable Google+ API → Create OAuth 2.0 Client ID (web app type).
  - Set `Authorized redirect URIs`: `http://localhost:5173/auth/google/callback`.
  - Add `GOOGLE_CLIENT_ID` to Auth Service `.env`.
- **SendGrid**: Cho emails (verification, resets).
  - Sign up cho SendGrid → Get API key → Set `SENDGRID_API_KEY` và `EMAIL_FROM` trong Notification Service `.env`.
  - Verify domain/sender cho production.

## 🔒 Security Features

- ✅ JWT-based authentication
- ✅ Password hashing với bcrypt
- ✅ Role-based access control (RBAC)
- ✅ CORS configuration
- ✅ Helmet.js security headers
- ✅ Rate limiting
- ✅ Input validation với Joi
- ✅ SQL injection prevention
- ✅ XSS protection

## ⚡ Performance Optimizations

- ✅ Redis caching cho frequently accessed data
- ✅ Database indexing cho search queries
- ✅ Connection pooling
- ✅ Response compression
- ✅ Pagination cho large datasets
- ✅ Query optimization

## 🎯 Decisions and Tradeoffs

- **Microservices Architecture**: Chosen cho scalability và separation of concerns (auth vs notifications). Tradeoff: Increased complexity trong local dev (multiple services) vs monolith simplicity. Mitigated bởi Docker Compose cho easy startup.
- **JWT for Auth**: Stateless, scalable. Access in memory cho security (prevents XSS); refresh trong localStorage cho UX (auto-refresh on reload). Tradeoff: localStorage vulnerable to XSS nếu không careful, nhưng mitigated bởi no sensitive data trong user object.
- **Role-Based over Scope-Based**: Simpler cho assignment (passenger/admin). Easy để extend to scopes later. Tradeoff: Less granular than RBAC with permissions, nhưng sufficient cho current needs.
- **Frontend State Management**: React Context + localStorage cho auth. Tradeoff: Simpler than Redux/Zustand, nhưng less scalable cho complex state. Tanstack Query used cho data fetching để avoid over-fetching.
- **Protected Routes**: Client-side checks (role trong context) + server-side middleware. Tradeoff: Client có thể bypassed, nhưng server enforces security.
- **Testing/Deployment**: Leverages Docker Compose cho efficient local development setups và DigitalOcean cho production deployment.

## 📚 Tài liệu bổ sung

- [API Documentation Template](./docs/API_TEMPLATE.md)
- [Development Guidelines](./docs/DEVELOPMENT_GUIDELINES.md)
- [Trip Service Documentation](./backend/services/trip-service/README.md)
- [Trip Service Deployment Guide](./backend/services/trip-service/DEPLOYMENT_GUIDE.md)

## 🤝 Contributing

1. Đọc [Development Guidelines](./docs/DEVELOPMENT_GUIDELINES.md)
2. Fork repository
3. Tạo feature branch: `git checkout -b feature/amazing-feature`
4. Commit changes: `git commit -m 'feat: add amazing feature'`
5. Push to branch: `git push origin feature/amazing-feature`
6. Tạo Pull Request

## 📄 License

This project is private and proprietary.

## 👥 Team

- Backend Team: Microservices architecture & API development
- Frontend Team: React UI/UX development
- DevOps Team: Infrastructure & deployment

## 📞 Support

For issues and questions:

- Create an issue in the repository
- Contact the development team
- Check documentation trong `/docs` folder

---

**Built with ❤️ by the Bus Ticket Booking Team**
