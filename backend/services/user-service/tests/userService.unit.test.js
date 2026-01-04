// userService.unit.test.js - Unit tests for User Service
// Tests user profile operations, validation logic

const userService = require('../src/services/userService');
const userRepository = require('../src/repositories/userRepository');

// Mock the repository
jest.mock('../src/repositories/userRepository');

describe('UserService - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      const userId = 'user-123';
      const updateData = {
        fullName: 'John Doe Updated',
        phone: '0987654321'
      };
      const mockUpdatedUser = {
        id: userId,
        ...updateData,
        email: 'john@example.com'
      };

      userRepository.update.mockResolvedValue(mockUpdatedUser);

      const result = await userService.updateProfile(userId, updateData);

      expect(result).toEqual(mockUpdatedUser);
      expect(userRepository.update).toHaveBeenCalledWith(userId, updateData);
      expect(userRepository.update).toHaveBeenCalledTimes(1);
    });

    it('should handle update profile failure', async () => {
      const userId = 'user-123';
      const updateData = { fullName: 'John Doe' };
      const error = new Error('Database error');

      userRepository.update.mockRejectedValue(error);

      await expect(userService.updateProfile(userId, updateData))
        .rejects.toThrow('Database error');
      expect(userRepository.update).toHaveBeenCalledWith(userId, updateData);
    });

    it('should handle empty update data', async () => {
      const userId = 'user-123';
      const updateData = {};
      const mockUser = {
        id: userId,
        fullName: 'John Doe',
        email: 'john@example.com'
      };

      userRepository.update.mockResolvedValue(mockUser);

      const result = await userService.updateProfile(userId, updateData);

      expect(result).toEqual(mockUser);
      expect(userRepository.update).toHaveBeenCalledWith(userId, updateData);
    });
  });

  describe('updateUserAvatar', () => {
    it('should update user avatar successfully', async () => {
      const userId = 'user-123';
      const avatarUrl = 'https://cloudinary.com/avatar.jpg';
      const mockUpdatedUser = {
        id: userId,
        avatarUrl,
        fullName: 'John Doe'
      };

      userRepository.updateUserAvatar.mockResolvedValue(mockUpdatedUser);

      const result = await userService.updateUserAvatar(userId, avatarUrl);

      expect(result).toEqual(mockUpdatedUser);
      expect(userRepository.updateUserAvatar).toHaveBeenCalledWith(userId, avatarUrl);
      expect(userRepository.updateUserAvatar).toHaveBeenCalledTimes(1);
    });

    it('should handle avatar update with null URL', async () => {
      const userId = 'user-123';
      const avatarUrl = null;

      userRepository.updateUserAvatar.mockResolvedValue({ id: userId, avatarUrl: null });

      const result = await userService.updateUserAvatar(userId, avatarUrl);

      expect(result.avatarUrl).toBeNull();
      expect(userRepository.updateUserAvatar).toHaveBeenCalledWith(userId, avatarUrl);
    });

    it('should handle avatar update failure', async () => {
      const userId = 'user-123';
      const avatarUrl = 'https://cloudinary.com/avatar.jpg';
      const error = new Error('Upload failed');

      userRepository.updateUserAvatar.mockRejectedValue(error);

      await expect(userService.updateUserAvatar(userId, avatarUrl))
        .rejects.toThrow('Upload failed');
    });
  });

  describe('findById', () => {
    it('should find user by ID successfully', async () => {
      const userId = 'user-123';
      const mockUser = {
        id: userId,
        fullName: 'John Doe',
        email: 'john@example.com',
        phone: '0123456789'
      };

      userRepository.findById.mockResolvedValue(mockUser);

      const result = await userService.findById(userId);

      expect(result).toEqual(mockUser);
      expect(userRepository.findById).toHaveBeenCalledWith(userId);
      expect(userRepository.findById).toHaveBeenCalledTimes(1);
    });

    it('should return null when user not found', async () => {
      const userId = 'nonexistent-user';

      userRepository.findById.mockResolvedValue(null);

      const result = await userService.findById(userId);

      expect(result).toBeNull();
      expect(userRepository.findById).toHaveBeenCalledWith(userId);
    });

    it('should handle database errors when finding user', async () => {
      const userId = 'user-123';
      const error = new Error('Database connection failed');

      userRepository.findById.mockRejectedValue(error);

      await expect(userService.findById(userId))
        .rejects.toThrow('Database connection failed');
    });
  });

  describe('findByEmail', () => {
    it('should find user by email successfully', async () => {
      const email = 'john@example.com';
      const mockUser = {
        id: 'user-123',
        fullName: 'John Doe',
        email,
        phone: '0123456789'
      };

      userRepository.findByEmail.mockResolvedValue(mockUser);

      const result = await userService.findByEmail(email);

      expect(result).toEqual(mockUser);
      expect(userRepository.findByEmail).toHaveBeenCalledWith(email);
    });

    it('should handle case-insensitive email search', async () => {
      const email = 'JOHN@EXAMPLE.COM';
      const mockUser = {
        id: 'user-123',
        email: 'john@example.com'
      };

      userRepository.findByEmail.mockResolvedValue(mockUser);

      const result = await userService.findByEmail(email);

      expect(result).toBeTruthy();
      expect(userRepository.findByEmail).toHaveBeenCalledWith(email);
    });

    it('should return null when email not found', async () => {
      const email = 'nonexistent@example.com';

      userRepository.findByEmail.mockResolvedValue(null);

      const result = await userService.findByEmail(email);

      expect(result).toBeNull();
    });
  });

  describe('findByPhone', () => {
    it('should find user by phone successfully', async () => {
      const phone = '0123456789';
      const mockUser = {
        id: 'user-123',
        fullName: 'John Doe',
        phone
      };

      userRepository.findByPhone.mockResolvedValue(mockUser);

      const result = await userService.findByPhone(phone);

      expect(result).toEqual(mockUser);
      expect(userRepository.findByPhone).toHaveBeenCalledWith(phone);
    });

    it('should return null when phone not found', async () => {
      const phone = '9999999999';

      userRepository.findByPhone.mockResolvedValue(null);

      const result = await userService.findByPhone(phone);

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update user with multiple fields', async () => {
      const userId = 'user-123';
      const updateData = {
        fullName: 'Jane Smith',
        phone: '0987654321',
        address: '123 Main St'
      };
      const mockUpdatedUser = {
        id: userId,
        ...updateData,
        email: 'jane@example.com'
      };

      userRepository.update.mockResolvedValue(mockUpdatedUser);

      const result = await userService.update(userId, updateData);

      expect(result).toEqual(mockUpdatedUser);
      expect(userRepository.update).toHaveBeenCalledWith(userId, updateData);
    });

    it('should handle partial updates', async () => {
      const userId = 'user-123';
      const updateData = { fullName: 'Jane Smith' };
      const mockUpdatedUser = {
        id: userId,
        fullName: 'Jane Smith',
        email: 'jane@example.com',
        phone: '0123456789'
      };

      userRepository.update.mockResolvedValue(mockUpdatedUser);

      const result = await userService.update(userId, updateData);

      expect(result.fullName).toBe('Jane Smith');
      expect(result.email).toBe('jane@example.com');
    });
  });

  describe('updatePassword', () => {
    it('should update password successfully', async () => {
      const userId = 'user-123';
      const hashedPassword = '$2b$10$hashedpassword';
      const mockResult = { success: true };

      userRepository.updatePassword.mockResolvedValue(mockResult);

      const result = await userService.updatePassword(userId, hashedPassword);

      expect(result).toEqual(mockResult);
      expect(userRepository.updatePassword).toHaveBeenCalledWith(userId, hashedPassword);
    });

    it('should handle password update failure', async () => {
      const userId = 'user-123';
      const hashedPassword = '$2b$10$hashedpassword';
      const error = new Error('Update failed');

      userRepository.updatePassword.mockRejectedValue(error);

      await expect(userService.updatePassword(userId, hashedPassword))
        .rejects.toThrow('Update failed');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null userId', async () => {
      const userId = null;
      const error = new Error('Invalid user ID');

      userRepository.findById.mockRejectedValue(error);

      await expect(userService.findById(userId))
        .rejects.toThrow('Invalid user ID');
    });

    it('should handle undefined update data', async () => {
      const userId = 'user-123';
      const updateData = undefined;

      userRepository.update.mockResolvedValue({ id: userId });

      const result = await userService.update(userId, updateData);

      expect(userRepository.update).toHaveBeenCalledWith(userId, updateData);
    });

    it('should handle concurrent update operations', async () => {
      const userId = 'user-123';
      const updateData1 = { fullName: 'John' };
      const updateData2 = { phone: '0123456789' };

      userRepository.update
        .mockResolvedValueOnce({ id: userId, ...updateData1 })
        .mockResolvedValueOnce({ id: userId, ...updateData2 });

      const [result1, result2] = await Promise.all([
        userService.update(userId, updateData1),
        userService.update(userId, updateData2)
      ]);

      expect(result1.fullName).toBe('John');
      expect(result2.phone).toBe('0123456789');
      expect(userRepository.update).toHaveBeenCalledTimes(2);
    });
  });
});
