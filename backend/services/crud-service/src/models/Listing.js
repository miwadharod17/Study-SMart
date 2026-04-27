class Listing {
    constructor(data) {
        this.id = data.id;
        this.title = data.title;
        this.description = data.description;
        this.price = parseFloat(data.price);
        this.type = data.type; // 'book' or 'note'
        this.status = data.status || 'active';
        this.sellerId = data.seller_id;
        this.metadata = data.metadata || {};
        this.createdAt = data.created_at;
        this.updatedAt = data.updated_at;
    }

    toJSON() {
        return {
            id: this.id,
            title: this.title,
            description: this.description,
            price: this.price,
            type: this.type,
            status: this.status,
            sellerId: this.sellerId,
            metadata: this.metadata,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

module.exports = Listing;