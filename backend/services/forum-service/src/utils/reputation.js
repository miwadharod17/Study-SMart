const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'postgres',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

class ReputationManager {
    static async updateReputation(userId, action) {
        let points = 0;
        
        switch (action) {
            case 'question_upvoted':
                points = 10;
                break;
            case 'answer_upvoted':
                points = 5;
                break;
            case 'answer_accepted':
                points = 15;
                break;
            case 'question_created':
                points = 2;
                break;
            case 'answer_created':
                points = 3;
                break;
            default:
                return;
        }
        
        await pool.query(
            'UPDATE users SET reputation = reputation + $1 WHERE id = $2',
            [points, userId]
        );
    }
    
    static async getLeaderboard(limit = 10) {
        const result = await pool.query(
            `SELECT id, full_name, reputation
             FROM users
             ORDER BY reputation DESC
             LIMIT $1`,
            [limit]
        );
        
        return result.rows;
    }
}

module.exports = ReputationManager;