const request = require('supertest');
const { app } = require('../../backend/services/forum-service/src/server');

// Mock database
jest.mock('pg', () => {
    const mPool = {
        query: jest.fn(),
        connect: jest.fn(),
    };
    return { Pool: jest.fn(() => mPool) };
});

describe('Forum Service Unit Tests', () => {
    let pool;

    beforeEach(() => {
        const { Pool } = require('pg');
        pool = new Pool();
        jest.clearAllMocks();
    });

    describe('Question Operations', () => {
        it('should create a new question', async () => {
            const mockQuestion = {
                id: 'q-123',
                title: 'Test Question',
                content: 'This is a test question content',
                author_id: 'user-123',
                tags: ['test', 'javascript']
            };

            pool.query.mockResolvedValueOnce({ rows: [mockQuestion] });

            const response = await request(app)
                .post('/api/questions')
                .set('Authorization', 'Bearer mock-token')
                .send({
                    title: 'Test Question',
                    content: 'This is a test question content',
                    tags: ['test', 'javascript']
                });

            expect(response.status).toBe(201);
            expect(response.body.title).toBe('Test Question');
        });

        it('should get all questions with pagination', async () => {
            const mockQuestions = {
                rows: [
                    { id: '1', title: 'Question 1', votes: 10 },
                    { id: '2', title: 'Question 2', votes: 5 }
                ]
            };
            const mockCount = { rows: [{ count: '2' }] };

            pool.query
                .mockResolvedValueOnce(mockQuestions)
                .mockResolvedValueOnce(mockCount);

            const response = await request(app)
                .get('/api/questions?page=1&limit=10');

            expect(response.status).toBe(200);
            expect(response.body.questions).toHaveLength(2);
            expect(response.body.pagination).toHaveProperty('page', 1);
        });

        it('should get single question by ID', async () => {
            const mockQuestion = {
                rows: [{
                    id: 'q-123',
                    title: 'Test Question',
                    content: 'Test content',
                    author_name: 'Test User'
                }]
            };
            const mockAnswers = { rows: [] };

            pool.query
                .mockResolvedValueOnce(mockQuestion)
                .mockResolvedValueOnce(mockAnswers);

            const response = await request(app)
                .get('/api/questions/q-123');

            expect(response.status).toBe(200);
            expect(response.body.question.id).toBe('q-123');
        });

        it('should vote on question', async () => {
            pool.query.mockResolvedValueOnce({ rows: [{ votes: 11 }] });

            const response = await request(app)
                .post('/api/questions/q-123/vote')
                .set('Authorization', 'Bearer mock-token')
                .send({ voteType: 'up' });

            expect(response.status).toBe(200);
            expect(response.body.votes).toBe(11);
        });
    });

    describe('Answer Operations', () => {
        it('should create answer for question', async () => {
            const mockAnswer = {
                id: 'a-123',
                content: 'This is an answer',
                question_id: 'q-123',
                author_id: 'user-456'
            };

            pool.query
                .mockResolvedValueOnce({ rows: [mockAnswer] })
                .mockResolvedValueOnce({ rows: [] });

            const response = await request(app)
                .post('/api/questions/q-123/answers')
                .set('Authorization', 'Bearer mock-token')
                .send({ content: 'This is an answer' });

            expect(response.status).toBe(201);
            expect(response.body.content).toBe('This is an answer');
        });

        it('should accept answer', async () => {
            const mockAnswer = {
                rows: [{
                    id: 'a-123',
                    question_id: 'q-123',
                    author_id: 'user-456'
                }]
            };

            pool.query
                .mockResolvedValueOnce(mockAnswer)
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [] });

            const response = await request(app)
                .post('/api/answers/a-123/accept')
                .set('Authorization', 'Bearer mock-token');

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Answer accepted successfully');
        });
    });
});