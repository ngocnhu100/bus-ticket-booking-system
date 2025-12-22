/**
 * Error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('❌ Unhandled error:', err);

  // Default error response
  const errorResponse = {
    success: false,
    error: {
      code: 'SYS_001',
      message: 'Internal server error',
    },
    timestamp: new Date().toISOString(),
  };

  // Custom error handling for specific error types
  if (err.name === 'ValidationError') {
    errorResponse.error.code = 'VAL_001';
    errorResponse.error.message = err.message;
    return res.status(422).json(errorResponse);
  }

  if (err.name === 'UnauthorizedError') {
    errorResponse.error.code = 'AUTH_001';
    errorResponse.error.message = 'Authentication required';
    return res.status(401).json(errorResponse);
  }

  // OpenAI API errors
  if (err.response && err.response.status === 429) {
    errorResponse.error.code = 'AI_001';
    errorResponse.error.message = 'AI service rate limit exceeded. Please try again later.';
    return res.status(429).json(errorResponse);
  }

  if (err.response && err.response.status === 401) {
    errorResponse.error.code = 'AI_002';
    errorResponse.error.message = 'AI service authentication failed';
    return res.status(500).json(errorResponse);
  }

  res.status(500).json(errorResponse);
};

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_001',
      message: 'Route not found',
    },
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
