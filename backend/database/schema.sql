-- ==========================================================
-- Student Feedback Sentiment Analysis Database Schema (MySQL)
-- ==========================================================

CREATE DATABASE IF NOT EXISTS student_feedback_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE student_feedback_db;

-- 1. Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Users Table (Students, Faculty, Admins)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    register_number VARCHAR(50) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('student', 'faculty', 'admin') NOT NULL DEFAULT 'student',
    department_id INT NULL,
    year INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    INDEX idx_user_role (role),
    INDEX idx_user_email (email),
    INDEX idx_user_reg (register_number),
    INDEX idx_user_dept (department_id)
) ENGINE=InnoDB;

-- 3. Subjects Table
CREATE TABLE IF NOT EXISTS subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    department_id INT NOT NULL,
    semester INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    INDEX idx_subject_dept (department_id),
    INDEX idx_subject_code (code)
) ENGINE=InnoDB;

-- 4. Faculty Subjects Assignment Table
CREATE TABLE IF NOT EXISTS faculty_subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    faculty_id INT NOT NULL,
    subject_id INT NOT NULL,
    academic_year VARCHAR(20) NOT NULL DEFAULT '2026-2027',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    UNIQUE KEY unique_faculty_subject_year (faculty_id, subject_id, academic_year),
    INDEX idx_fs_faculty (faculty_id),
    INDEX idx_fs_subject (subject_id)
) ENGINE=InnoDB;

-- 5. Feedback Submissions Table
CREATE TABLE IF NOT EXISTS feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NULL,
    faculty_id INT NULL,
    subject_id INT NULL,
    department_id INT NOT NULL,
    academic_year VARCHAR(20) NOT NULL DEFAULT '2026-2027',
    semester INT NOT NULL DEFAULT 1,
    feedback_category VARCHAR(60) NOT NULL DEFAULT 'Teaching',
    written_feedback TEXT NOT NULL,
    is_anonymous BOOLEAN DEFAULT FALSE,
    status ENUM('submitted', 'reviewed', 'flagged') DEFAULT 'submitted',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    INDEX idx_feedback_student (student_id),
    INDEX idx_feedback_faculty (faculty_id),
    INDEX idx_feedback_subject (subject_id),
    INDEX idx_feedback_category (feedback_category),
    INDEX idx_feedback_status (status),
    INDEX idx_feedback_created (created_at)
) ENGINE=InnoDB;

-- 6. Feedback Ratings Table (Multi-criteria 1 to 5 stars)
CREATE TABLE IF NOT EXISTS feedback_ratings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    feedback_id INT NOT NULL UNIQUE,
    teaching_quality INT NOT NULL CHECK (teaching_quality BETWEEN 1 AND 5),
    subject_knowledge INT NOT NULL CHECK (subject_knowledge BETWEEN 1 AND 5),
    communication INT NOT NULL CHECK (communication BETWEEN 1 AND 5),
    doubt_clarification INT NOT NULL CHECK (doubt_clarification BETWEEN 1 AND 5),
    classroom_interaction INT NOT NULL CHECK (classroom_interaction BETWEEN 1 AND 5),
    punctuality INT NOT NULL CHECK (punctuality BETWEEN 1 AND 5),
    average_rating DECIMAL(3,2) NOT NULL,
    FOREIGN KEY (feedback_id) REFERENCES feedback(id) ON DELETE CASCADE,
    INDEX idx_rating_feedback (feedback_id),
    INDEX idx_avg_rating (average_rating)
) ENGINE=InnoDB;

-- 7. Feedback Sentiment & NLP Analysis Table
CREATE TABLE IF NOT EXISTS feedback_sentiment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    feedback_id INT NOT NULL UNIQUE,
    sentiment ENUM('Positive', 'Neutral', 'Negative') NOT NULL,
    sentiment_score DECIMAL(5,3) NOT NULL,
    confidence_score DECIMAL(5,3) NOT NULL,
    subjectivity_score DECIMAL(5,3) NOT NULL,
    keywords JSON NULL,
    detected_topics JSON NULL,
    positive_aspects JSON NULL,
    negative_aspects JSON NULL,
    suggestions JSON NULL,
    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (feedback_id) REFERENCES feedback(id) ON DELETE CASCADE,
    INDEX idx_sentiment_type (sentiment),
    INDEX idx_sentiment_score (sentiment_score)
) ENGINE=InnoDB;

-- 8. System Settings Table
CREATE TABLE IF NOT EXISTS system_settings (
    setting_key VARCHAR(60) PRIMARY KEY,
    setting_value VARCHAR(255) NOT NULL,
    description VARCHAR(255) NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
