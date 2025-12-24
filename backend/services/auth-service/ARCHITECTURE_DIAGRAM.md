# Admin User Management - Architecture Overview

## 🏛️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Application                       │
│                     (Frontend / API Consumer)                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP Requests
                             │ Authorization: Bearer <token>
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API Gateway (Port 3000)                   │
├─────────────────────────────────────────────────────────────────┤
│  • CORS handling                                                 │
│  • Request routing                                               │
│  • Token forwarding                                              │
│  • Error handling                                                │
│                                                                   │
│  Routes:                                                         │
│  /auth/*     → auth-service:3001                                │
│  /admin/*    → auth-service:3001/admin/*    ← NEW!             │
│  /trips/*    → trip-service:3002                                │
│  /bookings/* → booking-service:3004                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Proxy /admin/* requests
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Auth Service (Port 3001)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Middleware Layer                            │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │  • authenticate()  - JWT token verification             │   │
│  │  • authorize(['admin'])  - Role-based access control    │   │
│  │  • Token blacklist check                                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                             │                                     │
│                             ▼                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Admin Controller Layer                      │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │  POST   /admin/accounts              - Create admin     │   │
│  │  GET    /admin/accounts              - List admins      │   │
│  │  GET    /admin/accounts/:id          - Get admin        │   │
│  │  PUT    /admin/accounts/:id          - Update admin     │   │
│  │  POST   /admin/accounts/:id/deactivate                  │   │
│  │  POST   /admin/accounts/:id/reactivate                  │   │
│  │  GET    /admin/stats                 - Statistics       │   │
│  │                                                           │   │
│  │  • Request validation (Joi)                             │   │
│  │  • HTTP response formatting                             │   │
│  │  • Error transformation                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                             │                                     │
│                             ▼                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Admin Service Layer                         │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │  • createAdmin()         - Business logic               │   │
│  │  • getAllAdmins()        - Pagination & filtering       │   │
│  │  • getAdminById()        - Fetch single admin           │   │
│  │  • updateAdmin()         - Update validation            │   │
│  │  • deactivateAdmin()     - Safety checks                │   │
│  │  • reactivateAdmin()     - Password reset               │   │
│  │  • getAdminStats()       - Statistics calculation       │   │
│  │                                                           │   │
│  │  Security:                                               │   │
│  │  • Password hashing (bcrypt, 12 rounds)                 │   │
│  │  • Duplicate email prevention                           │   │
│  │  • Self-deactivation prevention                         │   │
│  │  • Last admin protection                                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                             │                                     │
│                             ▼                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │            Admin Repository Layer                        │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │  • findAllAdmins()       - Paginated queries            │   │
│  │  • findAdminById()       - Single record fetch          │   │
│  │  • findAdminByEmail()    - Email lookup                 │   │
│  │  • createAdmin()         - Insert new admin             │   │
│  │  • updateAdmin()         - Update record                │   │
│  │  • deactivateAdmin()     - Set password NULL            │   │
│  │  • updateAdminPassword() - Password update              │   │
│  │  • countAdmins()         - Statistics                   │   │
│  │  • countActiveAdmins()   - Active count                 │   │
│  │                                                           │   │
│  │  Features:                                               │   │
│  │  • Parameterized queries (SQL injection prevention)     │   │
│  │  • Optimized with indexes                               │   │
│  │  • Case-insensitive search                              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                             │                                     │
└─────────────────────────────┼─────────────────────────────────────┘
                             │
                             │ SQL Queries
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    users Table                           │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │  user_id          UUID PRIMARY KEY                      │   │
│  │  email            VARCHAR(255) UNIQUE                   │   │
│  │  phone            VARCHAR(32) UNIQUE                    │   │
│  │  password_hash    TEXT (NULL = inactive)                │   │
│  │  full_name        VARCHAR(100)                          │   │
│  │  role             VARCHAR(32) ['admin', 'passenger']    │   │
│  │  email_verified   BOOLEAN                               │   │
│  │  phone_verified   BOOLEAN                               │   │
│  │  preferences      JSONB                                 │   │
│  │  created_at       TIMESTAMP                             │   │
│  │  updated_at       TIMESTAMP                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  Indexes:                                                        │
│  • idx_users_role                - Fast role filtering          │
│  • idx_users_role_active         - Active admin queries         │
│  • idx_users_email_lower         - Email search                 │
│  • idx_users_fullname_lower      - Name search                  │
│  • idx_users_admin_created       - Pagination optimization      │
│                                                                   │
│  Views:                                                          │
│  • active_admin_accounts         - Active admins only           │
│                                                                   │
│  Functions:                                                      │
│  • count_active_admins()         - Helper function              │
│  • update_updated_at_column()    - Trigger function             │
└─────────────────────────────────────────────────────────────────┘
```

## 🔐 Authentication & Authorization Flow

```
┌────────────────────────────────────────────────────────────────┐
│ Step 1: User Login                                              │
├────────────────────────────────────────────────────────────────┤
│  Client → POST /auth/login                                     │
│  {                                                              │
│    "email": "admin@example.com",                               │
│    "password": "Admin@123"                                     │
│  }                                                              │
│                                                                  │
│  Auth Service ← validates credentials                          │
│                ← generates JWT token                           │
│                ← returns token with user info                  │
│                                                                  │
│  Response:                                                      │
│  {                                                              │
│    "success": true,                                            │
│    "data": {                                                   │
│      "accessToken": "eyJhbGc...",                              │
│      "user": { "userId": "...", "role": "admin" }              │
│    }                                                            │
│  }                                                              │
└────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────┐
│ Step 2: Admin Request                                           │
├────────────────────────────────────────────────────────────────┤
│  Client → POST /admin/accounts                                 │
│  Headers:                                                       │
│    Authorization: Bearer eyJhbGc...                            │
│  Body:                                                          │
│    { "email": "...", "password": "...", ... }                 │
└────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────┐
│ Step 3: API Gateway Processing                                 │
├────────────────────────────────────────────────────────────────┤
│  • Receives request on /admin/accounts                         │
│  • Forwards to auth-service:3001/admin/accounts               │
│  • Includes Authorization header                               │
└────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────┐
│ Step 4: Authentication Middleware                               │
├────────────────────────────────────────────────────────────────┤
│  authenticate() middleware:                                     │
│  1. Extract Bearer token from Authorization header             │
│  2. Verify JWT signature and expiration                        │
│  3. Check if token is blacklisted                             │
│  4. Decode user info (userId, role, email)                    │
│  5. Attach to req.user                                         │
│                                                                  │
│  If invalid → 401 Unauthorized                                 │
│  If valid → continue to next middleware                        │
└────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────┐
│ Step 5: Authorization Middleware                                │
├────────────────────────────────────────────────────────────────┤
│  authorize(['admin']) middleware:                              │
│  1. Check req.user.role                                        │
│  2. Verify role is in allowed list ['admin']                  │
│                                                                  │
│  If not admin → 403 Forbidden                                  │
│  If admin → continue to controller                             │
└────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────┐
│ Step 6: Request Processing                                      │
├────────────────────────────────────────────────────────────────┤
│  Controller → validates input (Joi)                            │
│  Service → executes business logic                             │
│  Repository → performs database operation                      │
│                                                                  │
│  Result flows back through layers                              │
└────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────┐
│ Step 7: Response                                                │
├────────────────────────────────────────────────────────────────┤
│  {                                                              │
│    "success": true,                                            │
│    "data": { ... },                                            │
│    "message": "Admin account created successfully",           │
│    "timestamp": "2025-12-23T10:00:00.000Z"                    │
│  }                                                              │
└────────────────────────────────────────────────────────────────┘
```

## 📊 Data Flow - Create Admin Example

```
Client
  │
  │ POST /admin/accounts
  │ { email, phone, password, fullName }
  │
  ▼
API Gateway :3000
  │
  │ Forward to auth-service:3001/admin/accounts
  │
  ▼
Auth Service
  │
  ├─► authenticate() → JWT verification ✓
  │
  ├─► authorize(['admin']) → Role check ✓
  │
  ├─► adminController.createAdmin()
  │     │
  │     ├─► Joi validation
  │     │     ├─ Email format ✓
  │     │     ├─ Password strength ✓
  │     │     ├─ Phone format ✓
  │     │     └─ Name length ✓
  │     │
  │     └─► adminService.createAdmin()
  │           │
  │           ├─► Check duplicate email
  │           │     └─► adminRepository.findAdminByEmail()
  │           │           └─► SELECT * FROM users WHERE email = ?
  │           │
  │           ├─► Hash password (bcrypt, 12 rounds)
  │           │
  │           └─► adminRepository.createAdmin()
  │                 │
  │                 └─► INSERT INTO users (...)
  │                       VALUES (email, phone, hash, name, 'admin', ...)
  │
  ▼
PostgreSQL Database
  │
  ├─► Validate constraints (unique email)
  ├─► Insert record
  └─► Return new admin record
  │
  ▼
Response flows back
  │
  └─► 201 Created
      {
        "success": true,
        "data": { userId, email, fullName, ... },
        "message": "Admin account created successfully"
      }
```

## 🗂️ File Organization

```
backend/
│
├── sql/
│   ├── 019_admin_management_indexes.sql     ← Database optimization
│   └── 020_seed_admin_account.sql           ← Default admin creation
│
├── api-gateway/
│   └── src/
│       └── index.js                         ← Routes /admin/* to auth-service
│
└── services/
    └── auth-service/
        │
        ├── src/
        │   │
        │   ├── repositories/
        │   │   └── adminRepository.js       ← Database queries
        │   │
        │   ├── services/
        │   │   └── adminService.js          ← Business logic
        │   │
        │   ├── controllers/
        │   │   └── adminController.js       ← HTTP handlers
        │   │
        │   ├── validators/
        │   │   └── adminValidators.js       ← Input validation
        │   │
        │   ├── index.js                     ← Routes definition
        │   ├── authMiddleware.js            ← Auth & authz (existing)
        │   ├── database.js                  ← DB connection (existing)
        │   └── userRepository.js            ← User operations (existing)
        │
        ├── test-admin-management.js         ← Comprehensive tests
        ├── ADMIN_API_DOCUMENTATION.md       ← API reference
        ├── ADMIN_SETUP_GUIDE.md             ← Setup instructions
        └── IMPLEMENTATION_COMPLETE.md       ← Implementation summary
```

## 🔄 Request/Response Examples

### ✅ Success Response Format
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "email": "admin@example.com",
    "fullName": "John Doe",
    "role": "admin",
    ...
  },
  "message": "Operation completed successfully",
  "timestamp": "2025-12-23T10:00:00.000Z"
}
```

### ❌ Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "ADMIN_001",
    "message": "Admin account with this email already exists"
  },
  "timestamp": "2025-12-23T10:00:00.000Z"
}
```

### 📋 Paginated Response Format
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  },
  "timestamp": "2025-12-23T10:00:00.000Z"
}
```

---

## 🎯 Key Design Decisions

1. **Deactivation vs Deletion**: Accounts are deactivated (password_hash = NULL) rather than deleted for audit trail
2. **Role in Users Table**: Admin and passenger roles share the same table for unified user management
3. **Password Hash as Status**: NULL password_hash indicates inactive account (elegant and efficient)
4. **Self-Protection**: Admins cannot deactivate themselves to prevent lockout
5. **Last Admin Protection**: System requires at least one active admin at all times
6. **Email as Primary Identifier**: Email is required and unique for admin accounts
7. **Auto-verified Email**: Admin accounts created with email_verified=true
8. **Bcrypt with 12 Rounds**: Balance between security and performance
9. **Pagination Max 100**: Prevents excessive data retrieval
10. **Case-insensitive Search**: Better user experience for finding admins

---

This architecture ensures scalability, security, maintainability, and follows microservices best practices! 🚀
