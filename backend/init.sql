-- Create tables
CREATE TABLE IF NOT EXISTS organization (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    parent_id INTEGER REFERENCES organization(id)
);

CREATE TABLE IF NOT EXISTS major (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    organization_id INTEGER REFERENCES organization(id),
    tuition_fee NUMERIC(10, 2) NOT NULL,
    description TEXT,
    duration_years INTEGER DEFAULT 4
);

CREATE TABLE IF NOT EXISTS sys_user (
    id SERIAL PRIMARY KEY,
    username VARCHAR UNIQUE NOT NULL,
    hashed_password VARCHAR NOT NULL,
    full_name VARCHAR,
    email VARCHAR UNIQUE,
    role VARCHAR NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    avatar VARCHAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial data
INSERT INTO organization (name) VALUES ('Smart Tech University') ON CONFLICT DO NOTHING;

INSERT INTO major (name, description, tuition_fee, organization_id) VALUES
('计算机科学与技术', '深入学习算法与系统', 5200, 1),
('人工智能', '机器学习与深度学习', 6800, 1),
('软件工程', '企业级软件开发', 5500, 1)
ON CONFLICT DO NOTHING;

-- Insert admin user (password: admin123, hashed with bcrypt)
INSERT INTO sys_user (username, hashed_password, full_name, role, email) VALUES
('admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIpbVW.o4m', 'System Admin', 'admin', 'admin@example.com')
ON CONFLICT (username) DO NOTHING;

