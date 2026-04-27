const request = require('supertest');
const app = require('../../backend/services/crud-service/src/server');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Mock database
jest.mock('pg', () => {
    const mPool = {
        query: jest.fn(),
        connect: jest.fn(),
    };
    return { Pool: jest.fn(() => mPool) };
});

jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('CRUD Service Unit Tests', () => {
    let pool;

    beforeEach(() => {
        const { Pool } = require('pg');
        pool = new Pool();
        jest.clearAllMocks();
    });

    describe('User Authentication', () => {
        it('should register new user', async () => {
            pool.query
                .mockResolvedValueOnce({ rows: [] }) // Check existing user
                .mockResolvedValueOnce({ rows: [{ id: 'user-123', email: 'test@test.com', full_name: 'Test User', role: 'student' }] });

            bcrypt.hash.mockResolvedValue('hashed-password');
            jwt.sign.mockReturnValue('mock-jwt-token');

            const response = await request(app)
                .post('/api/users/register')
                .send({
                    email: 'test@test.com',
                    password: 'password123',
                    fullName: 'Test User'
                });

            expect(response.status).toBe(201);
            expect(response.body.user.email).toBe('test@test.com');
            expect(response.body).toHaveProperty('token');
        });

        it('should not register duplicate email', async () => {
            pool.query.mockResolvedValueOnce({ rows: [{ id: 'existing-user' }] });

            const response = await request(app)
                .post('/api/users/register')
                .send({
                    email: 'existing@test.com',
                    password: 'password123',
                    fullName: 'Existing User'
                });

            expect(response.status).toBe(409);
            expect(response.body.error).toBe('Email already registered');
        });

        it('should login with valid credentials', async () => {
            const mockUser = {
                rows: [{
                    id: 'user-123',
                    email: 'test@test.com',
                    password_hash: 'hashed-password',
                    full_name: 'Test User',
                    role: 'student'
                }]
            };

            pool.query
                .mockResolvedValueOnce(mockUser)
                .mockResolvedValueOnce({ rows: [] });

            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue('mock-jwt-token');

            const response = await request(app)
                .post('/api/users/login')
                .send({
                    email: 'test@test.com',
                    password: 'password123'
                });

            expect(response.status).toBe(200);
            expect(response.body.user.email).toBe('test@test.com');
            expect(response.body).toHaveProperty('token');
        });

        it('should reject login with invalid password', async () => {
            const mockUser = {
                rows: [{
                    id: 'user-123',
                    email: 'test@test.com',
                    password_hash: 'hashed-password',
                    full_name: 'Test User'
                }]
            };

            pool.query.mockResolvedValueOnce(mockUser);
            bcrypt.compare.mockResolvedValue(false);

            const response = await request(app)
                .post('/api/users/login')
                .send({
                    email: 'test@test.com',
                    password: 'wrong-password'
                });

            expect(response.status).toBe(401);
            expect(response.body.error).toBe('Invalid credentials');
        });
    });

    describe('Book Operations', () => {
        it('should create new book listing', async () => {
            const mockBook = {
                rows: [{
                    id: 'book-123',
                    title: 'Test Book',
                    price: 500,
                    condition: 'used',
                    seller_id: 'user-123'
                }]
            };

            pool.query.mockResolvedValueOnce(mockBook);

            const response = await request(app)
                .post('/api/books')
                .set('Authorization', 'Bearer mock-token')
                .send({
                    title: 'Test Book',
                    description: 'Test description',
                    price: 500,
                    condition: 'used',
                    category: 'Textbooks'
                });

            expect(response.status).toBe(201);
            expect(response.body.title).toBe('Test Book');
            expect(response.body.price).toBe(500);
        });

        it('should get all books with filters', async () => {
            const mockBooks = {
                rows: [
                    { id: '1', title: 'Book 1', price: 500 },
                    { id: '2', title: 'Book 2', price: 700 }
                ]
            };
            const mockCount = { rows: [{ count: '2' }] };

            pool.query
                .mockResolvedValueOnce(mockBooks)
                .mockResolvedValueOnce(mockCount);

            const response = await request(app)
                .get('/api/books?category=Textbooks&minPrice=100&maxPrice=1000');

            expect(response.status).toBe(200);
            expect(response.body.books).toHaveLength(2);
            expect(response.body.pagination).toHaveProperty('total', 2);
        });

        it('should search books by title', async () => {
            const mockBooks = {
                rows: [
                    { id: '1', title: 'JavaScript Book', price: 500 }
                ]
            };

            pool.query.mockResolvedValueOnce(mockBooks);

            const response = await request(app)
                .get('/api/books/search/JavaScript');

            expect(response.status).toBe(200);
            expect(response.body[0].title).toContain('JavaScript');
        });
    });

    describe('Order Operations', () => {
        it('should create new order', async () => {
            const mockBook = {
                rows: [{ price: 500, seller_id: 'seller-123', title: 'Test Book' }]
            };
            const mockOrder = {
                rows: [{
                    id: 'order-123',
                    buyer_id: 'buyer-123',
                    total_amount: 500,
                    status: 'pending'
                }]
            };

            pool.query
                .mockResolvedValueOnce(mockBook)
                .mockResolvedValueOnce(mockOrder);

            const response = await request(app)
                .post('/api/orders')
                .set('Authorization', 'Bearer mock-token')
                .send({
                    bookId: 'book-123',
                    quantity: 1,
                    shippingAddress: { city: 'Mumbai', pincode: '400001' }
                });

            expect(response.status).toBe(201);
            expect(response.body.status).toBe('pending');
            expect(response.body.total_amount).toBe(500);
        });

        it('should get user orders', async () => {
            const mockOrders = {
                rows: [
                    { id: 'order-1', total_amount: 500, status: 'completed' },
                    { id: 'order-2', total_amount: 700, status: 'pending' }
                ]
            };

            pool.query.mockResolvedValueOnce(mockOrders);

            const response = await request(app)
                .get('/api/orders/my-orders')
                .set('Authorization', 'Bearer mock-token');

            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(2);
        });
    });
});