class Book {
    constructor(data) {
        this.id = data.id;
        this.title = data.title;
        this.description = data.description;
        this.price = parseFloat(data.price);
        this.condition = data.condition;
        this.category = data.category;
        this.stock = data.stock || 1;
        this.sellerId = data.seller_id;
        this.images = data.images || [];
        this.isActive = data.is_active;
        this.createdAt = data.created_at;
        this.updatedAt = data.updated_at;
    }

    isValid() {
        return this.title && this.price > 0 && this.sellerId;
    }

    toJSON() {
        return {
            id: this.id,
            title: this.title,
            description: this.description,
            price: this.price,
            condition: this.condition,
            category: this.category,
            stock: this.stock,
            sellerId: this.sellerId,
            images: this.images,
            isActive: this.isActive,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

module.exports = Book;