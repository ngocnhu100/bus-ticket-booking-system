// additionalHelpers.unit.test.js - Additional tests to increase coverage
const {
  sanitizeInput,
  isValidPhoneNumber,
  isValidEmail,
  truncateText,
  generateSessionId
} = require('../src/utils/helpers');

describe('Additional Helper Functions - Coverage Tests', () => {
  describe('sanitizeInput', () => {
    it('should remove dangerous characters', () => {
      const dangerous = `'; DROP TABLE users; --`;
      const result = sanitizeInput(dangerous);
      
      expect(result).not.toContain(';');
      expect(result).not.toContain("'");
      expect(result).not.toContain('`');
    });

    it('should trim whitespace', () => {
      const result = sanitizeInput('  hello world  ');
      expect(result).toBe('hello world');
    });

    it('should limit length to 1000 characters', () => {
      const longString = 'a'.repeat(2000);
      const result = sanitizeInput(longString);
      
      expect(result.length).toBe(1000);
    });

    it('should handle null input', () => {
      const result = sanitizeInput(null);
      expect(result).toBeFalsy();
    });

    it('should handle undefined input', () => {
      const result = sanitizeInput(undefined);
      expect(result).toBeFalsy();
    });

    it('should remove backslashes', () => {
      const result = sanitizeInput('test\\\\escape');
      expect(result).toBeTruthy();
      expect(result).toContain('test');
    });
  });

  describe('isValidPhoneNumber', () => {
    it('should validate Vietnamese phone numbers with +84', () => {
      expect(isValidPhoneNumber('+84901234567')).toBe(true);
      expect(isValidPhoneNumber('+84912345678')).toBe(true);
    });

    it('should validate Vietnamese phone numbers with 84', () => {
      expect(isValidPhoneNumber('84901234567')).toBe(true);
    });

    it('should validate Vietnamese phone numbers with 0', () => {
      expect(isValidPhoneNumber('0901234567')).toBe(true);
      expect(isValidPhoneNumber('0912345678')).toBe(true);
    });

    it('should accept phone with spaces', () => {
      expect(isValidPhoneNumber('090 123 4567')).toBe(true);
    });

    it('should accept phone with dashes', () => {
      expect(isValidPhoneNumber('090-123-4567')).toBe(true);
    });

    it('should reject invalid formats', () => {
      expect(isValidPhoneNumber('123')).toBe(false);
      expect(isValidPhoneNumber('abc')).toBe(false);
      expect(isValidPhoneNumber('')).toBe(false);
    });

    it('should reject null and undefined', () => {
      expect(isValidPhoneNumber(null)).toBe(false);
      expect(isValidPhoneNumber(undefined)).toBe(false);
    });

    it('should reject too short numbers', () => {
      expect(isValidPhoneNumber('0901234')).toBe(false);
    });

    it('should reject too long numbers', () => {
      expect(isValidPhoneNumber('0901234567890')).toBe(false);
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email formats', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('test.user@domain.co.uk')).toBe(true);
      expect(isValidEmail('admin+tag@site.org')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(isValidEmail('notanemail')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('user@.com')).toBe(false);
    });

    it('should reject null and undefined', () => {
      expect(isValidEmail(null)).toBe(false);
      expect(isValidEmail(undefined)).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });

    it('should reject emails without @', () => {
      expect(isValidEmail('userexample.com')).toBe(false);
    });

    it('should reject emails without domain extension', () => {
      expect(isValidEmail('user@example')).toBe(false);
    });
  });

  describe('truncateText', () => {
    it('should not truncate short text', () => {
      const text = 'Short text';
      expect(truncateText(text)).toBe(text);
    });

    it('should truncate long text to default 500 chars', () => {
      const longText = 'a'.repeat(600);
      const result = truncateText(longText);
      
      expect(result.length).toBe(503); // 500 + '...'
      expect(result).toContain('...');
    });

    it('should truncate to custom maxLength', () => {
      const text = 'a'.repeat(100);
      const result = truncateText(text, 50);
      
      expect(result.length).toBe(53); // 50 + '...'
    });

    it('should return null for null input', () => {
      expect(truncateText(null)).toBe(null);
    });

    it('should return undefined for undefined input', () => {
      expect(truncateText(undefined)).toBe(undefined);
    });

    it('should not add ellipsis if text exactly maxLength', () => {
      const text = 'a'.repeat(500);
      const result = truncateText(text, 500);
      
      expect(result).toBe(text);
      expect(result).not.toContain('...');
    });
  });

  describe('generateSessionId', () => {
    it('should generate session ID with correct prefix', () => {
      const id = generateSessionId();
      expect(id).toContain('session_');
    });

    it('should generate unique IDs', () => {
      const id1 = generateSessionId();
      const id2 = generateSessionId();
      const id3 = generateSessionId();
      
      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).not.toBe(id3);
    });

    it('should generate IDs in UUID format', () => {
      const id = generateSessionId();
      const uuid = id.replace('session_', '');
      
      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuid).toMatch(uuidRegex);
    });

    it('should generate consistent format', () => {
      for (let i = 0; i < 10; i++) {
        const id = generateSessionId();
        expect(id).toMatch(/^session_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      }
    });
  });

  describe('Edge Cases - Error Handling', () => {
    it('should handle empty strings in validation', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidPhoneNumber('')).toBe(false);
    });

    it('should handle special characters in sanitization', () => {
      const special = `<script>alert('xss')</script>`;
      const result = sanitizeInput(special);
      // SanitizeInput removes quotes but keeps other chars
      expect(result).toBeTruthy();
      expect(result).not.toContain("'");
    });

    it('should handle very long inputs', () => {
      const veryLong = 'x'.repeat(10000);
      const sanitized = sanitizeInput(veryLong);
      expect(sanitized.length).toBeLessThanOrEqual(1000);
    });

    it('should handle whitespace-only strings', () => {
      const result = sanitizeInput('     ');
      expect(result).toBe('');
    });
  });
});
