const helpers = require('../../backend/services/crud-service/src/utils/helpers');

describe('Helper Functions Tests', () => {
    describe('formatCurrency', () => {
        it('should format INR currency correctly', () => {
            expect(helpers.formatCurrency(500, 'INR')).toBe('₹500.00');
            expect(helpers.formatCurrency(1234.56, 'INR')).toBe('₹1,234.56');
        });

        it('should format USD currency correctly', () => {
            expect(helpers.formatCurrency(500, 'USD')).toBe('$500.00');
        });

        it('should handle zero amount', () => {
            expect(helpers.formatCurrency(0, 'INR')).toBe('₹0.00');
        });
    });

    describe('generateSlug', () => {
        it('should generate slug from text', () => {
            expect(helpers.generateSlug('Hello World')).toBe('hello-world');
            expect(helpers.generateSlug('JavaScript Programming')).toBe('javascript-programming');
        });

        it('should handle special characters', () => {
            expect(helpers.generateSlug('Hello@World!')).toBe('helloworld');
            expect(helpers.generateSlug('C++ Programming')).toBe('c-programming');
        });
    });

    describe('truncateText', () => {
        it('should truncate text longer than limit', () => {
            const longText = 'This is a very long text that needs to be truncated';
            expect(helpers.truncateText(longText, 20)).toBe('This is a very long...');
        });

        it('should not truncate text shorter than limit', () => {
            const shortText = 'Short text';
            expect(helpers.truncateText(shortText, 20)).toBe('Short text');
        });
    });

    describe('paginate', () => {
        it('should calculate pagination correctly', () => {
            const result = helpers.paginate(1, 10, 100);
            expect(result.currentPage).toBe(1);
            expect(result.perPage).toBe(10);
            expect(result.totalPages).toBe(10);
            expect(result.hasNext).toBe(true);
            expect(result.hasPrev).toBe(false);
        });

        it('should handle last page correctly', () => {
            const result = helpers.paginate(10, 10, 100);
            expect(result.hasNext).toBe(false);
            expect(result.hasPrev).toBe(true);
        });

        it('should handle empty results', () => {
            const result = helpers.paginate(1, 10, 0);
            expect(result.totalPages).toBe(0);
            expect(result.hasNext).toBe(false);
        });
    });
});