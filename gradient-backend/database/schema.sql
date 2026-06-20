-- schema.sql
-- Database Schema for Gradient Platform

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2. Problems Table
CREATE TABLE IF NOT EXISTS problems (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    input_format TEXT,
    output_format TEXT,
    constraints TEXT,
    difficulty VARCHAR(50) NOT NULL,
    timeout_ms BIGINT NOT NULL,
    memory_limit_mb BIGINT NOT NULL,
    score INT NOT NULL,
    created_by VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 3. Testcases Table
CREATE TABLE IF NOT EXISTS testcases (
    id VARCHAR(36) PRIMARY KEY,
    problem_id VARCHAR(36) REFERENCES problems(id) ON DELETE CASCADE,
    order_index INT NOT NULL,
    input TEXT NOT NULL,
    expected_output TEXT NOT NULL,
    is_sample BOOLEAN DEFAULT FALSE,
    score INT NOT NULL
);

-- 4. Contests Table
CREATE TABLE IF NOT EXISTS contests (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    created_by VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 5. Contest Problems (Many-to-Many mapping)
CREATE TABLE IF NOT EXISTS contest_problems (
    contest_id VARCHAR(36) REFERENCES contests(id) ON DELETE CASCADE,
    problem_id VARCHAR(36) REFERENCES problems(id) ON DELETE CASCADE,
    label VARCHAR(10) NOT NULL,
    order_index INT NOT NULL,
    PRIMARY KEY (contest_id, problem_id)
);

-- 6. Contest Participants (Many-to-Many mapping)
CREATE TABLE IF NOT EXISTS contest_participants (
    contest_id VARCHAR(36) REFERENCES contests(id) ON DELETE CASCADE,
    user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (contest_id, user_id)
);

-- 7. Submissions Table
CREATE TABLE IF NOT EXISTS submissions (
    id VARCHAR(36) PRIMARY KEY,
    problem_id VARCHAR(36) REFERENCES problems(id) ON DELETE CASCADE,
    user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
    language VARCHAR(50) NOT NULL,
    source_code TEXT NOT NULL,
    status VARCHAR(50) NOT NULL,
    score INT NOT NULL DEFAULT 0,
    time_used_ms BIGINT NOT NULL DEFAULT 0,
    memory_used_kb BIGINT NOT NULL DEFAULT 0,
    stdout TEXT,
    stderr TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
