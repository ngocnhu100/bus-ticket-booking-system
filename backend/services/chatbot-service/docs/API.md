# Chatbot Service API Documentation

Complete API reference for the AI Chatbot Service.

## Base URL

**Via API Gateway (Recommended):**
```
http://localhost:3000/chatbot
```

**Direct Service Access:**
```
http://localhost:3007
```

## Authentication

All endpoints support both guest and authenticated users:
- **Guest users**: No authentication required
- **Authenticated users**: Include JWT token in Authorization header

```
Authorization: Bearer <your-jwt-token>
```

---

## Endpoints

### 1. Health Check

Check if the service is running.

**Endpoint:** `GET /health`

**Request:**
```bash
# Via API Gateway
curl http://localhost:3000/chatbot/health

# Direct service access
curl http://localhost:3007/health
```

**Response:** `200 OK`
```json
{
  "success": true,
  "service": "chatbot-service",
  "status": "healthy",
  "timestamp": "2025-12-22T10:30:00.000Z"
}
```

---

### 2. Send Message to Chatbot (via API Gateway) or `POST /query` (direct)

Send a message and get AI-powered response.

**Endpoint:** `POST /chatbot/query`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <token> (optional)
```

**Request Body:**
```json
{
  "sessionId": "session_abc123",
  "message": "Tôi muốn đi từ Sài Gòn ra Đà Nẵng ngày mai",
  "context": {
    "userId": "usr_abc123",
    "previousMessages": []
  }
}
```

**Parameters:**
- `sessionId` (optional): Session identifier. If not provided, a new session will be created
- `message` (required): User's message
- `context` (optional): Additional context information

**Example Request:**
```bash
# Via API Gateway (Recommended)
curl -X POST http://localhost:3000/chatbot/query \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tôi muốn đi từ Sài Gòn ra Đà Nẵng ngày mai"
  }'

# Direct service access
curl -X POST http://localhost:3007/query \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tôi muốn đi từ Sài Gòn ra Đà Nẵng ngày mai"
  }'
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "sessionId": "session_abc123",
    "response": {
      "text": "I found 24 trips from Ho Chi Minh City to Da Nang for tomorrow. Here are the top options:",
      "intent": "search_trips",
      "entities": {
        "origin": "Ho Chi Minh City",
        "destination": "Da Nang",
        "date": "2025-12-23"
      },
      "suggestions": [
        "Show morning trips",
        "Filter by price",
        "Book the first trip"
      ],
      "actions": [
        {
          "type": "search_results",
          "data": [
            {
              "tripId": "trp_xyz789",
              "departureTime": "08:00",
              "arrivalTime": "20:00",
              "price": 360000,
              "availableSeats": 25,
              "busType": "Limousine",
              "operator": "Futa Bus Lines"
            }
          ]
        }
      ]
    },
    "messageId": "msg_def456"
  },
  "timestamp": "2025-12-22T10:30:00.000Z"
}
```

**Example Conversations:**

#### Trip Search
```json
{
  "message": "Find buses from Ho Chi Minh City to Da Nang on 2025-12-25"
}
```

#### FAQ Question
```json
{
  "message": "Chính sách hoàn vé như thế nào?"
}
```

#### Booking Intent
```json
{
  "sessionId": "session_abc123",
  "message": "Tôi muốn đặt ghế A1"
}
```

---

### 3. Create Booking Through Chatbot

Complete a booking through the conversational interface.

**Endpoint:** `POST /chatbot/book` (via API Gateway) or `POST /book` (direct)

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <token> (optional for guest checkout)
```

**Request Body:**
```json
{
  "sessionId": "session_abc123",
  "tripId": "01b715bc-448a-441e-b53f-17cccc1b7c88",
  "seats": ["A1", "A2"],
  "passengerInfo": {
    "fullName": "Nguyen Van A",
    "documentId": "079012345678",
    "phone": "+84901234567",
    "email": "nguyenvana@example.com"
  }
}
```

**Parameters:**
- `sessionId` (required): Session identifier from previous conversation
- `tripId` (required): UUID of the trip to book (must be valid UUID format)
- `seats` (required): Array of seat codes (e.g., ["A1", "A2", "B5"])
  - Each seat must match pattern: A1, B2, 1A, 2B, or VIP2C
  - Maximum 10 seats per booking
- `passengerInfo` (required): Single passenger info that will be used for all seats
  - `fullName` (required): 2-100 characters
  - `phone` (required): Vietnamese format (+84xxxxxxxxx or 0xxxxxxxxx)
  - `documentId` (required): 9-12 digits
  - `email` (required): Valid email address

**📝 Important Notes:**
- The same passenger info will be assigned to ALL selected seats
- For multiple different passengers, use the direct booking-service API instead
- Guest checkout is supported (no auth token required)

**Postman Test Request:**

**URL:** `http://localhost:3000/chatbot/book`

