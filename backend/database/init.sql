-- =========================
-- EXTENSIONS
-- =========================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================
-- USERS TABLE
-- =========================
CREATE TABLE IF NOT EXISTS users (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
email VARCHAR(255) UNIQUE NOT NULL,
password_hash VARCHAR(255) NOT NULL,
full_name VARCHAR(255) NOT NULL,
role VARCHAR(50) DEFAULT 'student',
reputation INT DEFAULT 0,
is_verified BOOLEAN DEFAULT FALSE,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
last_login TIMESTAMP
);

-- =========================
-- BOOKS TABLE
-- =========================
CREATE TABLE IF NOT EXISTS books (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
title VARCHAR(500) NOT NULL,
description TEXT,
price DECIMAL(10, 2) NOT NULL,
condition VARCHAR(50) DEFAULT 'used',
category VARCHAR(100) NOT NULL,
stock INT DEFAULT 1,
seller_id UUID REFERENCES users(id),
images TEXT[],
is_active BOOLEAN DEFAULT TRUE,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- ORDERS TABLE
-- =========================
CREATE TABLE IF NOT EXISTS orders (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
buyer_id UUID REFERENCES users(id),
seller_id UUID REFERENCES users(id),
book_id UUID REFERENCES books(id),
quantity INT DEFAULT 1,
total_amount DECIMAL(10, 2) NOT NULL,
status VARCHAR(50) DEFAULT 'pending',
payment_id UUID,
shipping_address JSONB,
tracking_number VARCHAR(100),
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- QUESTIONS TABLE
-- =========================
CREATE TABLE IF NOT EXISTS questions (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
title VARCHAR(500) NOT NULL,
content TEXT NOT NULL,
author_id UUID REFERENCES users(id),
tags TEXT[],
votes INT DEFAULT 0,
answers_count INT DEFAULT 0,
views INT DEFAULT 0,
is_resolved BOOLEAN DEFAULT FALSE,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- ANSWERS TABLE
-- =========================
CREATE TABLE IF NOT EXISTS answers (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
content TEXT NOT NULL,
author_id UUID REFERENCES users(id),
votes INT DEFAULT 0,
is_accepted BOOLEAN DEFAULT FALSE,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- PAYMENTS TABLE
-- =========================
CREATE TABLE IF NOT EXISTS payments (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
order_id UUID REFERENCES orders(id),
user_id UUID REFERENCES users(id),
amount DECIMAL(10, 2) NOT NULL,
currency VARCHAR(3) DEFAULT 'INR',
payment_method VARCHAR(50),
stripe_payment_id VARCHAR(255),
status VARCHAR(50) DEFAULT 'pending',
metadata JSONB,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
completed_at TIMESTAMP
);

-- =========================
-- INDEXES
-- =========================

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Books
CREATE INDEX idx_books_seller ON books(seller_id);
CREATE INDEX idx_books_category ON books(category);
CREATE INDEX idx_books_price ON books(price);

-- Orders
CREATE INDEX idx_orders_buyer ON orders(buyer_id);
CREATE INDEX idx_orders_seller ON orders(seller_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment ON orders(payment_id);

-- Questions
CREATE INDEX idx_questions_author ON questions(author_id);
CREATE INDEX idx_questions_votes ON questions(votes);
CREATE INDEX idx_questions_created ON questions(created_at DESC);

-- Answers
CREATE INDEX idx_answers_question ON answers(question_id);
CREATE INDEX idx_answers_author ON answers(author_id);

-- Payments
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created ON payments(created_at DESC);

-- =========================
-- FULL-TEXT SEARCH INDEXES
-- =========================
CREATE INDEX idx_books_search
ON books USING GIN (to_tsvector('english', title || ' ' || COALESCE(description, '')));

CREATE INDEX idx_questions_search
ON questions USING GIN (to_tsvector('english', title || ' ' || content));

-- =========================
-- VIEW (ANALYTICS)
-- =========================
CREATE OR REPLACE VIEW daily_sales AS
SELECT
DATE(o.created_at) as sale_date,
COUNT(o.id) as order_count,
SUM(o.total_amount) as total_revenue,
COUNT(DISTINCT o.buyer_id) as unique_buyers
FROM orders o
WHERE o.status = 'completed'
GROUP BY DATE(o.created_at);

-- =========================
-- TRIGGER FUNCTION
-- =========================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = CURRENT_TIMESTAMP;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================
-- TRIGGERS
-- =========================
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_books_updated_at
BEFORE UPDATE ON books
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at
BEFORE UPDATE ON questions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================
-- SAMPLE DATA
-- =========================
INSERT INTO users (email, password_hash, full_name, role, is_verified) VALUES
('[admin@studysmart.com](mailto:admin@studysmart.com)', crypt('admin123', gen_salt('bf')), 'Admin User', 'admin', TRUE),
('[student@studysmart.com](mailto:student@studysmart.com)', crypt('student123', gen_salt('bf')), 'Student User', 'student', TRUE),
('[vendor@studysmart.com](mailto:vendor@studysmart.com)', crypt('vendor123', gen_salt('bf')), 'Vendor User', 'vendor', TRUE)
ON CONFLICT (email) DO NOTHING;
