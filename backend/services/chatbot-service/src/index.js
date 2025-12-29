const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const chatbotController = require('./controllers/chatbotController');
const { optionalAuthenticate } = require('./middleware/authMiddleware');
const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware');

const app = express();
const PORT = process.env.PORT || 3007;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', chatbotController.healthCheck);

// Chatbot routes (all support both guest and authenticated users)
// Note: API Gateway adds /chatbot prefix, so routes here don't include it
app.post('/query', optionalAuthenticate, chatbotController.query);
app.post('/book', optionalAuthenticate, chatbotController.book);
app.post('/submit-passenger-info', optionalAuthenticate, chatbotController.submitPassengerInfo);
app.get('/sessions/:sessionId/history', optionalAuthenticate, chatbotController.getHistory);
app.post('/sessions/:sessionId/reset', optionalAuthenticate, chatbotController.resetConversation);
app.post('/feedback', optionalAuthenticate, chatbotController.submitFeedback);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🤖 Chatbot Service running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔑 Google AI Model: ${process.env.GOOGLE_AI_MODEL || 'gemini-2.5-flash'}`);
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

module.exports = app;
