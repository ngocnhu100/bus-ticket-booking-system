# Chatbot Service - API Gateway Integration

## ✅ Integration Complete

The chatbot service has been successfully integrated with the API Gateway.

## 🔄 Changes Made

### 1. Chatbot Service Routes
**File**: `backend/services/chatbot-service/src/index.js`

Routes now use the **base path** without `/chatbot` prefix:
```javascript
// Before (incorrect for API Gateway)
app.post('/chatbot/query', ...)

// After (correct)
app.post('/query', ...)
```

**All Routes:**
- `POST /query` - Send message
- `POST /book` - Create booking
- `GET /sessions/:sessionId/history` - Get history
- `POST /sessions/:sessionId/reset` - Reset conversation
- `POST /feedback` - Submit feedback

### 2. API Gateway Configuration
**File**: `backend/api-gateway/src/index.js`

Added chatbot service proxy route:
```javascript
app.use('/chatbot', async (req, res) => {
  // Proxies all /chatbot/* requests to chatbot-service
  // Example: /chatbot/query → http://chatbot-service:3007/query
});
```

**Added to environment variables:**
- `CHATBOT_SERVICE_URL=http://chatbot-service:3007`

**Added to startup logs:**
- Shows chatbot service URL on startup

## 🌐 Access Patterns

### Via API Gateway (Recommended for Production)
```bash
# Base URL
http://localhost:3000/chatbot

# Examples
curl -X POST http://localhost:3000/chatbot/query \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'

curl http://localhost:3000/chatbot/health
```

### Direct Service Access (Development/Testing)
```bash
# Base URL
http://localhost:3007

# Examples
curl -X POST http://localhost:3007/query \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'

curl http://localhost:3007/health
```

## 🔌 Request Flow

```
Frontend
   ↓
API Gateway (Port 3000)
   ↓
/chatbot/* routes
   ↓
Chatbot Service (Port 3007)
   ↓
/* routes (without /chatbot prefix)
```

**Example:**
```
Request:  POST http://localhost:3000/chatbot/query
Gateway:  Proxies to → http://chatbot-service:3007/query
Service:  Handles → POST /query
```

## 📋 Complete Endpoint Mapping

| Client Request | API Gateway | Chatbot Service |
|----------------|-------------|-----------------|
| `GET /chatbot/health` | → | `GET /health` |
| `POST /chatbot/query` | → | `POST /query` |
| `POST /chatbot/book` | → | `POST /book` |
| `GET /chatbot/sessions/:id/history` | → | `GET /sessions/:id/history` |
| `POST /chatbot/sessions/:id/reset` | → | `POST /sessions/:id/reset` |
| `POST /chatbot/feedback` | → | `POST /feedback` |

## 🔧 Configuration

### API Gateway Environment Variables
```env
# In backend/docker-compose.yml or backend/api-gateway/.env
CHATBOT_SERVICE_URL=http://chatbot-service:3007
```

### Chatbot Service Environment Variables
```env
# In backend/services/chatbot-service/.env
PORT=3007
OPENAI_API_KEY=sk-your-key-here
# ... other config
```

## 🧪 Testing

### Test via API Gateway
```bash
# Run the test script (updated to use API Gateway)
cd backend/services/chatbot-service
node test-chatbot.js
```

### Manual Testing
```bash
# Via API Gateway
curl http://localhost:3000/chatbot/health

curl -X POST http://localhost:3000/chatbot/query \
  -H "Content-Type: application/json" \
  -d '{"message": "Find trips from HCMC to Da Nang"}'

# Direct service (for debugging)
curl http://localhost:3007/health

curl -X POST http://localhost:3007/query \
  -H "Content-Type: application/json" \
  -d '{"message": "Find trips from HCMC to Da Nang"}'
```

## 📝 Frontend Integration

When integrating with the frontend, use the **API Gateway URL**:

```javascript
// Correct - Use API Gateway
const API_BASE_URL = 'http://localhost:3000';

// Send message
const response = await fetch(`${API_BASE_URL}/chatbot/query`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}` // Optional
  },
  body: JSON.stringify({
    sessionId: sessionId,
    message: userMessage
  })
});

// Get history
const history = await fetch(`${API_BASE_URL}/chatbot/sessions/${sessionId}/history`);
```

## 🔒 Authentication

The chatbot service supports **both** guest and authenticated users:

```javascript
// Guest user (no token)
fetch('http://localhost:3000/chatbot/query', {
  method: 'POST',
  body: JSON.stringify({ message: 'Hello' })
});

// Authenticated user (with token)
fetch('http://localhost:3000/chatbot/query', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${userToken}`
  },
  body: JSON.stringify({ message: 'Hello' })
});
```

API Gateway passes the `Authorization` header to the chatbot service, which uses `optionalAuthenticate` middleware.

## 🚀 Deployment Checklist

- [x] Chatbot service routes updated (remove `/chatbot` prefix)
- [x] API Gateway proxy route added (`/chatbot/*`)
- [x] Environment variable added (`CHATBOT_SERVICE_URL`)
- [x] Docker Compose configuration updated
- [x] API documentation updated
- [x] Test script updated to use API Gateway
- [x] Startup logs updated to show chatbot service

## 📊 Monitoring

Check logs to verify requests are being proxied correctly:

```bash
# API Gateway logs
docker logs bus-ticket-api-gateway

# Look for lines like:
# 🤖 Proxying POST /chatbot/query to http://chatbot-service:3007/query
# ✅ Chatbot service responded with status 200

# Chatbot Service logs
docker logs bus-ticket-chatbot-service
```

## ❗ Common Issues

### Issue: 404 Not Found on /chatbot/query
**Cause**: API Gateway can't reach chatbot service  
**Solution**: Check `CHATBOT_SERVICE_URL` is set and service is running

### Issue: Routes returning 404
**Cause**: Using wrong endpoint format  
**Solution**: Use `/chatbot/query` (not `/chatbot/chatbot/query`)

### Issue: Direct service access works but Gateway doesn't
**Cause**: Environment variable not set or service name incorrect  
**Solution**: Verify Docker network and service names in docker-compose.yml

### Issue: CORS errors
**Cause**: Frontend making requests to wrong origin  
**Solution**: Ensure frontend uses API Gateway URL, not direct service URL

## ✨ Benefits of API Gateway Integration

1. **Single Entry Point**: Frontend only needs to know API Gateway URL
2. **Centralized Auth**: Authentication handled consistently
3. **Load Balancing**: Gateway can distribute load across multiple instances
4. **Rate Limiting**: Easier to implement at gateway level
5. **Logging**: Centralized request/response logging
6. **CORS**: Configured once at gateway level
7. **Versioning**: Can route to different service versions
8. **Security**: Internal service IPs hidden from clients

## 📚 Documentation

- **API Reference**: [docs/API.md](./docs/API.md)
- **Quick Start**: [QUICK_START.md](./QUICK_START.md)
- **Implementation**: [IMPLEMENTATION.md](./IMPLEMENTATION.md)

---

**Status**: ✅ Integration Complete

All requests should now go through the API Gateway at `http://localhost:3000/chatbot/*`
