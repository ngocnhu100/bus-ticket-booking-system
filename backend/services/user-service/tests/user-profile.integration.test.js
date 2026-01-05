// user-profile.integration.test.js - Integration tests for User Service
// Tests user profile operations with database

const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const userService = require('../src/services/userService');
const userRepository = require('../src/repositories/userRepository');

// Mock dependencies
jest.mock('../src/repositories/userRepository');
jest.mock('jsonwebtoken');

// Create a simple Express app for testing
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  // Mock authentication middleware
  app.use((req, res, next) => {
    if (req.headers.authorization) {
      req.user = { userId: 'test-user-123', role: 'customer' };
    }
    next();
  });

  // User routes
  app.get('/api/users/:userId', async (req, res) => {
    try {
      const user = await userService.findById(req.params.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put('/api/users/:userId', async (req, res) => {
    try {
      const updatedUser = await userService.update(req.params.userId, req.body);
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put('/api/users/:userId/avatar', async (req, res) => {
    try {
      const { avatarUrl } = req.body;
      const updatedUser = await userService.updateUserAvatar(req.params.userId, avatarUrl);
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put('/api/users/:userId/password', async (req, res) => {
    try {
      const { hashedPassword } = req.body;
      const result = await userService.updatePassword(req.params.userId, hashedPassword);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  return app;
};

describe('User Service - Integration Tests', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/users/:userId - Get User Profile', () => {
    it('should retrieve user profile successfully', async () => {
      const mockUser = {
        id: 'test-user-123',
        fullName: 'John Doe',
        email: 'john@example.com',
        phone: '0123456789',
        avatarUrl: 'https://cloudinary.com/avatar.jpg',
        createdAt: new Date().toISOString()
      };

      userRepository.findById.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/users/test-user-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual(mockUser);
      expect(response.body.email).toBe('john@example.com');
      expect(userRepository.findById).toHaveBeenCalledWith('test-user-123');
    });

    it('should return 404 when user not found', async () => {
      userRepository.findById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/users/nonexistent-user')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);

      expect(response.body.message).toBe('User not found');
    });

    it('should handle database errors', async () => {
      userRepository.findById.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/users/test-user-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);

      expect(response.body.message).toBe('Database connection failed');
    });
  });

  describe('PUT /api/users/:userId - Update User Profile', () => {
    it('should update user profile successfully', async () => {
      const updateData = {
        fullName: 'Jane Smith',
        phone: '0987654321',
        address: '123 Main St'
      };

      const mockUpdatedUser = {
        id: 'test-user-123',
        ...updateData,
        email: 'jane@example.com',
        updatedAt: new Date().toISOString()
      };

      userRepository.update.mockResolvedValue(mockUpdatedUser);

      const response = await request(app)
        .put('/api/users/test-user-123')
        .set('Authorization', 'Bearer valid-token')
        .send(updateData)
        .expect(200);

      expect(response.body.fullName).toBe('Jane Smith');
      expect(response.body.phone).toBe('0987654321');
      expect(response.body.address).toBe('123 Main St');
      expect(userRepository.update).toHaveBeenCalledWith('test-user-123', updateData);
    });

    it('should handle partial profile updates', async () => {
      const updateData = { fullName: 'John Updated' };

      const mockUpdatedUser = {
        id: 'test-user-123',
        fullName: 'John Updated',
        email: 'john@example.com',
        phone: '0123456789'
      };

      userRepository.update.mockResolvedValue(mockUpdatedUser);

      const response = await request(app)
        .put('/api/users/test-user-123')
        .set('Authorization', 'Bearer valid-token')
        .send(updateData)
        .expect(200);

      expect(response.body.fullName).toBe('John Updated');
      expect(response.body.email).toBe('john@example.com');
    });

    it('should handle validation errors', async () => {
      const invalidData = { email: 'invalid-email' };

      userRepository.update.mockRejectedValue(new Error('Invalid email format'));

      const response = await request(app)
        .put('/api/users/test-user-123')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData)
        .expect(500);

      expect(response.body.message).toContain('Invalid email format');
    });

    it('should handle concurrent updates', async () => {
      const update1 = { fullName: 'Name 1' };
      const update2 = { phone: '0111111111' };

      userRepository.update
        .mockResolvedValueOnce({ id: 'test-user-123', ...update1 })
        .mockResolvedValueOnce({ id: 'test-user-123', ...update2 });

      const [response1, response2] = await Promise.all([
        request(app)
          .put('/api/users/test-user-123')
          .set('Authorization', 'Bearer valid-token')
          .send(update1),
        request(app)
          .put('/api/users/test-user-123')
          .set('Authorization', 'Bearer valid-token')
          .send(update2)
      ]);

      expect(response1.body.fullName).toBe('Name 1');
      expect(response2.body.phone).toBe('0111111111');
    });
  });

  describe('PUT /api/users/:userId/avatar - Update Avatar', () => {
    it('should update avatar successfully', async () => {
      const avatarUrl = 'https://cloudinary.com/new-avatar.jpg';

      const mockUpdatedUser = {
        id: 'test-user-123',
        fullName: 'John Doe',
        avatarUrl,
        updatedAt: new Date().toISOString()
      };

      userRepository.updateUserAvatar.mockResolvedValue(mockUpdatedUser);

      const response = await request(app)
        .put('/api/users/test-user-123/avatar')
        .set('Authorization', 'Bearer valid-token')
        .send({ avatarUrl })
        .expect(200);

      expect(response.body.avatarUrl).toBe(avatarUrl);
      expect(userRepository.updateUserAvatar).toHaveBeenCalledWith('test-user-123', avatarUrl);
    });

    it('should handle avatar removal (null URL)', async () => {
      const mockUpdatedUser = {
        id: 'test-user-123',
        fullName: 'John Doe',
        avatarUrl: null
      };

      userRepository.updateUserAvatar.mockResolvedValue(mockUpdatedUser);

      const response = await request(app)
        .put('/api/users/test-user-123/avatar')
        .set('Authorization', 'Bearer valid-token')
        .send({ avatarUrl: null })
        .expect(200);

      expect(response.body.avatarUrl).toBeNull();
    });

    it('should handle avatar upload failure', async () => {
      userRepository.updateUserAvatar.mockRejectedValue(new Error('Upload failed'));

      const response = await request(app)
        .put('/api/users/test-user-123/avatar')
        .set('Authorization', 'Bearer valid-token')
        .send({ avatarUrl: 'https://cloudinary.com/avatar.jpg' })
        .expect(500);

      expect(response.body.message).toBe('Upload failed');
    });
  });

  describe('PUT /api/users/:userId/password - Update Password', () => {
    it('should update password successfully', async () => {
      const hashedPassword = '$2b$10$newhashed';

      userRepository.updatePassword.mockResolvedValue({ success: true });

      const response = await request(app)
        .put('/api/users/test-user-123/password')
        .set('Authorization', 'Bearer valid-token')
        .send({ hashedPassword })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(userRepository.updatePassword).toHaveBeenCalledWith('test-user-123', hashedPassword);
    });

    it('should handle password update failure', async () => {
      userRepository.updatePassword.mockRejectedValue(new Error('Password update failed'));

      const response = await request(app)
        .put('/api/users/test-user-123/password')
        .set('Authorization', 'Bearer valid-token')
        .send({ hashedPassword: '$2b$10$hashed' })
        .expect(500);

      expect(response.body.message).toBe('Password update failed');
    });
  });

  describe('User Workflow Integration', () => {
    it('should complete full user profile update workflow', async () => {
      // Step 1: Get current profile
      const mockUser = {
        id: 'test-user-123',
        fullName: 'John Doe',
        email: 'john@example.com',
        phone: '0123456789'
      };

      userRepository.findById.mockResolvedValue(mockUser);

      const getResponse = await request(app)
        .get('/api/users/test-user-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(getResponse.body.email).toBe('john@example.com');

      // Step 2: Update profile
      const updateData = { fullName: 'John Updated', phone: '0987654321' };
      const updatedUser = { ...mockUser, ...updateData };

      userRepository.update.mockResolvedValue(updatedUser);

      const updateResponse = await request(app)
        .put('/api/users/test-user-123')
        .set('Authorization', 'Bearer valid-token')
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.fullName).toBe('John Updated');
      expect(updateResponse.body.phone).toBe('0987654321');

      // Step 3: Update avatar
      const avatarUrl = 'https://cloudinary.com/avatar.jpg';
      const userWithAvatar = { ...updatedUser, avatarUrl };

      userRepository.updateUserAvatar.mockResolvedValue(userWithAvatar);

      const avatarResponse = await request(app)
        .put('/api/users/test-user-123/avatar')
        .set('Authorization', 'Bearer valid-token')
        .send({ avatarUrl })
        .expect(200);

      expect(avatarResponse.body.avatarUrl).toBe(avatarUrl);
    });

    it('should handle profile retrieval after updates', async () => {
      const originalUser = {
        id: 'test-user-123',
        fullName: 'Original Name',
        email: 'original@example.com'
      };

      const updatedUser = {
        ...originalUser,
        fullName: 'Updated Name'
      };

      userRepository.update.mockResolvedValue(updatedUser);
      userRepository.findById.mockResolvedValue(updatedUser);

      // Update
      await request(app)
        .put('/api/users/test-user-123')
        .set('Authorization', 'Bearer valid-token')
        .send({ fullName: 'Updated Name' })
        .expect(200);

      // Verify update persisted
      const response = await request(app)
        .get('/api/users/test-user-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.fullName).toBe('Updated Name');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed request body', async () => {
      userRepository.update.mockRejectedValue(new Error('Invalid data'));

      const response = await request(app)
        .put('/api/users/test-user-123')
        .set('Authorization', 'Bearer valid-token')
        .send('invalid json')
        .expect(500);

      expect(response.body.message).toBeTruthy();
    });

    it('should handle missing authentication token', async () => {
      const mockUser = { id: 'test-user-123', fullName: 'John' };
      userRepository.findById.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/users/test-user-123')
        .expect(200);

      expect(response.body).toEqual(mockUser);
    });

    it('should handle database timeout errors', async () => {
      userRepository.findById.mockRejectedValue(new Error('Query timeout'));

      const response = await request(app)
        .get('/api/users/test-user-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);

      expect(response.body.message).toBe('Query timeout');
    });
  });
});
