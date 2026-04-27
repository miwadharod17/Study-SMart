const { Pool } = require('pg');

class TestDatabase {
    constructor() {
        this.pool = null;
        this.isConnected = false;
    }
    
    async connect() {
        this.pool = new Pool({
            host: process.env.TEST_DB_HOST || 'localhost',
            port: process.env.TEST_DB_PORT || 5432,
            user: process.env.TEST_DB_USER || 'studysmart_user',
            password: process.env.TEST_DB_PASSWORD || 'SecurePass123!',
            database: process.env.TEST_DB_NAME || 'studysmart_test',
        });
        
        try {
            await this.pool.connect();
            this.isConnected = true;
        } catch (error) {
            console.error('Test DB connection failed:', error);
            throw error;
        }
    }
    
    async clearTables() {
        const tables = ['users', 'books', 'orders', 'questions', 'answers', 'payments'];
        for (const table of tables) {
            await this.pool.query(`TRUNCATE TABLE ${table} CASCADE`);
        }
    }
    
    async insertTestData(table, data) {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
        
        const query = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`;
        const result = await this.pool.query(query, values);
        return result.rows[0];
    }
    
    async disconnect() {
        if (this.pool) {
            await this.pool.end();
            this.isConnected = false;
        }
    }
}

module.exports = new TestDatabase();