class Answer {
    constructor(data) {
        this.id = data.id;
        this.questionId = data.question_id;
        this.content = data.content;
        this.authorId = data.author_id;
        this.votes = data.votes || 0;
        this.isAccepted = data.is_accepted || false;
        this.createdAt = data.created_at;
        this.updatedAt = data.updated_at;
    }

    toJSON() {
        return {
            id: this.id,
            questionId: this.questionId,
            content: this.content,
            authorId: this.authorId,
            votes: this.votes,
            isAccepted: this.isAccepted,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

module.exports = Answer;