const request = require('supertest');
const { Pool } = require('pg');

// Use test database
process.env.DB_NAME = 'studysmart_test';

let server;
let app;

describe('API Integration Tests', () => {
    let authToken;
    let testUserId;
    let testBookId;
    let testQuestionId;

    beforeAll(async () => {
        // Import app after setting test environment
        app = require('../../backend/services/crud-service/src/server');
        server = app.listen(4000);
    });

    afterAll(async () => {
        await server.close();
    });

    describe('Full User Flow', () => {
        it('should register a new user', async () => {
            const response = await request(app)
                .post('/api/users/register')
                .send({
                    email: 'flowtest@example.com',
                    password: 'testpass123',
                    fullName: 'Flow Test User'
                });

            expect(response.status).toBe(201);
            expect(response.body.user.email).toBe('flowtest@example.com');
            authToken = response.body.token;
            testUserId = response.body.user.id;
        });

        it('should login with registered user', async () => {
            const response = await request(app)
                .post('/api/users/login')
                .send({
                    email: 'flowtest@example.com',
                    password: 'testpass123'
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('token');
            authToken = response.body.token;
        });

        it('should create a book listing', async () => {
            const response = await request(app)
                .post('/api/books')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    title: 'Integration Test Book',
                    description: 'This is a test book',
                    price: 499,
                    condition: 'new',
                    category: 'Computer Science'
                });

            expect(response.status).toBe(201);
            expect(response.body.title).toBe('Integration Test Book');
            testBookId = response.body.id;
        });

        it('should get the created book', async () => {
            const response = await request(app)
                .get(`/api/books/${testBookId}`);

            expect(response.status).toBe(200);
            expect(response.body.title).toBe('Integration Test Book');
        });

        it('should create an order for the book', async () => {
            const response = await request(app)
                .post('/api/orders')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    bookId: testBookId,
                    quantity: 1,
                    shippingAddress: {
                        address: '123 Test St',
                        city: 'Mumbai',
                        pincode: '400001'
                    }
                });

            expect(response.status).toBe(201);
            expect(response.body.status).toBe('pending');
        });
    });

    describe('Forum Integration', () => {
        it('should create a forum question', async () => {
            const forumApp = require('../../backend/services/forum-service/src/server').app;
            
            const response = await request(forumApp)
                .post('/api/questions')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    title: 'Integration Test Question',
                    content: 'This is a test question content for integration testing',
                    tags: ['test', 'integration']
                });

            expect(response.status).toBe(201);
            testQuestionId = response.body.id;
        });

        it('should add answer to question', async () => {
            const forumApp = require('../../backend/services/forum-service/src/server').app;
            
            const response = await request(forumApp)
                .post(`/api/questions/${testQuestionId}/answers`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    content: 'This is a test answer'
                });

            expect(response.status).toBe(201);
        });
    });

    describe('Payment Integration', () => {
        it('should create payment intent', async () => {
            const paymentApp = require('../../backend/services/payment-service/src/server');
            
            const response = await request(paymentApp)
                .post('/api/create-payment')
                .send({
                    amount: 500,
                    orderId: 'test-order-123',
                    userId: testUserId
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('paymentId');
            expect(response.body.amount).toBe(500);
        });
    });
});