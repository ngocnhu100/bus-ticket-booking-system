# Chatbot Service - Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### 1. Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- OpenAI API key

### 2. Install
```bash
cd backend/services/chatbot-service
npm install
```

### 3. Configure
```bash
cp .env.example .env
```

Edit `.env` and set your OpenAI API key:
```env
OPENAI_API_KEY=sk-your-actual-key-here
```

### 4. Database
Run migrations:
```bash
psql -U postgres -d bus_ticket_dev -f ../../sql/026_create_chatbot_sessions_table.sql
psql -U postgres -d bus_ticket_dev -f ../../sql/027_create_chatbot_messages_table.sql
psql -U postgres -d bus_ticket_dev -f ../../sql/028_create_chatbot_feedback_table.sql
```

### 5. Start
```bash
npm run dev
```

Service runs on http://localhost:3007

### 6. Test
```bash
# Quick health check (via API Gateway - recommended)
curl http://localhost:3000/chatbot/health

# Direct service health check
curl http://localhost:3007/health

# Try a query (via API Gateway)
curl -X POST http://localhost:3000/chatbot/query \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!"}'

# Run full test suite
node test-chatbot.js
```

## 📋 Common Use Cases

**All examples use API Gateway (http://localhost:3000/chatbot)**

### Search for Trips
```javascript
POST /chatbot/query
{
  "message": "Find buses from Ho Chi Minh City to Da Nang tomorrow"
}
```

### Ask FAQ
```javascript
POST /chatbot/query
{
  "message": "What is your cancellation policy?"
}
```

### Continue Conversation
```javascript
POST /chatbot/query
{
  "sessionId": "session_xxx",
  "message": "Show me morning trips"
}
```

### Create Booking
```javascript
POST /chatbot/book
{
  "sessionId": "session_xxx",
  "tripId": "trp_123",
  "seats": ["A1"],
  "passengerInfo": {
    "fullName": "John Doe",
    "documentId": "123456789",
    "phone": "+84901234567"
  }
}
```

## 🔑 Key Files

| File | Purpose |
|------|---------|
| `src/index.js` | Main entry point |
| `src/services/openaiService.js` | OpenAI integration |
| `src/services/chatbotService.js` | Core business logic |
| `src/controllers/chatbotController.js` | API endpoints |
| `src/prompts/index.js` | AI prompts |
| `docs/API.md` | Full API documentation |
| `test-chatbot.js` | Test suite |

## 🐛 Troubleshooting

### "OpenAI API key not configured"
→ Set `OPENAI_API_KEY` in `.env`

### "Cannot connect to database"
→ Check PostgreSQL is running and connection details in `.env`

### "Redis connection failed"
→ Start Redis or check `REDIS_URL` in `.env`

### "Rate limit exceeded"
→ Check your OpenAI account limits and billing
  
→ Ensure API Gateway is running on port 3000
### Tests failing
→ Ensure other services (trip-service, booking-service) are running

## 📊 Environment Variables

| Variable | Default | Required |
|----------|---------|----------|
| `PORT` | 3007 | No |
| `OPENAI_API_KEY` | - | **Yes** |
| `OPENAI_MODEL` | gpt-4-turbo-preview | No |
| `DB_HOST` | localhost | Yes |
| `DB_PORT` | 5432 | Yes |
| `DB_NAME` | bus_ticket_dev | Yes |
| `REDIS_URL` | redis://localhost:6379 | Yes |
| `TRIP_SERVICE_URL` | http://localhost:3002 | Yes |
| `BOOKING_SERVICE_URL` | http://localhost:3004 | Yes |

## 🐳 Docker

### Build
```bash
docker build -t chatbot-service .
```

### Run
```bash
docker run -p 3007:3007 --env-file .env chatbot-service
```

### Docker Compose
```bash
cd backend
docker-compose up chatbot-service
```

## 📚 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/chatbot/query` | Send message |
| POST | `/chatbot/book` | Create booking |
| GET | `/chatbot/sessions/:sessionId/history` | Get history |
| POST | `/chatbot/sessions/:sessionId/reset` | Reset conversation |
| POST | `/chatbot/feedback` | Submit feedback |

## 🎯 Example Queries

**Vietnamese:**
- "Tôi muốn đi từ Sài Gòn ra Đà Nẵng ngày mai"
- "Có chuyến nào đi Hà Nội buổi tối không?"
- "Chính sách hoàn vé như thế nào?"

**English:**
- "Find trips from HCMC to Hanoi on December 25"
- "Show me evening buses to Da Nang"
- "What is your refund policy?"

## 💡 Pro Tips

1. **Session Management**: Store sessionId in frontend to maintain conversation
2. **Error Handling**: Always check `success` field in responses
3. **Rate Limiting**: Implement user-level throttling
4. **Monitoring**: Log OpenAI API usage and costs
5. **Testing**: Use test-chatbot.js before deploying changes

## 📖 Further Reading

- `docs/API.md` - Complete API reference
- `IMPLEMENTATION.md` - Technical deep-dive
- `README.md` - Service overview
- Epic 8 in `document/11-user-stories/README.md` - Requirements

## 🆘 Need Help?

1. Check logs: `docker logs bus-ticket-chatbot-service`
2. Verify services: `docker ps`
3. Test endpoint: `curl http://localhost:3007/health`
4. Run tests: `node test-chatbot.js`
5. Review API docs: `docs/API.md`

## ✅ Checklist

Before deploying:
- [ ] OpenAI API key configured
- [ ] Database migrations applied
- [ ] Redis is running
- [ ] Trip service is accessible
- [ ] Booking service is accessible
- [ ] Health check passes
- [ ] Test suite passes
- [ ] Environment variables set

---

**You're all set! 🎉**

Start the service and try:
```bash
# Via API Gateway (recommended)
curl -X POST http://localhost:3000/chatbot/query \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!"}'

# Or direct service access
curl -X POST http://localhost:3007/query \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!"}'
```