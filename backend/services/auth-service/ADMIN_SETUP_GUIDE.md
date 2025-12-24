# Admin User Management - Setup & Usage Guide

## 🚀 Quick Start

### Prerequisites
- PostgreSQL database running
- Node.js installed
- Auth service configured
- API Gateway configured

### Step 1: Apply Database Migrations

Run the following SQL files in order:

```bash
# Navigate to the backend directory
cd backend

# Apply the migrations (in PostgreSQL)
psql -U your_username -d your_database -f sql/019_admin_management_indexes.sql
psql -U your_username -d your_database -f sql/020_seed_admin_account.sql
```

Or if using a migration runner:
```bash
# Your existing migration process
npm run migrate
```

### Step 2: Install Dependencies (if needed)

The admin management module uses existing dependencies:
- `bcrypt` - for password hashing
- `joi` - for validation
- `express` - web framework
- `axios` - HTTP client

No additional packages required.

### Step 3: Start Services

```bash
# Start auth-service
cd backend/services/auth-service
npm start

# Start API Gateway (in another terminal)
cd backend/api-gateway
npm start
```

### Step 4: Test the Implementation

```bash
# Run the comprehensive test suite
cd backend/services/auth-service
node test-admin-management.js
```

---

## 📁 File Structure

```
backend/
├── sql/
│   ├── 019_admin_management_indexes.sql    # Database indexes
│   └── 020_seed_admin_account.sql          # Default admin account
│
├── api-gateway/
│   └── src/
│       └── index.js                        # ✏️ Updated with /admin routes
│
└── services/
    └── auth-service/
        ├── src/
        │   ├── repositories/
        │   │   └── adminRepository.js      # ✨ NEW - Database layer
        │   ├── services/
        │   │   └── adminService.js         # ✨ NEW - Business logic
        │   ├── controllers/
        │   │   └── adminController.js      # ✨ NEW - HTTP handlers
        │   ├── validators/
        │   │   └── adminValidators.js      # ✨ NEW - Input validation
        │   ├── index.js                    # ✏️ Updated with routes
        │   └── authMiddleware.js           # ✅ Already has authorize()
        │
        ├── test-admin-management.js        # ✨ NEW - Comprehensive tests
        └── ADMIN_API_DOCUMENTATION.md      # ✨ NEW - Full API docs
```

---

## 🔐 Default Admin Credentials

**Email**: `admin@example.com`  
**Password**: `Admin@123`

⚠️ **IMPORTANT**: Change this password immediately after first login!

---

## 🧪 Testing

### Manual Testing with cURL

#### 1. Login as Admin
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin@123"
  }'
```

Save the `accessToken` from the response.

#### 2. Create a New Admin
```bash
curl -X POST http://localhost:3000/admin/accounts \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newadmin@example.com",
    "phone": "0912345678",
    "password": "SecurePass@123",
    "fullName": "John Doe"
  }'
```

#### 3. Get All Admins
```bash
curl -X GET "http://localhost:3000/admin/accounts?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 4. Get Active Admins Only
```bash
curl -X GET "http://localhost:3000/admin/accounts?status=active" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 5. Search Admins
```bash
curl -X GET "http://localhost:3000/admin/accounts?search=john" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 6. Update Admin
```bash
curl -X PUT http://localhost:3000/admin/accounts/USER_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Smith",
    "phone": "0987654321"
  }'
```

#### 7. Deactivate Admin
```bash
curl -X POST http://localhost:3000/admin/accounts/USER_ID/deactivate \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 8. Reactivate Admin
```bash
curl -X POST http://localhost:3000/admin/accounts/USER_ID/reactivate \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "password": "NewSecurePass@123"
  }'
```

#### 9. Get Statistics
```bash
curl -X GET http://localhost:3000/admin/stats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Automated Testing

Run the comprehensive test suite:

```bash
cd backend/services/auth-service
node test-admin-management.js
```

---

## 🔒 Security Features

1. **Strong Password Policy**
   - Minimum 8 characters
   - Must contain uppercase, lowercase, digit, and special character
   - Password hashed with bcrypt (12 rounds)

2. **Authorization Checks**
   - All endpoints require admin role
   - JWT token validation
   - Token blacklist checking

