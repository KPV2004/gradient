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

-- Seed default users
INSERT INTO users (id, username, email, password_hash, display_name, role) VALUES
('u1', 'admin_master', 'admin@gradient.com', '$2a$10$Z5A3w1VYy0p8p2IbtZnOuuKZ/gheHBnXmuuADSMVMVUbqMDs33wdu', 'Admin Master', 'admin'),
('u4', 'user_student', 'student@gradient.com', '$2a$10$HNyLLbycmPM0bRlXWb1OwuyQN1XsByiGUXNjNsbjWefKeOsk4nbjO', 'User Student', 'student')
ON CONFLICT (id) DO NOTHING;

-- Seed default problems
INSERT INTO problems (id, title, slug, description, input_format, output_format, constraints, difficulty, timeout_ms, memory_limit_mb, score, created_by, is_published) VALUES
('p1', 'Two Sum', 'two-sum', 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.', 'The first line contains an integer N (the size of array) and target.\nThe second line contains N integers separated by space representing the array elements.', 'Print the two indices (0-indexed) separated by space, in ascending order.', '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9', 'easy', 1000, 256, 100, 'u1', true),
('p2', 'Valid Parentheses', 'valid-parentheses', 'Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.', 'A single line containing the string `s`.', 'Print `true` if the string is valid, or `false` otherwise.', '1 <= s.length <= 10^4\ns consists of parentheses characters only.', 'easy', 1000, 256, 100, 'u1', true),
('p3', 'Longest Substring Without Repeating Characters', 'longest-substring-without-repeating', 'Given a string `s`, find the length of the longest substring without repeating characters.\n\nFor example, the longest substring without repeating characters for "abcabcbb" is "abc", which has a length of 3.', 'A single line containing the string `s`. Note that the string may contain spaces.', 'Print a single integer representing the length of the longest substring without repeating characters.', '0 <= s.length <= 5 * 10^4\ns consists of English letters, digits, symbols and spaces.', 'medium', 1500, 256, 200, 'u1', true),
('p4', 'Optimal Path Finder (Dijkstra)', 'optimal-path-finder', 'You are given a weighted directed graph of N nodes (numbered 1 to N) and M edges. Find the shortest path distance from node 1 to node N.\n\nIf node N is unreachable from node 1, output -1.', 'The first line contains N and M (nodes and edges).\nThe next M lines each contain three integers u, v, and w, representing a directed edge from u to v with weight w.', 'Print a single integer representing the shortest path distance, or -1 if unreachable.', '1 <= N <= 10^5\n1 <= M <= 2 * 10^5\n1 <= u, v <= N\n1 <= w <= 10^6', 'hard', 2000, 512, 300, 'u1', false)
ON CONFLICT (id) DO NOTHING;

-- Seed default testcases
INSERT INTO testcases (id, problem_id, order_index, input, expected_output, is_sample, score) VALUES
('t1', 'p1', 1, '4 9
2 7 11 15', '0 1', true, 50),
('t2', 'p1', 2, '3 6
3 2 4', '1 2', true, 50),
('t3', 'p2', 1, '()', 'true', true, 30),
('t4', 'p2', 2, '()[]{}', 'true', true, 35),
('t5', 'p2', 3, '(]', 'false', false, 35),
('t6', 'p3', 1, 'abcabcbb', '3', true, 100),
('t7', 'p3', 2, 'bbbbb', '1', false, 100),
('t8', 'p4', 1, '4 5
1 2 5
1 3 2
3 2 1
2 4 3
3 4 8', '6', true, 150),
('t9', 'p4', 2, '3 1
1 2 10', '-1', false, 150)
ON CONFLICT (id) DO NOTHING;

-- Seed default contests
INSERT INTO contests (id, title, description, start_time, end_time, created_by, is_public) VALUES
('c1', 'Gradient Beta Coding Contest', 'Welcome to the inaugural Gradient platform contest! Solve 3 algorithmic tasks of varying difficulty. Code evaluation is dynamic and sandboxed in our isolated Docker environment.', NOW() - INTERVAL '2 hours', NOW() + INTERVAL '3 hours', 'u1', true),
('c2', 'Advanced Graph Algorithms Cup', 'Focus on shortest paths, spanning trees, and maximum flows. Recommended for advanced competitors.', NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days' + INTERVAL '4 hours', 'u1', true)
ON CONFLICT (id) DO NOTHING;

-- Seed contest problems mapping
INSERT INTO contest_problems (contest_id, problem_id, label, order_index) VALUES
('c1', 'p1', 'A', 1),
('c1', 'p2', 'B', 2),
('c1', 'p3', 'C', 3),
('c2', 'p4', 'A', 1)
ON CONFLICT (contest_id, problem_id) DO NOTHING;
