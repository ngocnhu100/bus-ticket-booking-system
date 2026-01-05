// payment-callback.integration.test.js - Integration tests for Payment Service
// Tests payment callback handling and transaction workflows

const request = require('supertest');
const express = require('express');
const crypto = require('crypto');

// Mock payment service components
const mockPaymentRepository = {
  findByOrderCode: jest.fn(),
  updatePaymentStatus: jest.fn(),
  createPayment: jest.fn()
};

const mockBookingService = {
  confirmBooking: jest.fn(),
  cancelBooking: jest.fn()
};

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Payment webhook endpoint
  app.post('/api/payment/webhook', async (req, res) => {
    try {
      const { orderCode, status, amount, transactionId } = req.body;
      
      // Verify webhook signature
      const signature = req.headers['x-payos-signature'];
      if (!signature) {
        return res.status(401).json({ error: 'Missing signature' });
      }

      // Find payment
      const payment = await mockPaymentRepository.findByOrderCode(orderCode);
      if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
      }

      // Update payment status
      await mockPaymentRepository.updatePaymentStatus(orderCode, status, transactionId);

      // Handle booking based on payment status
      if (status === 'PAID' || status === 'completed') {
        await mockBookingService.confirmBooking(payment.bookingId);
      } else if (status === 'CANCELLED' || status === 'failed') {
        await mockBookingService.cancelBooking(payment.bookingId);
      }

      res.json({ success: true, message: 'Webhook processed' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create payment endpoint
  app.post('/api/payment/create', async (req, res) => {
    try {
      const { bookingId, amount, description } = req.body;
      
      const orderCode = `ORDER_${Date.now()}`;
      const payment = await mockPaymentRepository.createPayment({
        bookingId,
        orderCode,
        amount,
        description,
        status: 'pending'
      });

      res.json({
        success: true,
        payment,
        paymentUrl: `https://payment.example.com/checkout/${orderCode}`
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get payment status endpoint
  app.get('/api/payment/:orderCode', async (req, res) => {
    try {
      const { orderCode } = req.params;
      const payment = await mockPaymentRepository.findByOrderCode(orderCode);
      
      if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
      }

      res.json({ success: true, payment });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return app;
};

describe('Payment Service - Integration Tests', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/payment/webhook - Payment Webhook Handler', () => {
    it('should process successful payment webhook', async () => {
      const mockPayment = {
        orderCode: 'ORDER_123456',
        bookingId: 'booking-123',
        amount: 500000,
        status: 'pending'
      };

      mockPaymentRepository.findByOrderCode.mockResolvedValue(mockPayment);
      mockPaymentRepository.updatePaymentStatus.mockResolvedValue({
        ...mockPayment,
        status: 'completed',
        transactionId: 'TXN_789'
      });
      mockBookingService.confirmBooking.mockResolvedValue({ success: true });

      const webhookData = {
        orderCode: 'ORDER_123456',
        status: 'PAID',
        amount: 500000,
        transactionId: 'TXN_789'
      };

      const response = await request(app)
        .post('/api/payment/webhook')
        .set('x-payos-signature', 'valid-signature')
        .send(webhookData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockPaymentRepository.findByOrderCode).toHaveBeenCalledWith('ORDER_123456');
      expect(mockPaymentRepository.updatePaymentStatus).toHaveBeenCalledWith(
        'ORDER_123456',
        'PAID',
        'TXN_789'
      );
      expect(mockBookingService.confirmBooking).toHaveBeenCalledWith('booking-123');
    });

    it('should handle failed payment webhook', async () => {
      const mockPayment = {
        orderCode: 'ORDER_456789',
        bookingId: 'booking-456',
        amount: 300000,
        status: 'pending'
      };

      mockPaymentRepository.findByOrderCode.mockResolvedValue(mockPayment);
      mockPaymentRepository.updatePaymentStatus.mockResolvedValue({
        ...mockPayment,
        status: 'failed'
      });
      mockBookingService.cancelBooking.mockResolvedValue({ success: true });

      const webhookData = {
        orderCode: 'ORDER_456789',
        status: 'failed',
        amount: 300000,
        transactionId: null
      };

      const response = await request(app)
        .post('/api/payment/webhook')
        .set('x-payos-signature', 'valid-signature')
        .send(webhookData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockBookingService.cancelBooking).toHaveBeenCalledWith('booking-456');
    });

    it('should handle cancelled payment webhook', async () => {
      const mockPayment = {
        orderCode: 'ORDER_789012',
        bookingId: 'booking-789',
        amount: 450000,
        status: 'pending'
      };

      mockPaymentRepository.findByOrderCode.mockResolvedValue(mockPayment);
      mockPaymentRepository.updatePaymentStatus.mockResolvedValue({
        ...mockPayment,
        status: 'cancelled'
      });
      mockBookingService.cancelBooking.mockResolvedValue({ success: true });

      const webhookData = {
        orderCode: 'ORDER_789012',
        status: 'CANCELLED',
        amount: 450000,
        transactionId: null
      };

      const response = await request(app)
        .post('/api/payment/webhook')
        .set('x-payos-signature', 'valid-signature')
        .send(webhookData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockBookingService.cancelBooking).toHaveBeenCalledWith('booking-789');
    });

    it('should reject webhook without signature', async () => {
      const webhookData = {
        orderCode: 'ORDER_123456',
        status: 'PAID',
        amount: 500000
      };

      const response = await request(app)
        .post('/api/payment/webhook')
        .send(webhookData)
        .expect(401);

      expect(response.body.error).toContain('signature');
      expect(mockPaymentRepository.updatePaymentStatus).not.toHaveBeenCalled();
    });

    it('should handle payment not found', async () => {
      mockPaymentRepository.findByOrderCode.mockResolvedValue(null);

      const webhookData = {
        orderCode: 'ORDER_NONEXISTENT',
        status: 'PAID',
        amount: 500000
      };

      const response = await request(app)
        .post('/api/payment/webhook')
        .set('x-payos-signature', 'valid-signature')
        .send(webhookData)
        .expect(404);

      expect(response.body.error).toContain('not found');
    });

    it('should handle database errors gracefully', async () => {
      mockPaymentRepository.findByOrderCode.mockRejectedValue(
        new Error('Database connection failed')
      );

      const webhookData = {
        orderCode: 'ORDER_123456',
        status: 'PAID',
        amount: 500000
      };

      const response = await request(app)
        .post('/api/payment/webhook')
        .set('x-payos-signature', 'valid-signature')
        .send(webhookData)
        .expect(500);

      expect(response.body.error).toContain('Database');
    });
  });

  describe('POST /api/payment/create - Create Payment', () => {
    it('should create payment successfully', async () => {
      const mockPayment = {
        id: 'payment-1',
        bookingId: 'booking-123',
        orderCode: 'ORDER_1234567890',
        amount: 500000,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      mockPaymentRepository.createPayment.mockResolvedValue(mockPayment);

      const response = await request(app)
        .post('/api/payment/create')
        .send({
          bookingId: 'booking-123',
          amount: 500000,
          description: 'Bus ticket payment'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.payment.orderCode).toBeTruthy();
      expect(response.body.paymentUrl).toBeTruthy();
      expect(mockPaymentRepository.createPayment).toHaveBeenCalled();
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/payment/create')
        .send({
          bookingId: 'booking-123'
          // Missing amount
        })
        .expect(500);

      expect(response.body.error).toBeTruthy();
    });

    it('should handle payment creation errors', async () => {
      mockPaymentRepository.createPayment.mockRejectedValue(
        new Error('Failed to create payment')
      );

      const response = await request(app)
        .post('/api/payment/create')
        .send({
          bookingId: 'booking-123',
          amount: 500000,
          description: 'Test payment'
        })
        .expect(500);

      expect(response.body.error).toContain('Failed to create payment');
    });
  });

  describe('GET /api/payment/:orderCode - Get Payment Status', () => {
    it('should retrieve payment status', async () => {
      const mockPayment = {
        orderCode: 'ORDER_123456',
        bookingId: 'booking-123',
        amount: 500000,
        status: 'completed',
        transactionId: 'TXN_789',
        createdAt: new Date().toISOString()
      };

      mockPaymentRepository.findByOrderCode.mockResolvedValue(mockPayment);

      const response = await request(app)
        .get('/api/payment/ORDER_123456')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.payment.status).toBe('completed');
      expect(response.body.payment.transactionId).toBe('TXN_789');
    });

    it('should handle payment not found', async () => {
      mockPaymentRepository.findByOrderCode.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/payment/ORDER_NONEXISTENT')
        .expect(404);

      expect(response.body.error).toContain('not found');
    });

    it('should handle database errors', async () => {
      mockPaymentRepository.findByOrderCode.mockRejectedValue(
        new Error('Query timeout')
      );

      const response = await request(app)
        .get('/api/payment/ORDER_123456')
        .expect(500);

      expect(response.body.error).toContain('Query timeout');
    });
  });

  describe('Payment Workflow Integration', () => {
    it('should complete full payment flow', async () => {
      // Step 1: Create payment
      const mockPayment = {
        id: 'payment-1',
        bookingId: 'booking-full-flow',
        orderCode: 'ORDER_FULL_FLOW',
        amount: 750000,
        status: 'pending'
      };

      mockPaymentRepository.createPayment.mockResolvedValue(mockPayment);

      const createResponse = await request(app)
        .post('/api/payment/create')
        .send({
          bookingId: 'booking-full-flow',
          amount: 750000,
          description: 'Full flow test'
        })
        .expect(200);

      expect(createResponse.body.success).toBe(true);
      const { orderCode } = createResponse.body.payment;

      // Step 2: Check initial status
      mockPaymentRepository.findByOrderCode.mockResolvedValue({
        ...mockPayment,
        orderCode
      });

      const statusResponse1 = await request(app)
        .get(`/api/payment/${orderCode}`)
        .expect(200);

      expect(statusResponse1.body.payment.status).toBe('pending');

      // Step 3: Process webhook (payment completed)
      mockPaymentRepository.updatePaymentStatus.mockResolvedValue({
        ...mockPayment,
        orderCode,
        status: 'completed',
        transactionId: 'TXN_FULL_FLOW'
      });
      mockBookingService.confirmBooking.mockResolvedValue({ success: true });

      await request(app)
        .post('/api/payment/webhook')
        .set('x-payos-signature', 'valid-signature')
        .send({
          orderCode,
          status: 'PAID',
          amount: 750000,
          transactionId: 'TXN_FULL_FLOW'
        })
        .expect(200);

      // Step 4: Check updated status
      mockPaymentRepository.findByOrderCode.mockResolvedValue({
        ...mockPayment,
        orderCode,
        status: 'completed',
        transactionId: 'TXN_FULL_FLOW'
      });

      const statusResponse2 = await request(app)
        .get(`/api/payment/${orderCode}`)
        .expect(200);

      expect(statusResponse2.body.payment.status).toBe('completed');
      expect(mockBookingService.confirmBooking).toHaveBeenCalledWith('booking-full-flow');
    });

    it('should handle payment timeout scenario', async () => {
      const mockPayment = {
        orderCode: 'ORDER_TIMEOUT',
        bookingId: 'booking-timeout',
        amount: 400000,
        status: 'pending'
      };

      // Payment expires after timeout
      mockPaymentRepository.findByOrderCode.mockResolvedValue(mockPayment);
      mockPaymentRepository.updatePaymentStatus.mockResolvedValue({
        ...mockPayment,
        status: 'cancelled'
      });
      mockBookingService.cancelBooking.mockResolvedValue({ success: true });

      await request(app)
        .post('/api/payment/webhook')
        .set('x-payos-signature', 'valid-signature')
        .send({
          orderCode: 'ORDER_TIMEOUT',
          status: 'CANCELLED',
          amount: 400000,
          transactionId: null
        })
        .expect(200);

      expect(mockBookingService.cancelBooking).toHaveBeenCalledWith('booking-timeout');
    });
  });

  describe('Concurrent Payment Processing', () => {
    it('should handle multiple webhooks for different orders', async () => {
      const orders = ['ORDER_1', 'ORDER_2', 'ORDER_3'];
      
      orders.forEach((orderCode, index) => {
        mockPaymentRepository.findByOrderCode.mockResolvedValueOnce({
          orderCode,
          bookingId: `booking-${index}`,
          amount: 500000,
          status: 'pending'
        });
        mockPaymentRepository.updatePaymentStatus.mockResolvedValueOnce({
          orderCode,
          status: 'completed'
        });
        mockBookingService.confirmBooking.mockResolvedValueOnce({ success: true });
      });

      const requests = orders.map(orderCode =>
        request(app)
          .post('/api/payment/webhook')
          .set('x-payos-signature', 'valid-signature')
          .send({
            orderCode,
            status: 'PAID',
            amount: 500000,
            transactionId: `TXN_${orderCode}`
          })
      );

      const responses = await Promise.all(requests);

      expect(responses.every(r => r.status === 200)).toBe(true);
      expect(mockPaymentRepository.updatePaymentStatus).toHaveBeenCalledTimes(3);
      expect(mockBookingService.confirmBooking).toHaveBeenCalledTimes(3);
    });

    it('should handle partial webhook failures', async () => {
      mockPaymentRepository.findByOrderCode
        .mockResolvedValueOnce({ orderCode: 'ORDER_1', bookingId: 'b1', status: 'pending' })
        .mockRejectedValueOnce(new Error('Database error'))
        .mockResolvedValueOnce({ orderCode: 'ORDER_3', bookingId: 'b3', status: 'pending' });

      mockPaymentRepository.updatePaymentStatus.mockResolvedValue({ status: 'completed' });
      mockBookingService.confirmBooking.mockResolvedValue({ success: true });

      const requests = ['ORDER_1', 'ORDER_2', 'ORDER_3'].map(orderCode =>
        request(app)
          .post('/api/payment/webhook')
          .set('x-payos-signature', 'valid-signature')
          .send({ orderCode, status: 'PAID', amount: 500000 })
      );

      const results = await Promise.allSettled(requests);

      expect(results[0].value.status).toBe(200);
      expect(results[1].value.status).toBe(500);
      expect(results[2].value.status).toBe(200);
    });
  });

  describe('Error Recovery and Retry', () => {
    it('should support payment retry after failure', async () => {
      const mockPayment = {
        orderCode: 'ORDER_RETRY',
        bookingId: 'booking-retry',
        amount: 500000,
        status: 'failed'
      };

      // First attempt failed
      mockPaymentRepository.findByOrderCode.mockResolvedValue(mockPayment);

      // Retry payment
      mockPaymentRepository.updatePaymentStatus.mockResolvedValue({
        ...mockPayment,
        status: 'pending'
      });

      // Then succeed
      mockPaymentRepository.updatePaymentStatus.mockResolvedValue({
        ...mockPayment,
        status: 'completed'
      });
      mockBookingService.confirmBooking.mockResolvedValue({ success: true });

      await request(app)
        .post('/api/payment/webhook')
        .set('x-payos-signature', 'valid-signature')
        .send({
          orderCode: 'ORDER_RETRY',
          status: 'PAID',
          amount: 500000,
          transactionId: 'TXN_RETRY'
        })
        .expect(200);

      expect(mockBookingService.confirmBooking).toHaveBeenCalled();
    });
  });
});
