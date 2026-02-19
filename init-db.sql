-- Create enums
CREATE TYPE role AS ENUM ('HR_ADMIN', 'FINANCE_ADMIN', 'SUPER_ADMIN');

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role role NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert admin users (password is 'admin123' hashed with bcrypt)
INSERT INTO users (username, password, role) VALUES 
  ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'SUPER_ADMIN'),
  ('hr_admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'HR_ADMIN'),
  ('finance_admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'FINANCE_ADMIN')
ON CONFLICT (username) DO NOTHING;

SELECT 'Database initialized successfully!' as status;
