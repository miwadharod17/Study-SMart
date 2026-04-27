// Stripe client wrapper - ready for when credentials are added
class StripeClient {
    constructor() {
        this.stripe = null;
        this.isAvailable = false;
        
        if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_placeholder') {
            try {
                const Stripe = require('stripe');
                this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
                this.isAvailable = true;
                console.log('Stripe client initialized');
            } catch (error) {
                console.warn('Stripe initialization failed:', error.message);
            }
        } else {
            console.log('Stripe not configured - running in mock mode');
        }
    }

    async createPaymentIntent(amount, currency, metadata) {
        if (!this.isAvailable) {
            return { clientSecret: 'mock_secret_' + Date.now(), id: 'mock_' + Date.now() };
        }
        
        return await this.stripe.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency: currency || 'inr',
            metadata
        });
    }

    async refundPayment(paymentIntentId) {
        if (!this.isAvailable) {
            return { id: 'mock_refund_' + Date.now() };
        }
        
        return await this.stripe.refunds.create({ payment_intent: paymentIntentId });
    }
}

module.exports = new StripeClient();