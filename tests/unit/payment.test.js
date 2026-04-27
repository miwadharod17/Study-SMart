const request = require('supertest');
const app = require('../../backend/services/payment-service/src/server');
const { Pool } = require('pg');

// Mock database
jest.mock('pg', () => {
    const mPool = {
        query: jest.fn(),
        connect: jest.fn(),
        end: jest.fn(),
    };
    return { Pool: jest.fn(() => mPool) };
});

describe('Payment Service Unit Tests', () => {
    let pool;

    beforeEach(() => {
        pool = new Pool();
        jest.clearAllMocks();
    });

    describe('Payment Creation', () => {
        it('should create payment with valid data', async () => {
            const mockPayment = {
                id: '123',
                order_id: 'order-456',
                user_id: 'user-789',
                amount: 500,
                currency: 'INR',
                status: 'pending'
            };

            pool.query.mockResolvedValueOnce({ rows: [mockPayment] });

            const response = await request(app)
                .post('/api/create-payment')
                .send({
                    amount: 500,
                    orderId: 'order-456',
                    userId: 'user-789'
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('paymentId');
            expect(response.body.amount).toBe(500);
        });

        it('should reject payment without amount', async () => {
            const response = await request(app)
                .post('/api/create-payment')
                .send({
                    orderId: 'order-456',
                    userId: 'user-789'
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });

        it('should reject payment without orderId', async () => {
            const response = await request(app)
                .post('/api/create-payment')
                .send({
                    amount: 500,
                    userId: 'user-789'
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Missing required fields');
        });
    });

    describe('Payment Status', () => {
        it('should return payment status for valid payment', async () => {
            const mockPayment = {
                id: 'payment-123',
                status: 'completed',
                amount: 500,
                currency: 'INR'
            };

            pool.query.mockResolvedValueOnce({ rows: [mockPayment] });

            const response = await request(app)
                .get('/api/payment-status/payment-123');

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('completed');
            expect(response.body.amount).toBe(500);
        });

        it('should return 404 for non-existent payment', async () => {
            pool.query.mockResolvedValueOnce({ rows: [] });

            const response = await request(app)
                .get('/api/payment-status/invalid-id');

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Payment not found');
        });
    });

    describe('Payment Refund', () => {
        it('should refund completed payment', async () => {
            const mockPayment = {
                id: 'payment-123',
                status: 'completed',
                order_id: 'order-456'
            };

            pool.query
                .mockResolvedValueOnce({ rows: [mockPayment] }) // Get payment
                .mockResolvedValueOnce({ rows: [] }) // Update payment
                .mockResolvedValueOnce({ rows: [] }); // Update order

            const response = await request(app)
                .post('/api/refund/payment-123');

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('refunded');
        });

        it('should not refund pending payment', async () => {
            const mockPayment = {
                id: 'payment-123',
                status: 'pending'
            };

            pool.query.mockResolvedValueOnce({ rows: [mockPayment] });

            const response = await request(app)
                .post('/api/refund/payment-123');

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Only completed payments can be refunded');
        });
    });
});