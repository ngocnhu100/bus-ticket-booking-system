# Admin User Management System

> Complete admin account management implementation for the Bus Ticket Booking System

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Quick Start](#quick-start)
- [Documentation](#documentation)
- [API Endpoints](#api-endpoints)
- [Security](#security)
- [Testing](#testing)
- [File Structure](#file-structure)

---

## 🎯 Overview

This module provides comprehensive admin user management functionality, including:

- Creating admin accounts
- Listing and searching admins
- Updating admin information
- Activating/deactivating admin accounts
- Role-based access control
- Strong password policies
- Audit trail tracking

**Architecture**: Follows the microservices pattern with clear separation of concerns (Controller → Service → Repository)

**Authentication**: JWT-based with role verification

**Authorization**: Admin-only access using middleware

---

## ✨ Features

### Core Functionality
- ✅ **Create Admin Accounts** - Only admins can create new admins
- ✅ **View Admin Accounts** - Paginated list with filtering
- ✅ **Search Admins** - Search by name or email (case-insensitive)
- ✅ **Update Admin Info** - Modify name, email, or phone
- ✅ **Deactivate Admins** - Disable login without deletion
- ✅ **Reactivate Admins** - Re-enable with new password
- ✅ **Admin Statistics** - Total, active, and inactive counts

### Security Features
- ✅ **Strong Password Policy** - Enforced complexity requirements
- ✅ **Password Hashing** - Bcrypt with 12 salt rounds
- ✅ **JWT Authentication** - Token-based authorization
- ✅ **Role-Based Access** - Admin-only endpoints
- ✅ **Self-Protection** - Cannot deactivate own account
- ✅ **Last Admin Protection** - Prevents system lockout
- ✅ **Duplicate Prevention** - Email uniqueness validation

### Technical Features
- ✅ **Pagination** - Efficient data retrieval (max 100 per page)
- ✅ **Filtering** - By status (active/inactive)
- ✅ **Searching** - Full-text search on name and email
- ✅ **Optimized Queries** - Database indexes for performance
- ✅ **Input Validation** - Joi schema validation
- ✅ **Error Handling** - Comprehensive error codes and messages
- ✅ **Audit Trail** - Created/updated timestamps

---

## 🚀 Quick Start

### 1. Apply Database Migrations

```bash
# Navigate to backend directory
cd backend

# Apply migrations
psql -U postgres -d bus_booking -f sql/019_admin_management_indexes.sql
psql -U postgres -d bus_booking -f sql/020_seed_admin_account.sql
```

### 2. Start Services

```bash
# Terminal 1: Start Auth Service
cd backend/services/auth-service
npm install
npm start

# Terminal 2: Start API Gateway
cd backend/api-gateway
npm install
npm start
```

### 3. Test the Implementation

```bash
# Run comprehensive test suite
cd backend/services/auth-service
node test-admin-management.js
```

### 4. Login with Default Admin

**URL**: `POST http://localhost:3000/auth/login`

**Credentials**:
```json
{
  "email": "admin@example.com",
  "password": "Admin@123"
}
```

⚠️ **IMPORTANT**: Change the default password immediately!

---

## 📚 Documentation

Comprehensive documentation is available:

1. **[ADMIN_API_DOCUMENTATION.md](./ADMIN_API_DOCUMENTATION.md)**
   - Complete API reference
   - Request/response examples
   - Error codes
   - cURL examples

2. **[ADMIN_SETUP_GUIDE.md](./ADMIN_SETUP_GUIDE.md)**
   - Installation instructions
   - Configuration guide
   - Testing procedures
   - Troubleshooting tips

3. **[ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md)**
   - System architecture
   - Data flow diagrams
   - Design decisions

4. **[IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md)**
   - Implementation summary
   - Deliverables checklist
   - Technical details

---

## 🔌 API Endpoints

All endpoints require admin authentication:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/admin/accounts` | Create new admin account |
| GET | `/admin/accounts` | List all admins (paginated) |
| GET | `/admin/accounts/:id` | Get admin by ID |
| PUT | `/admin/accounts/:id` | Update admin information |
| POST | `/admin/accounts/:id/deactivate` | Deactivate admin account |
| POST | `/admin/accounts/:id/reactivate` | Reactivate admin account |
| GET | `/admin/stats` | Get admin statistics |

### Example: Create Admin

```bash
curl -X POST http://localhost:3000/admin/accounts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newadmin@example.com",
    "phone": "0912345678",
    "password": "SecurePass@123",
    "fullName": "John Doe"
  }'
```

### Example: List Admins with Filtering

```bash
curl -X GET "http://localhost:3000/admin/accounts?page=1&limit=10&status=active&search=john" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔐 Security

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one digit
- At least one special character (@$!%*?&#)

### Access Control
- All endpoints require JWT authentication
- Only users with `role: admin` can access
- Tokens are validated on every request
- Blacklisted tokens are rejected

### Protection Mechanisms
- **Self-Deactivation Prevention**: Admins cannot deactivate themselves
- **Last Admin Protection**: System must have at least one active admin
- **Email Uniqueness**: Duplicate emails are prevented
- **SQL Injection Prevention**: All queries use parameterized statements
- **Password Hashing**: Bcrypt with 12 salt rounds

---

## 🧪 Testing

### Automated Test Suite

Run all 11 comprehensive tests:

```bash
node test-admin-management.js
```

**Tests include**:
1. ✅ Admin login
2. ✅ Create admin account
3. ✅ Get all admins (paginated)
4. ✅ Get active admins (filtered)
5. ✅ Search admins
6. ✅ Get admin by ID
7. ✅ Update admin account
8. ✅ Get admin statistics
9. ✅ Deactivate admin account
10. ✅ Reactivate admin account
11. ✅ Validation error handling
12. ✅ Unauthorized access blocking

### Manual Testing

Use the cURL examples in [ADMIN_API_DOCUMENTATION.md](./ADMIN_API_DOCUMENTATION.md)

---

## 📁 File Structure

```
auth-service/
│
├── src/
│   ├── repositories/
│   │   └── adminRepository.js           # Database queries
│   │
│   ├── services/
│   │   └── adminService.js              # Business logic
│   │
│   ├── controllers/
│   │   └── adminController.js           # HTTP handlers
│   │
│   ├── validators/
│   │   └── adminValidators.js           # Input validation
│   │
│   ├── index.js                         # ✏️ Updated with routes
│   ├── authMiddleware.js                # ✅ Used for authorization
│   └── database.js                      # ✅ Database connection
│
├── test-admin-management.js             # Comprehensive tests
├── ADMIN_API_DOCUMENTATION.md           # API reference
├── ADMIN_SETUP_GUIDE.md                 # Setup guide
├── ARCHITECTURE_DIAGRAM.md              # Architecture docs
├── IMPLEMENTATION_COMPLETE.md           # Implementation summary
└── README_ADMIN.md                      # This file
```

---

## 🎯 Usage Examples

### Creating Your First Admin

```javascript
// 1. Login as default admin
const loginResponse = await fetch('http://localhost:3000/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@example.com',
    password: 'Admin@123'
  })
});

const { data } = await loginResponse.json();
const token = data.accessToken;

// 2. Create new admin
const createResponse = await fetch('http://localhost:3000/admin/accounts', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'john@company.com',
    phone: '0912345678',
    password: 'SecurePass@123',
    fullName: 'John Smith'
  })
});

const newAdmin = await createResponse.json();
console.log('New admin created:', newAdmin);
```

### Listing Active Admins

```javascript
const response = await fetch(
  'http://localhost:3000/admin/accounts?page=1&limit=10&status=active',
  {
    headers: { 'Authorization': `Bearer ${token}` }
  }
);

const result = await response.json();
console.log(`Found ${result.pagination.total} active admins`);
console.log('Admins:', result.data);
```

---

## ⚠️ Important Notes

### Default Admin Account
- **Email**: `admin@example.com`
- **Password**: `Admin@123`
- **Change immediately after first login!**

### Deactivation vs Deletion
- Accounts are **deactivated** (not deleted) for audit trail
- Deactivated accounts set `password_hash = NULL`
- Can be reactivated with a new password

### Last Admin Protection
- System requires at least one active admin
- Attempting to deactivate the last admin returns error
- Create a backup admin before deactivating

### Self-Protection
- Admins cannot deactivate their own accounts
- Prevents accidental lockout
- Use another admin account to deactivate

---

## 🐛 Troubleshooting

### "Admin service unavailable"
- Ensure auth-service is running on port 3001
- Check `AUTH_SERVICE_URL` environment variable in API Gateway

### "Authorization header missing"
- Include `Authorization: Bearer <token>` in request headers
- Ensure token is not expired (check JWT expiration)

### "Insufficient permissions"
- Verify user has `role: admin` in JWT token
- Login with admin account to get proper token

### "Cannot deactivate the last active admin account"
- Create another admin account first
- Then deactivate the target admin

### Database connection errors
- Check PostgreSQL is running
- Verify connection string in `.env` file
- Ensure migrations are applied

---

## 📊 Performance

### Database Optimization
- Indexes on frequently queried columns
- Efficient pagination queries
- Optimized count operations
- Partial indexes for admin filtering

### API Optimization
- Request timeout: 30 seconds
- Max items per page: 100
- Efficient query parameters
- Caching opportunities (future)

---

## 🔄 Integration

### Works With
- ✅ Existing authentication system
- ✅ Current JWT implementation
- ✅ Existing database schema
- ✅ API Gateway architecture
- ✅ Other microservices

### No Breaking Changes
- Uses existing `users` table
- Extends auth-service
- Reuses authentication middleware
- Maintains consistent API patterns

---

## 📈 Future Enhancements

Potential improvements:
- [ ] Admin activity logging
- [ ] Role hierarchy (super admin, admin, moderator)
- [ ] Password expiration policy
- [ ] Two-factor authentication
- [ ] Email notifications on account changes
- [ ] Bulk admin operations
- [ ] Export admin list to CSV
- [ ] Admin profile customization

---

## ✅ Checklist for Production

Before deploying:
- [ ] Apply database migrations
- [ ] Change default admin password
- [ ] Configure environment variables
- [ ] Run test suite (all tests pass)
- [ ] Verify API Gateway routing
- [ ] Test authentication flow
- [ ] Check error handling
- [ ] Review security settings
- [ ] Database backup created
- [ ] Documentation reviewed

---

## 📞 Quick Reference

### Service URLs
- **API Gateway**: `http://localhost:3000`
- **Auth Service**: `http://localhost:3001`

### Key Files
- **Repository**: `src/repositories/adminRepository.js`
- **Service**: `src/services/adminService.js`
- **Controller**: `src/controllers/adminController.js`
- **Validators**: `src/validators/adminValidators.js`
- **Tests**: `test-admin-management.js`

### Migrations
- **Indexes**: `sql/019_admin_management_indexes.sql`
- **Seed Data**: `sql/020_seed_admin_account.sql`

---

## 🎉 Summary

The Admin User Management system is **production-ready** with:

- ✅ Complete CRUD operations
- ✅ Comprehensive security
- ✅ Full documentation
- ✅ Automated testing
- ✅ Clean architecture
- ✅ Performance optimization

**Status**: ✅ **COMPLETE & PRODUCTION READY**

---

**Implementation Date**: December 23, 2025  
**Version**: 1.0.0  
**License**: MIT