3. **Self-Protection**
   - Admins cannot deactivate themselves
   - System must have at least one active admin

4. **Audit Trail**
   - `created_at` and `updated_at` timestamps
   - Account status tracking (active/inactive)

5. **Email Uniqueness**
   - Prevents duplicate admin emails
   - Validates email format

---

## 🐛 Common Issues & Solutions

### Issue: "Admin service unavailable"
**Solution**: Ensure auth-service is running on the correct port (default: 3001)

### Issue: "Authorization header missing or invalid"
**Solution**: Include `Authorization: Bearer <token>` header in all requests

### Issue: "Cannot deactivate the last active admin account"
**Solution**: Create another admin before deactivating the current one

### Issue: "Validation error" on password
**Solution**: Ensure password meets requirements:
- Min 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one digit
- At least one special character (@$!%*?&#)

### Issue: Database connection error
**Solution**: Check PostgreSQL is running and connection string in `.env` file

---

## 📊 API Endpoints Summary

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/admin/accounts` | Create admin account | Yes (Admin) |
| GET | `/admin/accounts` | List all admins | Yes (Admin) |
| GET | `/admin/accounts/:id` | Get admin by ID | Yes (Admin) |
| PUT | `/admin/accounts/:id` | Update admin | Yes (Admin) |
| POST | `/admin/accounts/:id/deactivate` | Deactivate admin | Yes (Admin) |
| POST | `/admin/accounts/:id/reactivate` | Reactivate admin | Yes (Admin) |
| GET | `/admin/stats` | Get admin statistics | Yes (Admin) |

---

## 🔄 Integration with Existing Services

The admin management system integrates seamlessly with:

1. **Auth Service**: Uses existing user repository and authentication
2. **API Gateway**: Routes `/admin/*` to auth-service
3. **Database**: Uses existing `users` table with role-based filtering
4. **Middleware**: Uses existing `authenticate` and `authorize` middleware

No breaking changes to existing functionality.

---

## 📈 Performance Considerations

### Database Indexes
The migration creates the following indexes for optimal performance:

- `idx_users_role` - Fast admin filtering
- `idx_users_role_active` - Active/inactive admin queries
- `idx_users_email_lower` - Case-insensitive email search
- `idx_users_fullname_lower` - Case-insensitive name search
- `idx_users_admin_created` - Efficient pagination

### Query Optimization
- Pagination limits max results to 100 per page
- Filtered queries use indexed columns
- Efficient count queries for statistics

---

## 🎯 Best Practices

1. **Always use pagination** when listing admins
2. **Search with specific terms** to reduce result set
3. **Change default admin password** immediately
4. **Create backup admin** before deactivating accounts
5. **Use strong passwords** that meet policy requirements
6. **Monitor admin statistics** regularly
7. **Audit admin activities** via timestamps

---

## 📝 Additional Notes

### Password Hashing
- Uses bcrypt with 12 salt rounds
- Hash stored in `password_hash` column
- NULL password_hash indicates deactivated account

### Role-Based Access
- Only users with `role = 'admin'` can access endpoints
- Enforced at middleware level
- Validated on every request

### Account States
- **Active**: `password_hash IS NOT NULL`
- **Inactive**: `password_hash IS NULL`

### Email Verification
- Admin accounts created with `email_verified = true`
- Can be modified if email verification required

---

## 🆘 Support

For issues or questions:
1. Check the API documentation: `ADMIN_API_DOCUMENTATION.md`
2. Review error codes in the documentation
3. Run the test suite to verify setup
4. Check service logs for detailed error messages

---

## ✅ Verification Checklist

Before deploying to production:

- [ ] Database migrations applied successfully
- [ ] Default admin account created
- [ ] Auth service running and accessible
- [ ] API Gateway routing `/admin/*` correctly
- [ ] All tests passing
- [ ] Default admin password changed
- [ ] Environment variables configured
- [ ] Database indexes created
- [ ] Security measures verified
- [ ] Documentation reviewed

---

## 🎉 You're Ready!

The Admin User Management system is now fully implemented and ready to use. Start by logging in with the default admin account and creating your first admin user!
