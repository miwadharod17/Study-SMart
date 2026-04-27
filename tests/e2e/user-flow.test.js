const puppeteer = require('puppeteer');

describe('End-to-End User Flow', () => {
    let browser;
    let page;
    
    beforeAll(async () => {
        browser = await puppeteer.launch({ headless: true });
        page = await browser.newPage();
        await page.goto('http://localhost:3000');
    });
    
    afterAll(async () => {
        await browser.close();
    });
    
    describe('User Registration and Login', () => {
        it('should navigate to signup page', async () => {
            await page.click('a:contains("Get started")');
            await page.waitForSelector('h2:contains("Create your account")');
            expect(await page.title()).toContain('Sign Up');
        });
        
        it('should fill registration form', async () => {
            await page.type('input[name="fullName"]', 'E2E Test User');
            await page.type('input[name="email"]', `e2e_${Date.now()}@test.com`);
            await page.type('input[name="password"]', 'TestPass123');
            await page.click('button[type="submit"]');
            
            await page.waitForNavigation();
            expect(await page.url()).toContain('/');
        });
        
        it('should login with created account', async () => {
            await page.click('a:contains("Sign in")');
            await page.type('input[type="email"]', 'e2e@test.com');
            await page.type('input[type="password"]', 'TestPass123');
            await page.click('button:contains("Sign in")');
            
            await page.waitForSelector('.user-menu');
            const profileText = await page.$eval('.user-menu', el => el.textContent);
            expect(profileText).toContain('E2E Test User');
        });
    });
    
    describe('Marketplace Browsing', () => {
        it('should browse marketplace', async () => {
            await page.click('a:contains("Browse")');
            await page.waitForSelector('.book-card');
            
            const bookCount = await page.$$eval('.book-card', cards => cards.length);
            expect(bookCount).toBeGreaterThan(0);
        });
        
        it('should filter books by category', async () => {
            await page.select('select[name="category"]', 'Textbooks');
            await page.click('button:contains("Apply")');
            
            await page.waitForFunction(() => {
                const books = document.querySelectorAll('.book-card');
                return books.length > 0;
            });
        });
    });
    
    describe('Shopping Cart Flow', () => {
        it('should add book to cart', async () => {
            await page.click('.book-card:first-child button:contains("Add to Cart")');
            
            const cartCount = await page.$eval('.cart-badge', el => el.textContent);
            expect(parseInt(cartCount)).toBeGreaterThan(0);
        });
        
        it('should navigate to cart', async () => {
            await page.click('.cart-icon');
            await page.waitForSelector('h1:contains("Shopping Cart")');
            
            const cartItem = await page.$('.cart-item');
            expect(cartItem).not.toBeNull();
        });
        
        it('should proceed to checkout', async () => {
            await page.click('button:contains("Proceed to Checkout")');
            await page.waitForSelector('h1:contains("Checkout")');
            
            await page.type('input[name="address"]', '123 Test Street');
            await page.type('input[name="city"]', 'Mumbai');
            await page.type('input[name="pincode"]', '400001');
            await page.click('button:contains("Place order")');
            
            await page.waitForSelector('.order-success');
            expect(await page.$eval('.order-success', el => el.textContent)).toContain('Order placed');
        });
    });
    
    describe('Forum Interaction', () => {
        it('should navigate to forum', async () => {
            await page.click('a:contains("Forum")');
            await page.waitForSelector('.question-list');
        });
        
        it('should create new question', async () => {
            await page.click('button:contains("Ask a question")');
            await page.type('input[name="title"]', 'E2E Test Question');
            await page.type('textarea[name="content"]', 'This is an end-to-end test question');
            await page.click('button:contains("Post Question")');
            
            await page.waitForSelector('.question:first-child');
            const questionTitle = await page.$eval('.question:first-child h3', el => el.textContent);
            expect(questionTitle).toContain('E2E Test Question');
        });
        
        it('should answer a question', async () => {
            await page.click('.question:first-child');
            await page.waitForSelector('.answer-form');
            await page.type('textarea[name="answer"]', 'This is a test answer');
            await page.click('button:contains("Post Answer")');
            
            await page.waitForSelector('.answer-item');
            const answerText = await page.$eval('.answer-item p', el => el.textContent);
            expect(answerText).toContain('This is a test answer');
        });
    });
});