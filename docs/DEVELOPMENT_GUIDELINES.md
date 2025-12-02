# Development Guidelines

Quy tắc và hướng dẫn phát triển cho Bus Ticket Booking System. Tài liệu này giúp đảm bảo code quality, consistency và collaboration hiệu quả trong team.

---

## Table of Contents

1. [Git Workflow](#git-workflow)
2. [Branch Naming Conventions](#branch-naming-conventions)
3. [Commit Message Guidelines](#commit-message-guidelines)
4. [Code Style Guide](#code-style-guide)
5. [Project Structure](#project-structure)
6. [Coding Best Practices](#coding-best-practices)
7. [Error Handling](#error-handling)
8. [Logging](#logging)
9. [Testing Guidelines](#testing-guidelines)
10. [Code Review Process](#code-review-process)
11. [Documentation](#documentation)

---

## Git Workflow

### Main Branches

- **`main`**: Production-ready code. Luôn luôn stable và có thể deploy.
- **`develop`**: Development branch chính. Tích hợp features mới trước khi merge vào main.

### Supporting Branches

- **Feature branches**: Phát triển features mới
- **Fix branches**: Bug fixes cho develop
- **Hotfix branches**: Critical fixes cho production
- **Infra branches**: Infrastructure changes (Docker, CI/CD, etc.)

### Workflow Process

```
1. Create branch from develop
   ├── feature/feature-name
   ├── fix/bug-name
   ├── infra/infrastructure-change
   └── hotfix/critical-fix

2. Develop and commit changes
   └── Follow commit message conventions

3. Push branch to remote
   └── git push origin branch-name

4. Create Pull Request
   ├── Fill PR template
   ├── Request reviewers
   └── Link related issues

5. Code Review
   ├── Address review comments
   └── Resolve conflicts

6. Merge to develop
   └── Squash and merge (hoặc rebase)

7. Delete branch after merge
```

---

## Branch Naming Conventions

### Format

```
<type>/<short-description>
```

### Types

| Type        | Description               | Example                         |
| ----------- | ------------------------- | ------------------------------- |
| `feature/`  | New features              | `feature/trip-search-filters`   |
| `fix/`      | Bug fixes                 | `fix/login-validation-error`    |
| `hotfix/`   | Critical production fixes | `hotfix/security-vulnerability` |
| `infra/`    | Infrastructure changes    | `infra/docker-optimization`     |
| `refactor/` | Code refactoring          | `refactor/auth-service-cleanup` |
| `docs/`     | Documentation only        | `docs/api-documentation`        |
| `test/`     | Adding/updating tests     | `test/trip-service-integration` |
| `chore/`    | Maintenance tasks         | `chore/update-dependencies`     |

### Naming Rules

✅ **DO**:

- Sử dụng lowercase
- Sử dụng hyphens để ngăn cách words
- Keep it short và descriptive
- Example: `feature/user-dashboard`, `fix/payment-validation`

❌ **DON'T**:

- Sử dụng spaces: `feature/user dashboard`
- Sử dụng underscores: `feature/user_dashboard`
- Too generic: `feature/update`, `fix/bug`
- Too long: `feature/implement-advanced-search-with-multiple-filters-and-sorting`

### Examples

```bash
# Features
git checkout -b feature/trip-booking
git checkout -b feature/admin-dashboard
git checkout -b feature/payment-integration

# Bug Fixes
git checkout -b fix/email-validation
git checkout -b fix/redis-connection
git checkout -b fix/cors-error

# Hotfixes
git checkout -b hotfix/critical-auth-bug
git checkout -b hotfix/database-connection

# Infrastructure
git checkout -b infra/docker-compose
git checkout -b infra/performance-optimization
```

---

## Commit Message Guidelines

Dự án sử dụng **Conventional Commits** specification.

### Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types

| Type       | Description                     | Example                                     |
| ---------- | ------------------------------- | ------------------------------------------- |
| `feat`     | New feature                     | `feat(trip): add advanced search filters`   |
| `fix`      | Bug fix                         | `fix(auth): resolve token expiration issue` |
| `docs`     | Documentation changes           | `docs(readme): update installation guide`   |
| `style`    | Code style changes (formatting) | `style(trip): fix indentation`              |
| `refactor` | Code refactoring                | `refactor(auth): simplify validation logic` |
| `perf`     | Performance improvements        | `perf(trip): add database indexes`          |
| `test`     | Adding/updating tests           | `test(auth): add login integration tests`   |
| `chore`    | Maintenance tasks               | `chore(deps): update dependencies`          |
| `ci`       | CI/CD changes                   | `ci(github): add automated testing`         |
| `build`    | Build system changes            | `build(docker): optimize image size`        |

### Scope (Optional)

Scope xác định phần nào của codebase bị ảnh hưởng:

- `auth` - Authentication service
- `trip` - Trip service
- `gateway` - API Gateway
- `frontend` - Frontend application
- `docker` - Docker configuration
- `db` - Database changes

### Subject

- Sử dụng imperative mood: "add" not "added" or "adds"
- Không capitalize first letter
- Không dấu chấm (.) ở cuối
- Maximum 50 characters

### Body (Optional)

- Giải thích **what** và **why**, không phải **how**
- Wrap at 72 characters
- Separate from subject với blank line

### Footer (Optional)

- Reference issues: `Closes #123`, `Fixes #456`
- Breaking changes: `BREAKING CHANGE: description`

### Examples

#### Simple Commit

```bash
git commit -m "feat(trip): add sorting by price"
```

#### Commit with Scope and Body

```bash
git commit -m "fix(auth): resolve JWT token validation

The token validation was failing due to incorrect secret key
comparison. Updated the validation logic to use constant-time
comparison to prevent timing attacks.

Closes #234"
```

#### Breaking Change

```bash
git commit -m "feat(api)!: change response format

BREAKING CHANGE: API responses now follow a standardized format
with success, data, and error fields. This will require frontend
updates to handle the new response structure.

Migration guide: docs/MIGRATION.md"
```

#### Multiple Changes

```bash
# Feature commit
git commit -m "feat(trip): implement Redis caching"

# Documentation for the feature
git commit -m "docs(trip): add caching documentation"

# Test for the feature
git commit -m "test(trip): add cache integration tests"
```

### Commit Message Template

Create `.gitmessage` file:

```bash
# <type>(<scope>): <subject>
# |<----  Maximum 50 characters  ---->|

# [optional body]
# |<----  Maximum 72 characters per line  ---->|

# [optional footer]
# Types: feat, fix, docs, style, refactor, perf, test, chore, ci, build
# Scopes: auth, trip, gateway, frontend, docker, db
# Examples:
#   feat(trip): add advanced search filters
#   fix(auth): resolve token expiration issue
#   docs(readme): update installation guide
```

Set as default:

```bash
git config commit.template .gitmessage
```

---

## Code Style Guide

### JavaScript/Node.js

#### General Rules

- **Indentation**: 2 spaces (không sử dụng tabs)
- **Line Length**: Maximum 100 characters
- **Quotes**: Single quotes cho strings, backticks cho templates
- **Semicolons**: Always use semicolons
- **Trailing Commas**: Use trailing commas trong arrays và objects

#### Naming Conventions

```javascript
// Variables & Functions: camelCase
const userName = "John";
function getUserData() {}

// Constants: UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3;
const API_BASE_URL = "http://localhost:3000";

// Classes: PascalCase
class UserService {}
class AuthController {}

// Private methods/properties: prefix with underscore
class Example {
  _privateMethod() {}
  _privateProperty = null;
}

// Files: kebab-case
// user-service.js
// auth-controller.js
// trip-repository.js
```

#### Code Organization

```javascript
// 1. Imports - External libraries first, then internal modules
const express = require("express");
const bcrypt = require("bcrypt");

const userService = require("./services/user-service");
const authMiddleware = require("./middleware/auth");

// 2. Constants
const PORT = process.env.PORT || 3000;
const MAX_LOGIN_ATTEMPTS = 5;

// 3. Main code
class AuthController {
  async login(req, res) {
    // Implementation
  }
}

// 4. Exports
module.exports = AuthController;
```

#### Functions

```javascript
// ✅ DO: Clear function names and single responsibility
async function getUserById(userId) {
  const user = await User.findById(userId);
  return user;
}

// ✅ DO: Use async/await instead of callbacks
async function fetchUserData() {
  try {
    const data = await api.getUser();
    return data;
  } catch (error) {
    console.error("Error fetching user:", error);
    throw error;
  }
}

// ❌ DON'T: Nested callbacks (callback hell)
function fetchUserData(callback) {
  api.getUser((err, user) => {
    if (err) return callback(err);
    api.getUserProfile(user.id, (err, profile) => {
      if (err) return callback(err);
      callback(null, profile);
    });
  });
}

// ✅ DO: Early returns for validation
function processPayment(amount, currency) {
  if (!amount) {
    throw new Error("Amount is required");
  }
  if (!currency) {
    throw new Error("Currency is required");
  }

  // Main logic here
  return processTransaction(amount, currency);
}

// ❌ DON'T: Deep nesting
function processPayment(amount, currency) {
  if (amount) {
    if (currency) {
      // Deep nested logic
      return processTransaction(amount, currency);
    }
  }
}
```

#### Objects and Arrays

```javascript
// ✅ DO: Use destructuring
const { name, email } = user;
const [first, second] = items;

// ✅ DO: Use spread operator
const newUser = { ...user, role: "admin" };
const newArray = [...oldArray, newItem];

// ✅ DO: Use shorthand properties
const name = "John";
const user = { name, age: 30 }; // Instead of { name: name, age: 30 }

// ✅ DO: Use array methods
const activeUsers = users.filter((user) => user.isActive);
const userNames = users.map((user) => user.name);
```

#### Arrow Functions

```javascript
// ✅ DO: Use arrow functions for callbacks
users.map((user) => user.name);
users.filter((user) => user.isActive);

// ✅ DO: Use regular functions for methods that need 'this'
class UserService {
  constructor() {
    this.users = [];
  }

  addUser(user) {
    this.users.push(user);
  }
}

// ❌ DON'T: Use arrow functions when you need 'this' binding
class UserService {
  constructor() {
    this.users = [];
  }

  addUser = (user) => {
    // Wrong! Arrow function doesn't bind 'this'
    this.users.push(user);
  };
}
```

### TypeScript (Frontend)

```typescript
// ✅ DO: Define types explicitly
interface User {
  id: number;
  name: string;
  email: string;
  role: "passenger" | "admin";
}

// ✅ DO: Use type inference when obvious
const count = 5; // Type is inferred as number
const name = "John"; // Type is inferred as string

// ✅ DO: Use enums for fixed sets of values
enum UserRole {
  PASSENGER = "passenger",
  ADMIN = "admin",
}

// ✅ DO: Use generics for reusable components
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}
```

### ESLint Configuration

Project sử dụng ESLint để enforce code style. Config file `.eslintrc.js`:

```javascript
module.exports = {
  env: {
    node: true,
    es2021: true,
  },
  extends: ["eslint:recommended"],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: "module",
  },
  rules: {
    indent: ["error", 2],
    "linebreak-style": ["error", "unix"],
    quotes: ["error", "single"],
    semi: ["error", "always"],
    "no-unused-vars": ["warn"],
    "no-console": ["warn", { allow: ["warn", "error"] }],
  },
};
```

### Prettier Configuration

`.prettierrc`:

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "avoid"
}
```

---

## Project Structure

### Microservice Structure

Mỗi microservice nên follow cấu trúc sau:

```
service-name/
├── src/
│   ├── index.js                 # Entry point
│   ├── routes/                  # Route definitions
│   │   ├── index.js            # Main router
│   │   ├── auth.routes.js      # Auth routes
│   │   └── user.routes.js      # User routes
│   ├── controllers/             # Request handlers
│   │   ├── auth.controller.js
│   │   └── user.controller.js
│   ├── services/                # Business logic
│   │   ├── auth.service.js
│   │   └── user.service.js
│   ├── repositories/            # Data access layer
│   │   ├── user.repository.js
│   │   └── token.repository.js
│   ├── middleware/              # Custom middleware
│   │   ├── auth.middleware.js
│   │   ├── validate.middleware.js
│   │   └── error.middleware.js
│   ├── validators/              # Input validation schemas
│   │   ├── auth.validator.js
│   │   └── user.validator.js
│   ├── models/                  # Data models/types
│   │   └── user.model.js
│   ├── config/                  # Configuration files
│   │   ├── database.js
│   │   ├── redis.js
│   │   └── app.js
│   └── utils/                   # Utility functions
│       ├── logger.js
│       ├── errors.js
│       └── helpers.js
├── tests/                       # Test files
│   ├── unit/                   # Unit tests
│   ├── integration/            # Integration tests
│   └── setup.js                # Test setup
├── .env                         # Environment variables
├── .eslintrc.js                # ESLint config
├── .prettierrc                 # Prettier config
├── Dockerfile                   # Docker config
├── package.json
└── README.md
```

### Layer Responsibilities

#### 1. Routes Layer (`routes/`)

```javascript
// routes/auth.routes.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { validateLogin } = require("../validators/auth.validator");

router.post("/login", validateLogin, authController.login);
router.post("/register", authController.register);

module.exports = router;
```

**Responsibilities**:

- Define HTTP endpoints
- Map routes to controllers
- Apply route-specific middleware
- NO business logic

#### 2. Controllers Layer (`controllers/`)

```javascript
// controllers/auth.controller.js
const authService = require("../services/auth.service");

class AuthController {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
```

**Responsibilities**:

- Handle HTTP requests/responses
- Extract data from req
- Call appropriate service methods
- Format responses
- NO business logic

#### 3. Services Layer (`services/`)

```javascript
// services/auth.service.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userRepository = require("../repositories/user.repository");
const { UnauthorizedError } = require("../utils/errors");

class AuthService {
  async login(email, password) {
    // Business logic here
    const user = await userRepository.findByEmail(email);

    if (!user) {
      throw new UnauthorizedError("Invalid credentials");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid credentials");
    }

    const token = this._generateToken(user);

    return {
      user: {
        id: user.user_id,
        name: user.full_name,
        email: user.email,
        role: user.role,
      },
      token,
    };
  }

  _generateToken(user) {
    return jwt.sign(
      { id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
    );
  }
}

module.exports = new AuthService();
```

**Responsibilities**:

- Implement business logic
- Coordinate between repositories
- Data transformation
- Business rule validation
- NO database queries (use repositories)
- NO HTTP-specific code

#### 4. Repositories Layer (`repositories/`)

```javascript
// repositories/user.repository.js
const pool = require("../config/database");

class UserRepository {
  async findByEmail(email) {
    const query = "SELECT * FROM users WHERE email = $1";
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  async create(userData) {
    const query = `
      INSERT INTO users (email, password_hash, full_name, role)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [
      userData.email,
      userData.password_hash,
      userData.full_name,
      userData.role || "passenger",
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async update(userId, updates) {
    // Build dynamic update query
    const fields = Object.keys(updates);
    const values = Object.values(updates);

    const setClause = fields
      .map((field, index) => `${field} = $${index + 1}`)
      .join(", ");

    const query = `
      UPDATE users
      SET ${setClause}
      WHERE user_id = $${fields.length + 1}
      RETURNING *
    `;

    const result = await pool.query(query, [...values, userId]);
    return result.rows[0];
  }
}

module.exports = new UserRepository();
```

**Responsibilities**:

- Database queries
- Data persistence
- NO business logic
- Return raw data

#### 5. Middleware Layer (`middleware/`)

```javascript
// middleware/auth.middleware.js
const jwt = require("jsonwebtoken");
const { UnauthorizedError } = require("../utils/errors");

const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError("No token provided");
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    next();
  } catch (error) {
    next(new UnauthorizedError("Invalid token"));
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError("Not authenticated"));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError("Insufficient permissions"));
    }

    next();
  };
};

module.exports = { authenticate, authorize };
```

#### 6. Validators Layer (`validators/`)

```javascript
// validators/auth.validator.js
const Joi = require("joi");

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  fullName: Joi.string().min(2).required(),
  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .optional(),
});

const validateLogin = (req, res, next) => {
  const { error } = loginSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: error.details[0].message,
      },
    });
  }

  next();
};

module.exports = {
  validateLogin,
  registerSchema,
};
```

---

## Coding Best Practices

### 1. Single Responsibility Principle

```javascript
// ❌ BAD: Function does too many things
async function handleUserRegistration(userData) {
  // Validate
  if (!userData.email) throw new Error('Email required');

  // Hash password
  const hashedPassword = await bcrypt.hash(userData.password, 10);

  // Save to database
  const user = await db.query('INSERT INTO users...');

  // Send email
  await sendgrid.send({...});

  // Generate token
  const token = jwt.sign({...});

  return { user, token };
}

// ✅ GOOD: Split into focused functions
async function registerUser(userData) {
  validateUserData(userData);
  const hashedPassword = await hashPassword(userData.password);
  const user = await userRepository.create({ ...userData, password: hashedPassword });
  await emailService.sendWelcomeEmail(user.email);
  const token = tokenService.generateAccessToken(user);

  return { user, token };
}
```

### 2. DRY (Don't Repeat Yourself)

```javascript
// ❌ BAD: Repeated error handling
app.get("/users/:id", async (req, res) => {
  try {
    const user = await getUser(req.params.id);
    res.json({ success: true, data: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/trips/:id", async (req, res) => {
  try {
    const trip = await getTrip(req.params.id);
    res.json({ success: true, data: trip });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ GOOD: Use middleware for common logic
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

app.get(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const user = await getUser(req.params.id);
    res.json({ success: true, data: user });
  }),
);

app.get(
  "/trips/:id",
  asyncHandler(async (req, res) => {
    const trip = await getTrip(req.params.id);
    res.json({ success: true, data: trip });
  }),
);

// Global error handler
app.use((error, req, res, next) => {
  console.error(error);
  res.status(error.statusCode || 500).json({
    success: false,
    error: {
      code: error.code || "INTERNAL_ERROR",
      message: error.message,
    },
  });
});
```

### 3. Use Environment Variables

```javascript
// ❌ BAD: Hard-coded values
const dbConfig = {
  host: "localhost",
  port: 5432,
  database: "mydb",
  user: "postgres",
  password: "password123",
};

const jwtSecret = "my-super-secret-key";

// ✅ GOOD: Use environment variables
require("dotenv").config();

const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
};

const jwtSecret = process.env.JWT_SECRET;

// Validate required env vars
const requiredEnvVars = ["DB_HOST", "DB_PORT", "JWT_SECRET"];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}
```

### 4. Input Validation

```javascript
// ✅ Always validate user input
const Joi = require("joi");

const tripSearchSchema = Joi.object({
  origin: Joi.string().min(2).max(100),
  destination: Joi.string().min(2).max(100),
  date: Joi.date().iso().min("now"),
  passengers: Joi.number().integer().min(1).max(10),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

// ✅ Sanitize input to prevent SQL injection
const sanitizeInput = (input) => {
  if (typeof input === "string") {
    return input.trim().replace(/[<>]/g, "");
  }
  return input;
};
```

### 5. Use Async/Await with Proper Error Handling

```javascript
// ❌ BAD: Unhandled promise rejection
async function fetchData() {
  const data = await api.getData(); // Can throw error
  return data;
}

// ✅ GOOD: Proper error handling
async function fetchData() {
  try {
    const data = await api.getData();
    return data;
  } catch (error) {
    logger.error("Failed to fetch data:", error);
    throw new ServiceUnavailableError("Data service is unavailable");
  }
}

// ✅ GOOD: Use Promise.all for parallel operations
async function fetchUserData(userId) {
  try {
    const [user, trips, payments] = await Promise.all([
      userRepository.findById(userId),
      tripRepository.findByUserId(userId),
      paymentRepository.findByUserId(userId),
    ]);

    return { user, trips, payments };
  } catch (error) {
    logger.error("Failed to fetch user data:", error);
    throw error;
  }
}
```

### 6. Database Best Practices

```javascript
// ✅ Use connection pooling
const { Pool } = require('pg');

const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// ✅ Use parameterized queries (prevent SQL injection)
async function getUserByEmail(email) {
  const query = 'SELECT * FROM users WHERE email = $1';
  const result = await pool.query(query, [email]);
  return result.rows[0];
}

// ❌ BAD: String concatenation (SQL injection risk)
async function getUserByEmail(email) {
  const query = `SELECT * FROM users WHERE email = '${email}'`;
  const result = await pool.query(query);
  return result.rows[0];
}

// ✅ Use transactions for multi-step operations
async function createBooking(bookingData) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const booking = await client.query(
      'INSERT INTO bookings (...) VALUES (...) RETURNING *',
      [...]
    );

    await client.query(
      'UPDATE trips SET available_seats = available_seats - $1 WHERE trip_id = $2',
      [bookingData.seats, bookingData.tripId]
    );

    await client.query('COMMIT');
    return booking.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

### 7. Caching Strategy

```javascript
// ✅ Use Redis for caching
const redis = require("redis");
const client = redis.createClient();

async function getTrips(filters) {
  const cacheKey = `trips:${JSON.stringify(filters)}`;

  // Try to get from cache
  const cached = await client.get(cacheKey);
  if (cached) {
    logger.info("Cache hit for trips");
    return JSON.parse(cached);
  }

  // If not in cache, fetch from database
  logger.info("Cache miss for trips");
  const trips = await tripRepository.find(filters);

  // Store in cache (5 minutes TTL)
  await client.setEx(cacheKey, 300, JSON.stringify(trips));

  return trips;
}

// ✅ Implement cache invalidation
async function updateTrip(tripId, updates) {
  const trip = await tripRepository.update(tripId, updates);

  // Invalidate related caches
  await client.del(`trip:${tripId}`);
  await client.del("trips:*"); // Clear all trip searches

  return trip;
}
```

---

## Error Handling

### Custom Error Classes

```javascript
// utils/errors.js

class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = {}) {
    super(message, 400, "VALIDATION_ERROR");
    this.details = details;
  }
}

class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401, "UNAUTHORIZED");
  }
}

class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403, "FORBIDDEN");
  }
}

class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404, "NOT_FOUND");
  }
}

class ConflictError extends AppError {
  constructor(message = "Resource conflict") {
    super(message, 409, "CONFLICT");
  }
}

class InternalServerError extends AppError {
  constructor(message = "Internal server error") {
    super(message, 500, "INTERNAL_ERROR");
  }
}

module.exports = {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  InternalServerError,
};
```

### Global Error Handler

```javascript
// middleware/error.middleware.js

const logger = require("../utils/logger");
const { AppError } = require("../utils/errors");

const errorHandler = (error, req, res, next) => {
  let statusCode = error.statusCode || 500;
  let code = error.code || "INTERNAL_ERROR";
  let message = error.message || "Something went wrong";

  // Log error
  if (statusCode >= 500) {
    logger.error("Server error:", {
      error: message,
      stack: error.stack,
      path: req.path,
      method: req.method,
    });
  } else {
    logger.warn("Client error:", {
      error: message,
      path: req.path,
      method: req.method,
    });
  }

  // Mongoose validation error
  if (error.name === "ValidationError") {
    statusCode = 400;
    code = "VALIDATION_ERROR";
    message = Object.values(error.errors)
      .map((e) => e.message)
      .join(", ");
  }

  // JWT errors
  if (error.name === "JsonWebTokenError") {
    statusCode = 401;
    code = "INVALID_TOKEN";
    message = "Invalid token";
  }

  if (error.name === "TokenExpiredError") {
    statusCode = 401;
    code = "TOKEN_EXPIRED";
    message = "Token expired";
  }

  // PostgreSQL errors
  if (error.code === "23505") {
    // Unique constraint violation
    statusCode = 409;
    code = "DUPLICATE_RESOURCE";
    message = "Resource already exists";
  }

  // Don't leak error details in production
  if (process.env.NODE_ENV === "production" && statusCode >= 500) {
    message = "Internal server error";
  }

  // Send response
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(error.details && { details: error.details }),
    },
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  });
};

module.exports = errorHandler;
```

### Using Custom Errors

```javascript
// In service
const { NotFoundError, ValidationError } = require("../utils/errors");

async function getUserById(userId) {
  if (!userId) {
    throw new ValidationError("User ID is required");
  }

  const user = await userRepository.findById(userId);

  if (!user) {
    throw new NotFoundError(`User with ID ${userId} not found`);
  }

  return user;
}

// In controller
async function getUser(req, res, next) {
  try {
    const user = await userService.getUserById(req.params.id);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error); // Pass to error middleware
  }
}
```

---

## Logging

### Logger Configuration

```javascript
// utils/logger.js

