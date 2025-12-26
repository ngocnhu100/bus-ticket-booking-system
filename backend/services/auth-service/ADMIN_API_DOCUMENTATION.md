# Admin User Management API Documentation

## Overview

This document describes the Admin User Management API endpoints implemented in the auth-service. These endpoints allow administrators to manage admin accounts within the system.

## Base URL

```
http://localhost:3000/admin  (via API Gateway)
http://localhost:3001/admin  (direct to auth-service)
```

## Authentication

All admin management endpoints require:

- **Authentication**: Bearer token in `Authorization` header
- **Authorization**: Only users with `role: admin` can access these endpoints

### Headers

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

---

## Endpoints

### 1. Create Admin Account

Create a new admin user account.

**Endpoint**: `POST /admin/accounts`

**Request Body**:

```json
{
  "email": "newadmin@example.com",
  "phone": "0912345678",
  "password": "SecurePass@123",
  "fullName": "John Doe"
}
```

**Validation Rules**:

- `email`: Valid email format, required
- `phone`: 10-15 digits, optional
- `password`: Min 8 chars, must contain uppercase, lowercase, digit, and special character (@$!%\*?&#), required
- `fullName`: 2-100 characters, required

**Success Response** (201):

```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "email": "newadmin@example.com",
    "phone": "0912345678",
    "fullName": "John Doe",
    "role": "admin",
    "emailVerified": true,
    "phoneVerified": false,
    "createdAt": "2025-12-23T10:00:00.000Z",
    "updatedAt": "2025-12-23T10:00:00.000Z"
  },
  "message": "Admin account created successfully",
  "timestamp": "2025-12-23T10:00:00.000Z"
}
```

**Error Responses**:

- `409 Conflict`: Email already exists
- `422 Unprocessable Entity`: Validation error

---

### 2. Get All Admin Accounts

Retrieve paginated list of admin accounts with optional filtering.

**Endpoint**: `GET /admin/accounts`

**Query Parameters**:

- `page` (number, default: 1): Page number
- `limit` (number, default: 10, max: 100): Items per page
- `status` (string, optional): Filter by status (`active` or `inactive`)
- `search` (string, optional): Search by name or email

**Example Request**:

```
GET /admin/accounts?page=1&limit=10&status=active&search=john
```

**Success Response** (200):

```json
{
  "success": true,
  "data": [
    {
      "userId": "uuid",
      "email": "admin@example.com",
      "phone": "0900000001",
      "fullName": "System Administrator",
      "role": "admin",
      "emailVerified": true,
      "phoneVerified": false,
      "isActive": true,
      "createdAt": "2025-12-01T10:00:00.000Z",
      "updatedAt": "2025-12-01T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 15,
    "totalPages": 2
  },
  "timestamp": "2025-12-23T10:00:00.000Z"
}
```

---

### 3. Get Admin Account by ID

Retrieve details of a specific admin account.

**Endpoint**: `GET /admin/accounts/:id`

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "email": "admin@example.com",
    "phone": "0900000001",
    "fullName": "System Administrator",
    "role": "admin",
    "emailVerified": true,
    "phoneVerified": false,
    "isActive": true,
    "preferences": {
      "notifications": {
        "bookingConfirmations": {
          "email": true,
          "sms": false
        }
      }
    },
    "createdAt": "2025-12-01T10:00:00.000Z",
    "updatedAt": "2025-12-01T10:00:00.000Z"
  },
  "timestamp": "2025-12-23T10:00:00.000Z"
}
```

**Error Responses**:

- `404 Not Found`: Admin account not found

---

### 4. Update Admin Account

Update admin account information.

**Endpoint**: `PUT /admin/accounts/:id`

**Request Body** (all fields optional, but at least one required):

```json
{
  "fullName": "John Smith",
  "phone": "0987654321",
  "email": "newemail@example.com"
}
```

**Validation Rules**:

- `email`: Valid email format, optional
- `phone`: 10-15 digits, optional
- `fullName`: 2-100 characters, optional
- At least one field must be provided

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "email": "newemail@example.com",
    "phone": "0987654321",
    "fullName": "John Smith",
    "role": "admin",
    "emailVerified": true,
    "phoneVerified": false,
    "isActive": true,
    "createdAt": "2025-12-01T10:00:00.000Z",
    "updatedAt": "2025-12-23T10:00:00.000Z"
  },
  "message": "Admin account updated successfully",
  "timestamp": "2025-12-23T10:00:00.000Z"
}
```

**Error Responses**:

- `404 Not Found`: Admin account not found
- `409 Conflict`: Email already in use by another admin
- `422 Unprocessable Entity`: Validation error

---

### 5. Deactivate Admin Account

Deactivate an admin account (sets password to NULL, preventing login).

**Endpoint**: `POST /admin/accounts/:id/deactivate`

