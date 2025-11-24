// Set test environment variables BEFORE any modules are loaded
process.env.NODE_ENV = 'test';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'bus_ticket_test';
process.env.DB_USER = 'test_user';
process.env.DB_PASSWORD = 'test_password';
process.env.REDIS_URL = 'redis://localhost:6379/1'; // Use DB 1 for tests
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.NOTIFICATION_SERVICE_URL = 'http://localhost:3003';
process.env.PORT = '3002';