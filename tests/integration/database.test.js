const { Pool } = require('pg');

describe('Database Integration Tests', () => {
    let pool;

    beforeAll(async () => {
        pool = new Pool({
            host: 'localhost',
            port: 5432,
            user: 'studysmart_user',
            password: 'SecurePass123!',
            database: 'studysmart_test'
        });
        
        // Create test tables
        await pool.query(`
            CREATE TABLE IF NOT EXISTS test_users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE,
                name VARCHAR(255)
            )
        `);
    });

    afterAll(async () => {
        await pool.query('DROP TABLE IF EXISTS test_users');
        await pool.end();
    });

    beforeEach(async () => {
        await pool.query('TRUNCATE test_users');
    });

    describe('CRUD Operations', () => {
        it('should insert and retrieve user', async () => {
            await pool.query(
                'INSERT INTO test_users (email, name) VALUES ($1, $2)',
                ['test@example.com', 'Test User']
            );
            
            const result = await pool.query(
                'SELECT * FROM test_users WHERE email = $1',
                ['test@example.com']
            );
            
            expect(result.rows[0].email).toBe('test@example.com');
            expect(result.rows[0].name).toBe('Test User');
        });

        it('should update user', async () => {
            await pool.query(
                'INSERT INTO test_users (email, name) VALUES ($1, $2)',
                ['update@example.com', 'Old Name']
            );
            
            await pool.query(
                'UPDATE test_users SET name = $1 WHERE email = $2',
                ['New Name', 'update@example.com']
            );
            
            const result = await pool.query(
                'SELECT * FROM test_users WHERE email = $1',
                ['update@example.com']
            );
            
            expect(result.rows[0].name).toBe('New Name');
        });

        it('should delete user', async () => {
            await pool.query(
                'INSERT INTO test_users (email, name) VALUES ($1, $2)',
                ['delete@example.com', 'To Delete']
            );
            
            await pool.query(
                'DELETE FROM test_users WHERE email = $1',
                ['delete@example.com']
            );
            
            const result = await pool.query(
                'SELECT * FROM test_users WHERE email = $1',
                ['delete@example.com']
            );
            
            expect(result.rows).toHaveLength(0);
        });
    });

    describe('Transactions', () => {
        it('should rollback on error', async () => {
            const client = await pool.connect();
            
            try {
                await client.query('BEGIN');
                
                await client.query(
                    'INSERT INTO test_users (email, name) VALUES ($1, $2)',
                    ['transaction@example.com', 'Transaction User']
                );
                
                // Force error
                await client.query('INSERT INTO test_users (email, name) VALUES ($1, $2)', [null, 'No Email']);
                
                await client.query('COMMIT');
            } catch (error) {
                await client.query('ROLLBACK');
            } finally {
                client.release();
            }
            
            const result = await pool.query(
                'SELECT * FROM test_users WHERE email = $1',
                ['transaction@example.com']
            );
            
            expect(result.rows).toHaveLength(0);
        });
    });
});