const puppeteer = require('puppeteer');

describe('Checkout Flow E2E Tests', () => {
    let browser;
    let page;
    
    beforeAll(async () => {
        browser = await puppeteer.launch({ headless: true });
        page = await browser.newPage();
        await page.goto('http://localhost:3000');
        
        // Login first
        await page.click('a:contains("Sign in")');
        await page.type('input[type="email"]', 'test@example.com');
        await page.type('input[type="password"]', 'TestPass123');
        await page.click('button:contains("Sign in")');
        await page.waitForNavigation();
    });
    
    afterAll(async () => {
        await browser.close();
    });
    
    describe('Payment Processing', () => {
        it('should show correct order summary', async () => {
            await page.click('.cart-icon');
            await page.click('button:contains("Proceed to Checkout")');
            
            const totalAmount = await page.$eval('.order-total', el => el.textContent);
            expect(totalAmount).toMatch(/₹\d+/);
        });
        
        it('should fill shipping address', async () => {
            await page.type('input[name="fullName"]', 'Test User');
            await page.type('input[name="phone"]', '9876543210');
            await page.type('input[name="address"]', '123 College Road');
            await page.type('input[name="city"]', 'Mumbai');
            await page.type('input[name="pincode"]', '400001');
        });
        
        it('should select payment method', async () => {
            await page.click('input[value="razorpay"]');
            const isChecked = await page.$eval('input[value="razorpay"]', el => el.checked);
            expect(isChecked).toBe(true);
        });
        
        it('should place order', async () => {
            await page.click('button:contains("Place order")');
            await page.waitForSelector('.order-confirmation', { timeout: 10000 });
            
            const confirmation = await page.$eval('.order-confirmation h2', el => el.textContent);
            expect(confirmation).toContain('Order Confirmed');
        });
    });
});