**Request Body**: None

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "email": "admin@example.com",
    "phone": "0900000001",
    "fullName": "System Administrator",
    "role": "admin",
    "emailVerified": true,
    "phoneVerified": false,
    "isActive": false,
    "createdAt": "2025-12-01T10:00:00.000Z",
    "updatedAt": "2025-12-23T10:00:00.000Z"
  },
  "message": "Admin account deactivated successfully",
  "timestamp": "2025-12-23T10:00:00.000Z"
}
```

**Error Responses**:

- `400 Bad Request`: Admin account already deactivated
- `403 Forbidden`:
  - Cannot deactivate your own account
  - Cannot deactivate the last active admin account
- `404 Not Found`: Admin account not found

**Business Rules**:

- Admin cannot deactivate themselves
- System must always have at least one active admin
- Deactivation is reversible via reactivation endpoint

---

### 6. Reactivate Admin Account

Reactivate a deactivated admin account by setting a new password.

**Endpoint**: `POST /admin/accounts/:id/reactivate`

**Request Body**:

```json
{
  "password": "NewSecurePass@123"
}
```

**Validation Rules**:

- `password`: Min 8 chars, must contain uppercase, lowercase, digit, and special character (@$!%\*?&#), required

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "email": "admin@example.com",
    "phone": "0900000001",
    "fullName": "System Administrator",
    "role": "admin",
    "emailVerified": true,
    "phoneVerified": false,
    "isActive": true,
    "createdAt": "2025-12-01T10:00:00.000Z",
    "updatedAt": "2025-12-23T10:00:00.000Z"
  },
  "message": "Admin account reactivated successfully",
  "timestamp": "2025-12-23T10:00:00.000Z"
}
```

**Error Responses**:

- `400 Bad Request`: Admin account is already active
- `404 Not Found`: Admin account not found
- `422 Unprocessable Entity`: Validation error

---

### 7. Get Admin Statistics

Retrieve statistics about admin accounts.

**Endpoint**: `GET /admin/stats`

**Success Response** (200):

```json
{
  "success": true,
  "data": {
    "totalAdmins": 15,
    "activeAdmins": 12,
    "inactiveAdmins": 3
  },
  "timestamp": "2025-12-23T10:00:00.000Z"
}
```

---

## Error Codes

| Code        | Description                                      |
| ----------- | ------------------------------------------------ |
| `ADMIN_001` | Admin account with this email already exists     |
| `ADMIN_002` | Admin account not found                          |
| `ADMIN_003` | Email address is already in use by another admin |
| `ADMIN_004` | Failed to update admin account                   |
| `ADMIN_005` | You cannot deactivate your own admin account     |
| `ADMIN_006` | Admin account is already deactivated             |
| `ADMIN_007` | Cannot deactivate the last active admin account  |
| `ADMIN_008` | Failed to deactivate admin account               |
| `ADMIN_009` | Admin account is already active                  |
| `ADMIN_010` | Failed to reactivate admin account               |
| `ADMIN_012` | Phone number already exists                      |
| `AUTH_001`  | Authorization header missing or invalid          |
| `AUTH_002`  | Token expired or invalid                         |
| `AUTH_003`  | Insufficient permissions                         |
| `AUTH_004`  | Token has been revoked                           |
| `AUTH_005`  | Email not verified                               |
| `AUTH_007`  | Account linked to Google, use Google Sign-In     |
| `AUTH_010`  | Account temporarily locked                       |
| `AUTH_011`  | Admin account has been deactivated               |
| `VAL_001`   | Validation error                                 |
| `SYS_001`   | Internal server error                            |

---

## Testing with cURL

### Create Admin

```bash
curl -X POST http://localhost:3000/admin/accounts \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newadmin@example.com",
    "phone": "0912345678",
    "password": "SecurePass@123",
    "fullName": "John Doe"
  }'
```

### Get All Admins

```bash
curl -X GET "http://localhost:3000/admin/accounts?page=1&limit=10&status=active" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Update Admin

```bash
curl -X PUT http://localhost:3000/admin/accounts/USER_ID \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Smith",
    "phone": "0987654321"
  }'
```

### Deactivate Admin

```bash
curl -X POST http://localhost:3000/admin/accounts/USER_ID/deactivate \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Reactivate Admin

```bash
curl -X POST http://localhost:3000/admin/accounts/USER_ID/reactivate \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "password": "NewSecurePass@123"
  }'
```

---

## Database Schema

The admin management uses the existing `users` table with the following relevant columns:

```sql
users (
  user_id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(32) UNIQUE,
  password_hash TEXT,              -- NULL = deactivated account
  full_name VARCHAR(100),
  role VARCHAR(32),                -- 'admin' or 'passenger'
  email_verified BOOLEAN,
  phone_verified BOOLEAN,
  preferences JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

**Key Points**:

- `password_hash IS NULL` indicates a deactivated account
- `password_hash IS NOT NULL` indicates an active account
- Admin accounts are identified by `role = 'admin'`

---

## Security Considerations

1. **Password Requirements**: Strong password policy enforced (min 8 chars, mixed case, numbers, special chars)
2. **Self-Protection**: Admins cannot deactivate themselves
3. **System Protection**: At least one active admin must exist
4. **Authorization**: All endpoints require admin role
5. **Audit Trail**: `created_at` and `updated_at` timestamps tracked
6. **Email Uniqueness**: Prevents duplicate admin emails
7. **Default Admin**: Created via migration with default password (must be changed immediately)

---

## Default Admin Account

**Email**: `admin@example.com`  
**Password**: `Admin@123`

⚠️ **SECURITY WARNING**: Change this password immediately after first login!

---

## Implementation Notes

### Layer Structure

```
Controller → Service → Repository → Database
```

- **adminController.js**: Handles HTTP requests/responses
- **adminService.js**: Business logic and validation
- **adminRepository.js**: Database operations
- **adminValidators.js**: Input validation schemas (Joi)

### Migration Files

- `019_admin_management_indexes.sql`: Indexes and constraints
- `020_seed_admin_account.sql`: Default admin account creation

### API Gateway

Admin routes are proxied through the API Gateway at `/admin/*` to `auth-service/admin/*`