const winston = require("winston");

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json(),
  ),
  defaultMeta: { service: process.env.SERVICE_NAME || "app" },
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, ...metadata }) => {
          let msg = `${timestamp} [${level}]: ${message}`;
          if (Object.keys(metadata).length > 0) {
            msg += ` ${JSON.stringify(metadata)}`;
          }
          return msg;
        }),
      ),
    }),
    // Write errors to error.log
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
    }),
    // Write all logs to combined.log
    new winston.transports.File({ filename: "logs/combined.log" }),
  ],
});

// If not in production, log to console with colorized output
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  );
}

module.exports = logger;
```

### Logging Best Practices

```javascript
const logger = require("./utils/logger");

// ✅ Log levels usage
logger.error("Database connection failed", { error: err.message });
logger.warn("High memory usage detected", { usage: memUsage });
logger.info("User logged in", { userId: user.id });
logger.debug("Request payload", { body: req.body });

// ✅ Log with context
logger.info("Processing payment", {
  userId: user.id,
  amount: payment.amount,
  transactionId: transaction.id,
});

// ✅ Log errors with stack trace
try {
  await processPayment(data);
} catch (error) {
  logger.error("Payment processing failed", {
    error: error.message,
    stack: error.stack,
    userId: data.userId,
  });
  throw error;
}

