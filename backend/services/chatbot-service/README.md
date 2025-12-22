# Chatbot Service

AI-powered chatbot service for the Bus Ticket Booking System. Provides natural language interaction for trip search, booking, and customer support.

## Features

- 🤖 OpenAI GPT-4 Integration
- 🔍 Natural Language Trip Search
- 🎫 Conversational Booking Flow
- ❓ Intelligent FAQ Handling
- 💬 Session Management & Conversation History
- 🔐 Support for Both Guest and Authenticated Users

## Tech Stack

- Node.js + Express
- OpenAI API (GPT-4)
- PostgreSQL (conversation storage)
- Redis (session caching)
- JWT Authentication

## Architecture

```
src/
├── controllers/      # Request handlers
├── services/         # Business logic
├── repositories/     # Database access
├── middleware/       # Auth, validation, error handling
├── validators/       # Request validation schemas
├── prompts/          # AI prompt templates
├── utils/            # Helper functions
├── database.js       # DB connection
├── redis.js          # Redis connection
└── index.js          # App entry point
```

## API Endpoints

### POST /query
Send a message to the chatbot

**Note**: When accessed via API Gateway, use `/chatbot/query`

### GET /sessions/:sessionId/history
Get conversation history for a session

**Note**: When accessed via API Gateway, use `/chatbot/sessions/:sessionId/history`

### POST /sessions/:sessionId/reset
Reset a conversation session

**Note**: When accessed via API Gateway, use `/chatbot/sessions/:sessionId/reset`

### POST /book
Process booking through chatbot

**Note**: When accessed via API Gateway, use `/chatbot/book`

For complete API documentation, see [docs/API.md](./docs/API.md)

## Environment Variables

See `.env.example` for all configuration options. Key variables:

- `OPENAI_API_KEY` - Your OpenAI API key
- `OPENAI_MODEL` - Model to use (default: gpt-4-turbo-preview)
- `PORT` - Service port (default: 3007)

## Getting Started

### Development

```bash
# Install dependencies
npm install

# Copy env file
cp .env.example .env

# Add your OpenAI API key to .env

# Run in development mode
npm run dev
```

### Docker

```bash
# Build image
docker build -t chatbot-service .

# Run container
docker run -p 3006:3006 --env-file .env chatbot-service
```

## Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Integration

The chatbot service integrates with:
- **Trip Service** - For searching trips
- **Booking Service** - For creating bookings
- **Auth Service** - For user authentication (optional)

## AI Features

### Natural Language Understanding
- Extracts origin, destination, date from natural queries
- Handles Vietnamese and English
- Asks clarifying questions for missing information

### Intent Classification
- Trip search queries
- Booking requests
- FAQ questions
- Modification/cancellation requests

### Context Management
- Maintains conversation state
- Remembers previous messages
- Tracks booking flow progress

## Examples

### Trip Search
**User:** "Tôi muốn đi từ Sài Gòn ra Đà Nẵng ngày mai"  
**Bot:** Extracts {origin: "Ho Chi Minh City", destination: "Da Nang", date: "tomorrow"} and searches trips

### FAQ
**User:** "Chính sách hoàn vé như thế nào?"  
**Bot:** Provides cancellation policy details

### Booking
**User:** "Tôi muốn đặt ghế A1"  
**Bot:** Guides through passenger information collection and payment

## License

MIT