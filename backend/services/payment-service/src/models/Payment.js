// Payment model for data validation
class Payment {
    constructor(data) {
        this.id = data.id;
        this.orderId = data.order_id;
        this.userId = data.user_id;
        this.amount = data.amount;
        this.currency = data.currency || 'INR';
        this.status = data.status || 'pending';
        this.paymentMethod = data.payment_method;
        this.stripePaymentId = data.stripe_payment_id;
        this.metadata = data.metadata || {};
        this.createdAt = data.created_at;
        this.completedAt = data.completed_at;
    }

    isValid() {
        return this.amount > 0 && this.orderId && this.userId;
    }

    toJSON() {
        return {
            id: this.id,
            orderId: this.orderId,
            userId: this.userId,
            amount: this.amount,
            currency: this.currency,
            status: this.status,
            paymentMethod: this.paymentMethod,
            createdAt: this.createdAt,
            completedAt: this.completedAt
        };
    }
}

module.exports = Payment;