// ❌ DON'T log sensitive information
logger.info("User logged in", {
  userId: user.id,
  password: user.password, // ❌ Never log passwords!
  creditCard: user.creditCard, // ❌ Never log payment info!
});

// ✅ DO sanitize sensitive data
logger.info("User logged in", {
  userId: user.id,
  email: user.email.replace(/(.{2}).*(@.*)/, "$1***$2"), // Mask email
});
```

### Request Logging Middleware

```javascript
// middleware/logger.middleware.js

const logger = require("../utils/logger");

const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Log request
  logger.info("Incoming request", {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });

  // Log response
  res.on("finish", () => {
    const duration = Date.now() - startTime;

    logger.info("Request completed", {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });
  });

  next();
};

module.exports = requestLogger;
```

---

## Testing Guidelines

### Test Structure

```
tests/
├── unit/                        # Unit tests
│   ├── services/
│   │   ├── auth.service.test.js
│   │   └── user.service.test.js
│   ├── repositories/
│   └── utils/
├── integration/                 # Integration tests
│   ├── auth.test.js
│   ├── trip.test.js
│   └── booking.test.js
└── setup.js                     # Test configuration
```

### Unit Testing

```javascript
// tests/unit/services/auth.service.test.js

const authService = require("../../src/services/auth.service");
const userRepository = require("../../src/repositories/user.repository");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Mock dependencies
jest.mock("../../src/repositories/user.repository");
jest.mock("bcrypt");
jest.mock("jsonwebtoken");

