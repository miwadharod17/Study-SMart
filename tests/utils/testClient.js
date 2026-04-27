const axios = require('axios');

class TestClient {
    constructor(baseURL) {
        this.client = axios.create({
            baseURL,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        this.authToken = null;
    }
    
    setAuthToken(token) {
        this.authToken = token;
        this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    
    async register(email, password, fullName) {
        const response = await this.client.post('/api/users/register', {
            email,
            password,
            fullName
        });
        if (response.data.token) {
            this.setAuthToken(response.data.token);
        }
        return response.data;
    }
    
    async login(email, password) {
        const response = await this.client.post('/api/users/login', {
            email,
            password
        });
        if (response.data.token) {
            this.setAuthToken(response.data.token);
        }
        return response.data;
    }
    
    async createBook(bookData) {
        const response = await this.client.post('/api/books', bookData);
        return response.data;
    }
    
    async getBooks(params = {}) {
        const response = await this.client.get('/api/books', { params });
        return response.data;
    }
    
    async createQuestion(title, content, tags) {
        const response = await this.client.post('/api/questions', {
            title,
            content,
            tags
        });
        return response.data;
    }
    
    async createPayment(amount, orderId, userId) {
        const response = await this.client.post('/api/create-payment', {
            amount,
            orderId,
            userId
        });
        return response.data;
    }
}

module.exports = TestClient;