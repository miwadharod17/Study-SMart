const faker = require('@faker-js/faker').faker;

class MockDataGenerator {
    static generateUser() {
        return {
            email: faker.internet.email(),
            password: 'TestPass123!',
            fullName: faker.person.fullName(),
            role: faker.helpers.arrayElement(['student', 'seller', 'admin'])
        };
    }
    
    static generateBook() {
        return {
            title: faker.lorem.words(3),
            description: faker.lorem.paragraph(),
            price: faker.number.int({ min: 100, max: 5000 }),
            condition: faker.helpers.arrayElement(['new', 'used', 'like-new']),
            category: faker.helpers.arrayElement(['Textbooks', 'Notes', 'Lab Manuals', 'Stationery']),
            stock: faker.number.int({ min: 1, max: 10 })
        };
    }
    
    static generateQuestion() {
        return {
            title: faker.lorem.sentence(),
            content: faker.lorem.paragraphs(2),
            tags: Array.from({ length: 3 }, () => faker.lorem.word())
        };
    }
    
    static generateOrder() {
        return {
            quantity: faker.number.int({ min: 1, max: 3 }),
            shippingAddress: {
                address: faker.location.streetAddress(),
                city: faker.location.city(),
                pincode: faker.location.zipCode()
            }
        };
    }
    
    static generatePayment() {
        return {
            amount: faker.number.int({ min: 100, max: 5000 }),
            currency: 'INR',
            method: faker.helpers.arrayElement(['card', 'upi', 'netbanking'])
        };
    }
}

module.exports = MockDataGenerator;