describe("AuthService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("login", () => {
    it("should return user and token for valid credentials", async () => {
      // Arrange
      const mockUser = {
        user_id: 1,
        email: "test@example.com",
        password_hash: "hashed_password",
        full_name: "Test User",
        role: "passenger",
      };

      userRepository.findByEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue("mock_token");

      // Act
      const result = await authService.login("test@example.com", "password");

      // Assert
      expect(result).toHaveProperty("user");
      expect(result).toHaveProperty("token");
      expect(result.user.email).toBe("test@example.com");
      expect(result.token).toBe("mock_token");
      expect(userRepository.findByEmail).toHaveBeenCalledWith(
        "test@example.com",
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        "password",
        "hashed_password",
      );
    });

    it("should throw error for invalid email", async () => {
      // Arrange
      userRepository.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(
        authService.login("invalid@example.com", "password"),
      ).rejects.toThrow("Invalid credentials");
    });

    it("should throw error for invalid password", async () => {
      // Arrange
      const mockUser = {
        user_id: 1,
        email: "test@example.com",
        password_hash: "hashed_password",
      };

      userRepository.findByEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      // Act & Assert
      await expect(
        authService.login("test@example.com", "wrong_password"),
      ).rejects.toThrow("Invalid credentials");
    });
  });
});
```

### Integration Testing

```javascript
// tests/integration/auth.test.js

