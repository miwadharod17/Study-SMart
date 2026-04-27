class Vote {
    constructor(data) {
        this.id = data.id;
        this.userId = data.user_id;
        this.entityType = data.entity_type; // 'question' or 'answer'
        this.entityId = data.entity_id;
        this.voteType = data.vote_type; // 'up' or 'down'
        this.createdAt = data.created_at;
    }

    toJSON() {
        return {
            id: this.id,
            userId: this.userId,
            entityType: this.entityType,
            entityId: this.entityId,
            voteType: this.voteType,
            createdAt: this.createdAt
        };
    }
}

module.exports = Vote;