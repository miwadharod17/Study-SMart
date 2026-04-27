class Question {
    constructor(data) {
        this.id = data.id;
        this.title = data.title;
        this.content = data.content;
        this.authorId = data.author_id;
        this.tags = data.tags || [];
        this.votes = data.votes || 0;
        this.views = data.views || 0;
        this.answersCount = data.answers_count || 0;
        this.isResolved = data.is_resolved || false;
        this.createdAt = data.created_at;
        this.updatedAt = data.updated_at;
    }

    toJSON() {
        return {
            id: this.id,
            title: this.title,
            content: this.content,
            authorId: this.authorId,
            tags: this.tags,
            votes: this.votes,
            views: this.views,
            answersCount: this.answersCount,
            isResolved: this.isResolved,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

module.exports = Question;