**Method:** `POST`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "sessionId": "session_test_123",
  "tripId": "01b715bc-448a-441e-b53f-17cccc1b7c88",
  "seats": ["A1", "A2"],
  "passengerInfo": {
    "fullName": "Nguyen Van A",
    "documentId": "079012345678",
    "phone": "+84901234567",
    "email": "nguyenvana@example.com"
  }
}
```

**cURL Command:**
```bash
curl -X POST http://localhost:3000/chatbot/book \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session_test_123",
    "tripId": "01b715bc-448a-441e-b53f-17cccc1b7c88",
    "seats": ["A1", "A2"],
    "passengerInfo": {
      "fullName": "Nguyen Van A",
      "documentId": "079012345678",
      "phone": "+84901234567",
      "email": "nguyenvana@example.com"
    }
  }'
```

**✅ Success Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "success": true,
    "bookingId": "46e24fdb-ff8f-45a6-aa32-99687bd9e281",
    "bookingReference": "BK20251222907",
    "message": "Booking created successfully! Your booking reference is BK20251222907. Please complete payment within 10 minutes."
  },
  "timestamp": "2025-12-22T10:05:11.794Z"
}
```

**📝 Note:** The `paymentInfo` field will only be included if payment processing is configured in the booking service.

**❌ Error Responses:**

**Validation Error:** `422 Unprocessable Entity`
```json
{
  "success": false,
  "error": {
    "code": "VAL_001",
    "message": "Invalid trip ID format"
  },
  "timestamp": "2025-12-22T10:30:00.000Z"
}
```

**Seats Already Booked:** `409 Conflict`
```json
{
  "success": false,
  "error": {
    "code": "BOOK_001",
    "message": "Seats A1, A2 are already booked"
  },
  "timestamp": "2025-12-22T10:30:00.000Z"
}
```

**Server Error:** `500 Internal Server Error`
```json
{
  "success": false,
  "error": {
    "code": "CHAT_002",
    "message": "Failed to create booking"
  },
  "timestamp": "2025-12-22T10:30:00.000Z"
}
```

**Common Test Cases:**

1. **Single Seat Booking:**
```json
{
  "sessionId": "test_001",
  "tripId": "01b715bc-448a-441e-b53f-17cccc1b7c88",
  "seats": ["A1"],
  "passengerInfo": {
    "fullName": "Test User",
    "documentId": "123456789",
    "phone": "0901234567",
    "email": "test@example.com"
  }
}
```

2. **Multiple Seats (same passenger):**
```json
{
  "sessionId": "test_002",
  "tripId": "01b715bc-448a-441e-b53f-17cccc1b7c88",
  "seats": ["A1", "A2", "B1"],
  "passengerInfo": {
    "fullName": "Family Group",
    "documentId": "987654321",
    "phone": "+84912345678",
    "email": "family@example.com"
  }
}
```

---

### 4. Get Conversation History

Retrieve message history for a session.
 (via API Gateway) or `GET /sessions/:sessionId/history` (direct)
**Endpoint:** `GET /chatbot/sessions/:sessionId/history`

**Headers:**
```
Authorization: Bearer <token> (optional)
```

**Example Request:**
```bash
# Via API Gateway (Recommended)
curl http://localhost:3000/chatbot/sessions/session_abc123/history

# Direct service access
curl http://localhost:3007/sessions/session_abc123/history
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "sessionId": "session_abc123",
    "messages": [
      {
        "message_id": "msg_001",
        "session_id": "session_abc123",
        "role": "user",
        "content": "Tôi muốn đi từ Sài Gòn ra Đà Nẵng",
        "metadata": {},
        "created_at": "2025-12-22T10:25:00.000Z"
      },
      {
        "message_id": "msg_002",
        "session_id": "session_abc123",
        "role": "assistant",
        "content": "When would you like to travel?",
        "metadata": {
          "intent": "search_trips",
          "actions": []
        },
        "created_at": "2025-12-22T10:25:02.000Z"
      }
    ],
    "count": 2
  },
  "timestamp": "2025-12-22T10:30:00.000Z"
}
```

---

### 5. Reset Conversation (via API Gateway) or `POST /sessions/:sessionId/reset` (direct)

Clear conversation history and booking context for a session.

**Endpoint:** `POST /chatbot/sessions/:sessionId/reset`

**Headers:**
```
Authorization: Bearer <token> (optional)
# Via API Gateway (Recommended)
curl -X POST http://localhost:3000/chatbot/sessions/session_abc123/reset

# Direct service access
curl -X POST http://localhost:3007

**Example Request:**
```bash
curl -X POST http://localhost:3007/chatbot/sessions/session_abc123/reset
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Conversation reset successfully"
  },
  "timestamp": "2025-12-22T10:30:00.000Z"
}
``` (via API Gateway) or `POST /feedback` (direct)

---

### 6. Submit Feedback

Rate a chatbot response.

**Endpoint:** `POST /chatbot/feedback` (via API Gateway) or `POST /feedback` (direct)

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <token> (optional)
```

**⚠️ Prerequisites:**
- The `sessionId` must be from an actual conversation (created via `/query` endpoint)
- The `messageId` must be from a message in that session
- Sessions and messages must exist in the database

