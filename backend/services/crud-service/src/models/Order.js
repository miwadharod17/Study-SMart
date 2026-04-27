class Order {
    constructor(data) {
        this.id = data.id;
        this.buyerId = data.buyer_id;
        this.sellerId = data.seller_id;
        this.bookId = data.book_id;
        this.quantity = data.quantity;
        this.totalAmount = parseFloat(data.total_amount);
        this.status = data.status || 'pending';
        this.paymentId = data.payment_id;
        this.shippingAddress = data.shipping_address;
        this.trackingNumber = data.tracking_number;
        this.createdAt = data.created_at;
        this.updatedAt = data.updated_at;
    }

    toJSON() {
        return {
            id: this.id,
            buyerId: this.buyerId,
            sellerId: this.sellerId,
            bookId: this.bookId,
            quantity: this.quantity,
            totalAmount: this.totalAmount,
            status: this.status,
            paymentId: this.paymentId,
            shippingAddress: this.shippingAddress,
            trackingNumber: this.trackingNumber,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

module.exports = Order;