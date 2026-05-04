-- =============================================
-- Student Dashboard — Database Initialization
-- =============================================
-- This script runs automatically when the PostgreSQL
-- container starts for the first time (empty PVC).
-- To re-run: delete the PVC and recreate the pod.
-- =============================================

-- Users table (students, teachers, admins)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subjects table
CREATE TABLE IF NOT EXISTS subjects (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    credits INTEGER NOT NULL DEFAULT 3
);

-- Registrations (student <-> subject)
CREATE TABLE IF NOT EXISTS registrations (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, subject_id)
);

-- Grades
CREATE TABLE IF NOT EXISTS grades (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    grade VARCHAR(5) NOT NULL,
    UNIQUE(student_id, subject_id)
);

-- Notes (uploaded by teachers)
CREATE TABLE IF NOT EXISTS notes (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    filepath VARCHAR(500) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assignments (uploaded by students)
CREATE TABLE IF NOT EXISTS assignments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    filepath VARCHAR(500) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- Seed Data
-- =============================================

-- Default admin user (password: admin123)
-- Hash pre-computed with bcrypt, 10 rounds
INSERT INTO users (username, password, name, email, role)
VALUES ('admin', '$2a$10$cSspWV6mX0sm1TZgV5r/2OXVORkOWl6GiLOC/yP1/GzKyg/omkcVG', 'Administrator', 'admin@studdash.local', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Demo teacher (password: password123)
INSERT INTO users (username, password, name, email, role)
VALUES ('teacher1', '$2a$10$rKqRdLnvXAgAniKu/8pkL.jsCzPggYQEWxrxD20A2BcLBAvLtl.Si', 'Prof. Sarah Wilson', 'sarah@university.edu', 'teacher')
ON CONFLICT (username) DO NOTHING;

-- Demo students (password: password123)
INSERT INTO users (username, password, name, email, role)
VALUES
  ('john', '$2a$10$rKqRdLnvXAgAniKu/8pkL.jsCzPggYQEWxrxD20A2BcLBAvLtl.Si', 'John Doe', 'john@university.edu', 'student'),
  ('jane', '$2a$10$rKqRdLnvXAgAniKu/8pkL.jsCzPggYQEWxrxD20A2BcLBAvLtl.Si', 'Jane Smith', 'jane@university.edu', 'student'),
  ('alex', '$2a$10$rKqRdLnvXAgAniKu/8pkL.jsCzPggYQEWxrxD20A2BcLBAvLtl.Si', 'Alex Johnson', 'alex@university.edu', 'student')
ON CONFLICT (username) DO NOTHING;

-- Seed subjects
INSERT INTO subjects (code, name, credits) VALUES
  ('CS101', 'Intro to Computer Science', 3),
  ('CS201', 'Data Structures', 4),
  ('CS301', 'Algorithms', 4),
  ('MATH101', 'Calculus I', 3),
  ('MATH201', 'Linear Algebra', 3),
  ('ENG101', 'English Composition', 2),
  ('PHY101', 'Physics I', 4)
ON CONFLICT (code) DO NOTHING;

-- Seed registrations & grades for John (user id 3, first student)
-- Note: user IDs depend on insertion order: 1=admin, 2=teacher1, 3=john, 4=jane, 5=alex
INSERT INTO registrations (student_id, subject_id) VALUES (3, 1), (3, 2), (3, 4), (3, 6) ON CONFLICT DO NOTHING;
INSERT INTO grades (student_id, subject_id, grade) VALUES (3, 1, 'A'), (3, 2, 'B+'), (3, 4, 'A-'), (3, 6, 'A') ON CONFLICT DO NOTHING;

-- Seed registrations & grades for Jane (user id 4)
INSERT INTO registrations (student_id, subject_id) VALUES (4, 1), (4, 3), (4, 5) ON CONFLICT DO NOTHING;
INSERT INTO grades (student_id, subject_id, grade) VALUES (4, 1, 'B'), (4, 3, 'A-'), (4, 5, 'B+') ON CONFLICT DO NOTHING;
