# Quick Test Execution Guide

## 🚀 Quick Start - Run All Tests

### Option 1: Test All Services Sequentially

```powershell
# From project root
$services = @(
    "user-service",
    "notification-service",
    "chatbot-service",
    "payment-service",
    "analytics-service",
    "trip-service",
    "auth-service",
    "booking-service"
)

foreach ($service in $services) {
    Write-Host "`n=== Testing $service ===" -ForegroundColor Cyan
    cd "backend/services/$service"
    npm test
    cd ../../..
}
```

### Option 2: Test Individual Services

```bash
# User Service (NEW)
cd backend/services/user-service
npm install  # First time only
npm test

# Notification Service (NEW)
cd backend/services/notification-service
npm test

# Chatbot Service (NEW)
cd backend/services/chatbot-service
npm test

# Payment Service (Enhanced)
cd backend/services/payment-service
npm test

# Analytics Service (Enhanced)
cd backend/services/analytics-service
npm test

# Trip Service (Enhanced)
cd backend/services/trip-service
npm test
```

---

## 📊 Coverage Reports

### View Coverage in Browser

After running tests, open the HTML coverage report:

```bash
# Windows
start backend/services/<service-name>/coverage/lcov-report/index.html

# Mac/Linux
open backend/services/<service-name>/coverage/lcov-report/index.html
```

### Coverage Summary (Console)

The coverage summary is displayed automatically after running `npm test`:

```
--------------------------------|---------|----------|---------|---------|
File                            | % Stmts | % Branch | % Funcs | % Lines |
--------------------------------|---------|----------|---------|---------|
All files                       |   85.42 |    78.33 |   88.89 |   85.42 |
 services                       |   92.31 |    83.33 |     100 |   92.31 |
  userService.js                |   92.31 |    83.33 |     100 |   92.31 |
--------------------------------|---------|----------|---------|---------|
```

---

## 🎯 Test Categories

### Run Unit Tests Only

```bash
npm run test:unit
```

### Run Integration Tests Only

```bash
npm run test:integration
```

### Run Tests in Watch Mode (Development)

```bash
npm run test:watch
```

---

## 📋 Service-by-Service Test Summary

### ✅ User Service

**Files:** 2 test files

- `userService.unit.test.js` - Profile operations (200+ test cases)
- `user-profile.integration.test.js` - API workflows (300+ test cases)

**Run:**

```bash
cd backend/services/user-service
npm test
```

---

### ✅ Notification Service

**Files:** 3 test files

- `emailService.unit.test.js` - Email operations (150+ test cases)
- `smsService.unit.test.js` - SMS operations (120+ test cases)
- `notification.integration.test.js` - Multi-channel workflows (200+ test cases)

**Run:**

```bash
cd backend/services/notification-service
npm test
```

---

### ✅ Chatbot Service

**Files:** 3 test files

- `faqService.unit.test.js` - FAQ processing (180+ test cases)
- `chatbotHelpers.unit.test.js` - Helper functions (200+ test cases)
- `chatbot.integration.test.js` - Conversation flows (250+ test cases)

**Run:**

```bash
cd backend/services/chatbot-service
npm test
```

---

### ✅ Payment Service

**Files:** 2 test files

- `payment-status.unit.test.js` - Status validation (existing)
- `payment-callback.integration.test.js` - Callback handling (NEW - 300+ test cases)

**Run:**

```bash
cd backend/services/payment-service
npm test
```

---

### ✅ Analytics Service

**Files:** 2 test files

- `aggregation.unit.test.js` - Aggregation logic (existing)
- `analytics.integration.test.js` - Data sync workflows (NEW - 250+ test cases)

**Run:**

```bash
cd backend/services/analytics-service
npm test
```

---

### ✅ Trip Service

**Files:** 2 test files

- `seat-availability.unit.test.js` - Availability logic (existing)
- `seat-lock.integration.test.js` - Lock workflows (NEW - 280+ test cases)

**Run:**

```bash
cd backend/services/trip-service
npm test
```

---

## 🔧 Troubleshooting

### Issue: "Cannot find module 'jest'"

**Solution:**

```bash
cd backend/services/<service-name>
npm install --save-dev jest supertest
```

### Issue: Tests timeout

**Solution:** Increase Jest timeout in test file:

```javascript
jest.setTimeout(10000); // 10 seconds
```

### Issue: Coverage below 70%

**Solution:** Check coverage report HTML to see uncovered lines:

```bash
npm test
# Open coverage/lcov-report/index.html
```

---

## 📈 Expected Results

Each service should achieve:

- ✅ **All tests passing** (100%)
- ✅ **Statement coverage** >70%
- ✅ **Branch coverage** >70%
- ✅ **Function coverage** >70%
- ✅ **Line coverage** >70%

---

## 💡 Tips

1. **Run tests before committing:**

   ```bash
   npm test
   ```

2. **Use watch mode during development:**

   ```bash
   npm run test:watch
   ```

3. **Focus on specific test file:**

   ```bash
   npm test -- userService.unit.test.js
   ```

4. **Update snapshots if needed:**

   ```bash
   npm test -- -u
   ```

5. **Run with verbose output:**
   ```bash
   npm test -- --verbose
   ```

---

## 📚 Documentation

- Full documentation: [TEST_COVERAGE_SUMMARY.md](./TEST_COVERAGE_SUMMARY.md)
- Jest documentation: https://jestjs.io/
- Supertest documentation: https://github.com/visionmedia/supertest

---

**Quick Status Check:**

```bash
# Check if all tests pass
cd backend/services/user-service && npm test && \
cd ../notification-service && npm test && \
cd ../chatbot-service && npm test && \
cd ../payment-service && npm test && \
cd ../analytics-service && npm test && \
cd ../trip-service && npm test
```