**Request Body:**
```json
{
  "sessionId": "session_df59ff8a-dfe4-49e6-bb63-7275481b7280",
  "messageId": "msg_bcf68c75-6492-4cf0-bba8-849c793a6ed2",
  "rating": "positive",
  "comment": "Very helpful response!"
}
```

**Parameters:**
- `sessionId` (required): Valid session identifier from an existing conversation
- `messageId` (required): Valid message ID from that session
- `rating` (required): "positive" or "negative"
- `comment` (optional): Optional text feedback (max 500 characters)

**Postman Test Flow:**

**Step 1: Create a conversation first**
```bash
POST http://localhost:3000/chatbot/query
Content-Type: application/json

{
  "message": "Hello, I need help"
}
```

**Step 2: Use the sessionId and messageId from the response**
```bash
POST http://localhost:3000/chatbot/feedback
Content-Type: application/json

{
  "sessionId": "<sessionId from step 1>",
  "messageId": "<messageId from step 1>",
  "rating": "positive",
  "comment": "Very helpful!"
}
```

**cURL Command:**
```bash
# First create a conversation
curl -X POST http://localhost:3000/chatbot/query \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'

# Then submit feedback with the returned sessionId and messageId
curl -X POST http://localhost:3000/chatbot/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session_df59ff8a-dfe4-49e6-bb63-7275481b7280",
    "messageId": "msg_bcf68c75-6492-4cf0-bba8-849c793a6ed2",
    "rating": "positive",
    "comment": "Very helpful!"
  }'
```

**✅ Success Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Feedback saved successfully"
  },
  "timestamp": "2025-12-22T10:30:00.000Z"
}
```

**❌ Error Responses:**

**Invalid Session (Foreign Key Violation):** `500 Internal Server Error`
```json
{
  "success": false,
  "error": {
    "code": "CHAT_005",
    "message": "Session does not exist. Please start a conversation first."
  },
  "timestamp": "2025-12-22T10:30:00.000Z"
}
```

**Validation Error:** `422 Unprocessable Entity`
```json
{
  "success": false,
  "error": {
    "code": "VAL_001",
    "message": "\"rating\" must be one of [positive, negative]"
  },
  "timestamp": "2025-12-22T10:30:00.000Z"
}
```

---

## AI Features

### Intent Classification

The chatbot automatically classifies user intent:

- **search_trips**: User wants to find available trips
- **book_trip**: User wants to book a specific trip
- **ask_faq**: User has questions about policies
- **modify_booking**: User wants to change a booking
- **cancel_booking**: User wants to cancel
- **general_inquiry**: General questions

### Entity Extraction

For trip searches, the AI extracts:
- **origin**: Departure city
- **destination**: Arrival city
- **date**: Travel date
- **passengers**: Number of passengers
- **preferences**: Time of day, bus type, price range

### Natural Language Understanding

The chatbot understands various query formats:

**Vietnamese:**
- "Tôi muốn đi từ Sài Gòn ra Đà Nẵng ngày mai"
- "Có chuyến nào đi Hà Nội buổi tối không?"
- "Tìm xe đi Nha Trang giá rẻ"

**English:**
- "Find buses from HCMC to Da Nang tomorrow"
- "Show me evening trips to Hanoi"
- "Book a limousine to Nha Trang"

---

## Error Codes

| Code | Description |
|------|-------------|
| VAL_001 | Validation error |
| AUTH_001 | Authentication required |
| AUTH_002 | Invalid or expired token |
| CHAT_001 | Failed to process query |
| CHAT_002 | Failed to create booking |
| CHAT_003 | Failed to retrieve history |
| CHAT_004 | Failed to reset conversation |
| CHAT_005 | Failed to save feedback |
| BOOK_001 | Seats already booked |
| AI_001 | AI service rate limit exceeded |
| AI_002 | AI service authentication failed |
| SYS_001 | Internal server error |

---

## Rate Limits

- OpenAI API calls are subject to your OpenAI account limits
- Recommend implementing request throttling per user/session

---

## Best Practices

### Session Management
- Create a new session for each user conversation
- Store sessionId in frontend state
- Session expires after 30 minutes of inactivity

### Error Handling
- Always check `success` field in responses
- Display error messages to users
- Implement retry logic for transient errors

### User Experience
- Show typing indicator while waiting for response
- Display suggested actions to guide users
- Collect feedback to improve AI responses

---

## Testing

### Test with cURL

```bash
# Start a conversation (via API Gateway)
curl -X POST http://localhost:3000/chatbot/query \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, I need help booking a bus ticket"}'

# Search for trips
curl -X POST http://localhost:3000/chatbot/query \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session_xxx",
    "message": "Find trips from Ho Chi Minh City to Da Nang tomorrow"
  }'

# Check conversation history
curl http://localhost:3000/chatbot/sessions/session_xxx/history
```

### Test FAQ Handling

```bash
curl -X POST http://localhost:3000/chatbot/query \
  -H "Content-Type: application/json" \
  -d '{"message": "What is your cancellation policy?"}'
```

---

## Support

For issues or questions:
- Create a GitHub issue
- Contact: support@bus-ticket.com
- Slack: #chatbot-support
