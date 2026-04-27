const validation = require('../../backend/services/crud-service/src/utils/validation');

describe('Validation Functions Tests', () => {
    describe('validateEmail', () => {
        it('should accept valid emails', () => {
            expect(validation.validateEmail('test@example.com')).toBe(true);
            expect(validation.validateEmail('user.name@domain.co.in')).toBe(true);
            expect(validation.validateEmail('email@sub.domain.com')).toBe(true);
        });

        it('should reject invalid emails', () => {
            expect(validation.validateEmail('invalid-email')).toBe(false);
            expect(validation.validateEmail('missing@domain')).toBe(false);
            expect(validation.validateEmail('@domain.com')).toBe(false);
            expect(validation.validateEmail('')).toBe(false);
        });
    });

    describe('validatePassword', () => {
        it('should accept passwords with 6+ characters', () => {
            expect(validation.validatePassword('123456')).toBe(true);
            expect(validation.validatePassword('SecurePass123')).toBe(true);
        });

        it('should reject short passwords', () => {
            expect(validation.validatePassword('12345')).toBe(false);
            expect(validation.validatePassword('')).toBe(false);
        });
    });

    describe('validatePrice', () => {
        it('should accept positive prices', () => {
            expect(validation.validatePrice(100)).toBe(true);
            expect(validation.validatePrice(0.99)).toBe(true);
            expect(validation.validatePrice(1000)).toBe(true);
        });

        it('should reject invalid prices', () => {
            expect(validation.validatePrice(0)).toBe(false);
            expect(validation.validatePrice(-10)).toBe(false);
            expect(validation.validatePrice(null)).toBe(false);
            expect(validation.validatePrice('invalid')).toBe(false);
        });
    });

    describe('validateBookData', () => {
        it('should return no errors for valid book data', () => {
            const validData = {
                title: 'Valid Book Title',
                price: 500,
                category: 'Textbooks'
            };
            const errors = validation.validateBookData(validData);
            expect(errors).toHaveLength(0);
        });

        it('should return errors for missing title', () => {
            const invalidData = {
                price: 500,
                category: 'Textbooks'
            };
            const errors = validation.validateBookData(invalidData);
            expect(errors).toContain('Title must be at least 3 characters');
        });

        it('should return errors for invalid price', () => {
            const invalidData = {
                title: 'Valid Title',
                price: -10,
                category: 'Textbooks'
            };
            const errors = validation.validateBookData(invalidData);
            expect(errors).toContain('Price must be greater than 0');
        });
    });
});