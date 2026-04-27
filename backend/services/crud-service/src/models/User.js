class User {
    constructor(data) {
        this.id = data.id;
        this.email = data.email;
        this.fullName = data.full_name;
        this.role = data.role || 'student';
        this.reputation = data.reputation || 0;
        this.isVerified = data.is_verified || false;
        this.createdAt = data.created_at;
        this.lastLogin = data.last_login;
    }

    toJSON() {
        return {
            id: this.id,
            email: this.email,
            fullName: this.fullName,
            role: this.role,
            reputation: this.reputation,
            isVerified: this.isVerified,
            createdAt: this.createdAt,
            lastLogin: this.lastLogin
        };
    }
}

module.exports = User;