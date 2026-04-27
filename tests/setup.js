const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'studysmart_test';

global.beforeAll(async () => {
    // Create test database
    const pool = new Pool({
        host: 'localhost',
        port: 5432,
        user: 'studysmart_user',
        password: 'SecurePass123!',
        database: 'postgres'
    });
    
    try {
        await pool.query('DROP DATABASE IF EXISTS studysmart_test');
        await pool.query('CREATE DATABASE studysmart_test');
    } catch (error) {
        console.error('Error creating test database:', error);
    }
    await pool.end();
    
    // Initialize schema
    const initPool = new Pool({
        host: 'localhost',
        port: 5432,
        user: 'studysmart_user',
        password: 'SecurePass123!',
        database: 'studysmart_test'
    });
    
    const initSql = fs.readFileSync(
        path.join(__dirname, '../backend/database/init.sql'),
        'utf8'
    );
    
    await initPool.query(initSql);
    await initPool.end();
});

global.afterAll(async () => {
    const pool = new Pool({
        host: 'localhost',
        port: 5432,
        user: 'studysmart_user',
        password: 'SecurePass123!',
        database: 'postgres'
    });
    
    await pool.query('DROP DATABASE IF EXISTS studysmart_test');
    await pool.end();
});