const request = require("supertest");
const app = require("../../src/index");
const pool = require("../../src/config/database");

describe("Auth API Integration Tests", () => {
  beforeAll(async () => {
    // Setup test database
    await pool.query("DELETE FROM users WHERE email LIKE '%test.com'");
  });

  afterAll(async () => {
    // Cleanup
    await pool.query("DELETE FROM users WHERE email LIKE '%test.com'");
    await pool.end();
  });

  describe("POST /auth/register", () => {
    it("should register a new user successfully", async () => {
      const response = await request(app).post("/auth/register").send({
        email: "newuser@test.com",
        password: "password123",
        fullName: "New User",
        phone: "0123456789",
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("user");
      expect(response.body.data).toHaveProperty("token");
      expect(response.body.data.user.email).toBe("newuser@test.com");
    });

    it("should return error for duplicate email", async () => {
      // First registration
      await request(app).post("/auth/register").send({
        email: "duplicate@test.com",
        password: "password123",
        fullName: "Duplicate User",
      });

      // Second registration with same email
      const response = await request(app).post("/auth/register").send({
        email: "duplicate@test.com",
        password: "password123",
        fullName: "Duplicate User 2",
      });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("DUPLICATE_RESOURCE");
    });

    it("should return error for invalid input", async () => {
      const response = await request(app).post("/auth/register").send({
        email: "invalid-email",
        password: "123", // Too short
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("POST /auth/login", () => {
    beforeAll(async () => {
      // Create test user
      await request(app).post("/auth/register").send({
        email: "logintest@test.com",
        password: "password123",
        fullName: "Login Test User",
      });
    });

    it("should login successfully with valid credentials", async () => {
      const response = await request(app).post("/auth/login").send({
        email: "logintest@test.com",
        password: "password123",
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("token");
    });

    it("should return error for invalid credentials", async () => {
      const response = await request(app).post("/auth/login").send({
        email: "logintest@test.com",
        password: "wrong_password",
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("UNAUTHORIZED");
    });
  });
});
```

### Frontend Testing (React)

```javascript
// frontend/src/tests/Login.test.jsx

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Login from "../pages/Login";
import * as authApi from "../api/auth";

// Mock API
jest.mock("../api/auth");

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderLogin = () => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    </QueryClientProvider>,
  );
};

describe("Login Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render login form", () => {
    renderLogin();

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in/i }),
    ).toBeInTheDocument();
  });

  it("should show validation errors for empty fields", async () => {
    renderLogin();

    const submitButton = screen.getByRole("button", { name: /sign in/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it("should login successfully with valid credentials", async () => {
    authApi.login.mockResolvedValue({
      data: {
        user: { id: 1, email: "test@test.com", role: "passenger" },
        token: "mock_token",
      },
    });

    renderLogin();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@test.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "password123" },
    });

    const submitButton = screen.getByRole("button", { name: /sign in/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith({
        email: "test@test.com",
        password: "password123",
      });
    });
  });
});
```

### Test Coverage Goals

- **Unit Tests**: Minimum 80% coverage cho services và utilities
- **Integration Tests**: Cover all API endpoints
- **Frontend Tests**: Cover critical user journeys

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- auth.test.js

# Run in watch mode
npm test -- --watch

# Run integration tests only
npm test -- --testPathPattern=integration
```

---

## Code Review Process

### Before Creating Pull Request

- [ ] Code compiles without errors
- [ ] All tests pass
- [ ] Linting passes (`npm run lint`)
- [ ] Code is formatted (`npm run format`)
- [ ] No console.log statements (use logger)
- [ ] Environment variables documented
- [ ] README updated if needed

### Pull Request Guidelines

#### PR Title Format

```
<type>(<scope>): <description>

Examples:
feat(trip): add advanced search filters
fix(auth): resolve token expiration issue
docs(readme): update installation guide
```

#### PR Description Template

```markdown
## Description

Brief description of what this PR does.

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Related Issues

Closes #123

## Changes Made

- Change 1
- Change 2
- Change 3

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing performed

## Screenshots (if applicable)

[Add screenshots here]

## Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests pass locally
```

### Code Review Checklist

#### Functionality

- [ ] Code works as intended
- [ ] Edge cases handled
- [ ] Error handling implemented

#### Code Quality

- [ ] Follows coding standards
- [ ] No code duplication
- [ ] Functions are small and focused
- [ ] Variable names are descriptive

#### Security

- [ ] No sensitive data exposed
- [ ] Input validation implemented
- [ ] SQL injection prevented
- [ ] XSS prevented

#### Performance

- [ ] No unnecessary database queries
- [ ] Caching implemented where appropriate
- [ ] Pagination for large datasets

#### Testing

- [ ] Tests cover new functionality
- [ ] Tests are meaningful
- [ ] Tests pass

### Giving Feedback

````markdown
✅ GOOD:
"Consider using async/await here instead of promises for better readability:

```javascript
async function getData() {
  try {
    const result = await api.fetch();
    return result;
  } catch (error) {
    handleError(error);
  }
}
```
````

"

❌ BAD:
"This code is bad."

````

### Receiving Feedback

- Be open to feedback
- Ask questions if unclear
- Don't take it personally
- Respond promptly
- Thank reviewers for their time

---

## Documentation

### Code Comments

```javascript
// ✅ GOOD: Comment explains WHY, not WHAT
// Use constant-time comparison to prevent timing attacks
const isValid = crypto.timingSafeEqual(Buffer.from(hash1), Buffer.from(hash2));

// ❌ BAD: Comment explains obvious WHAT
// Compare hash1 and hash2
const isValid = hash1 === hash2;

// ✅ GOOD: Document complex business logic
/**
 * Calculate dynamic pricing based on demand, time, and availability.
 * Price increases by 10% for each 10% decrease in available seats.
 * Weekend prices are 20% higher than weekday prices.
 * Peak hours (6-9 AM, 5-8 PM) have 15% surcharge.
 */
function calculateDynamicPrice(basePrice, availableSeats, totalSeats, departureTime) {
  // Implementation
}

// ✅ GOOD: Document public API with JSDoc
/**
 * Search for trips based on filters.
 *
 * @param {Object} filters - Search filters
 * @param {string} filters.origin - Origin location
 * @param {string} filters.destination - Destination location
 * @param {string[]} [filters.busType] - Bus types (optional)
 * @param {number} [filters.page=1] - Page number
 * @param {number} [filters.limit=10] - Items per page
 * @returns {Promise<Object>} Search results with pagination
 * @throws {ValidationError} If filters are invalid
 *
 * @example
 * const results = await searchTrips({
 *   origin: 'Ho Chi Minh City',
 *   destination: 'Hanoi',
 *   busType: ['limousine', 'sleeper'],
 *   page: 1,
 *   limit: 20
 * });
 */
async function searchTrips(filters) {
  // Implementation
}
````

### README Documentation

Each service should have a comprehensive README with:

1. **Overview**: What the service does
2. **Features**: Key features list
3. **Installation**: How to install dependencies
4. **Configuration**: Environment variables
5. **Usage**: How to run the service
6. **API Documentation**: Link to API docs
7. **Testing**: How to run tests
8. **Deployment**: Deployment instructions

### API Documentation

Use the [API_TEMPLATE.md](./API_TEMPLATE.md) để document tất cả endpoints với:

- Method và URL
- Authentication requirements
- Request parameters
- Response format
- Error codes
- Example requests

---

## Continuous Integration

### Pre-commit Hooks (Husky)

```javascript
// .husky/pre-commit

#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "🔍 Running pre-commit checks..."

# Run lint-staged
npx lint-staged

echo "✅ Pre-commit checks passed!"
```

### Lint-staged Configuration

```javascript
// package.json
{
  "lint-staged": {
    "frontend/src/**/*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "backend/**/*.js": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,css,yml,yaml}": [
      "prettier --write"
    ]
  }
}
```

---

## Performance Best Practices

### Database Optimization

```javascript
// ✅ Use indexes for frequently queried columns
CREATE INDEX idx_trips_origin_destination ON trips(origin, destination);
CREATE INDEX idx_trips_departure_time ON trips(departure_time);
CREATE INDEX idx_users_email ON users(email);

// ✅ Use EXPLAIN ANALYZE to optimize queries
const result = await pool.query(`
  EXPLAIN ANALYZE
  SELECT * FROM trips
  WHERE origin = $1 AND destination = $2
  ORDER BY departure_time
`, ['Ho Chi Minh City', 'Hanoi']);

// ✅ Use pagination for large datasets
async function getTrips(page = 1, limit = 10) {
  const offset = (page - 1) * limit;
  const query = `
    SELECT * FROM trips
    LIMIT $1 OFFSET $2
  `;
  return await pool.query(query, [limit, offset]);
}
```

### Caching Strategy

```javascript
// ✅ Cache frequently accessed data
const CACHE_TTL = 5 * 60; // 5 minutes

async function getTripById(tripId) {
  const cacheKey = `trip:${tripId}`;

  // Check cache
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // Fetch from database
  const trip = await tripRepository.findById(tripId);

  // Store in cache
  await redis.setEx(cacheKey, CACHE_TTL, JSON.stringify(trip));

  return trip;
}
```

### API Response Optimization

```javascript
// ✅ Use compression
const compression = require("compression");
app.use(compression());

// ✅ Implement pagination
// ✅ Use field selection (only return needed fields)
// ✅ Use ETags for caching
```

---

## Security Best Practices

### Input Validation

```javascript
// ✅ Always validate and sanitize input
const Joi = require("joi");

const schema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(100).required(),
});

const { error, value } = schema.validate(req.body);
if (error) {
  throw new ValidationError(error.details[0].message);
}
```

### Authentication & Authorization

```javascript
// ✅ Hash passwords with bcrypt
const hashedPassword = await bcrypt.hash(password, 10);

// ✅ Use secure JWT tokens
const token = jwt.sign(
  { id: user.id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: "15m" },
);

// ✅ Implement rate limiting
const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP",
});

app.use("/api", limiter);
```

### CORS Configuration

```javascript
// ✅ Properly configure CORS
const cors = require("cors");

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
```

---

## Resources

### Documentation

- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [JavaScript Style Guide](https://github.com/airbnb/javascript)
- [Conventional Commits](https://www.conventionalcommits.org/)

### Tools

- [ESLint](https://eslint.org/)
- [Prettier](https://prettier.io/)
- [Jest](https://jestjs.io/)
- [Husky](https://typicode.github.io/husky/)

---

**Last Updated**: December 1, 2025  
**Maintained by**: Development Team

**Questions?** Create an issue or contact the development team.
