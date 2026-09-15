# EduPulse: Student Feedback Sentiment Analysis Website

A complete, modern, responsive Student Feedback Sentiment Analysis system for colleges and universities. The application enables students to submit multi-criteria evaluations (with optional anonymous submission), processes textual comments with an AI NLP Sentiment Microservice to classify polarity (Positive, Neutral, Negative), and provides dedicated dashboards for **Students**, **Faculty**, and **Administrators**.

---

## 🚀 Key Features

### 🎓 1. Student Portal
- **Authentication**: Registration with college email, register number, department, and academic year.
- **Feedback Submission Form**:
  - Academic metadata (Department, Year, Semester, Course Subject, Faculty Instructor).
  - Multi-Criteria 1-5 ⭐ Star Ratings:
    - Teaching Quality
    - Subject Knowledge
    - Communication
    - Doubt Clarification
    - Classroom Interaction
    - Punctuality
  - Detailed written comments with dynamic character counter.
  - Category classification (Teaching, Faculty, Subject, Laboratory, Infrastructure, Library, Hostel, Transport, Internet, Other).
  - **Anonymous Submission Toggle**: Allows students to submit evaluations without exposing their name or registration number to faculty.
- **Feedback History & Status**: Real-time evaluation status tracking (`submitted`, `reviewed`, `flagged`), sentiment badges with confidence scores, and edit/delete permissions based on institutional policy.

### 👨‍🏫 2. Faculty Dashboard
- **Subject-Specific Analytics**: Real-time feedback analytics for assigned courses.
- **Interactive Visualizations (Recharts)**:
  - Donut chart of Sentiment Distribution (% Positive, % Neutral, % Negative).
  - Bar chart of Average Ratings per evaluation criteria.
- **NLP Insights Engine**:
  - 🌟 Top Positive Highlights
  - ⚠️ Frequent Points of Friction / Complaints
  - 💡 Constructive Improvement Suggestions
- **Privacy Protection**: Anonymized feedback strictly masks student name as `"Anonymous Student"` and completely redacts register numbers and emails.
- **Multi-parameter Filtering**: Filter submissions by subject, sentiment, star ratings, and date ranges.

### 🛡️ 3. Administrator Control Center
- **Institutional KPI Telemetry**: Total enrolled students, teaching faculty, departments, courses, feedback volume, and flagged submissions.
- **Campus Sentiment Pulse**: High-level comparative sentiment distribution across all departments.
- **User Management**: Search, filter, toggle active/inactive status, and create faculty accounts.
- **Academic Hierarchy**: Configure departments, subjects, and assign faculty to courses.
- **Feedback Moderation**: Audit queue to inspect all submissions (with author accountability), mark as reviewed, or flag problematic submissions.
- **Institutional Governance**:
  - Global toggle for anonymous feedback.
  - Global toggle for student feedback edit/withdraw permissions.
  - Category taxonomy manager.
- **Audit Reports & Data Export**: One-click export to CSV (Excel formatted) and JSON.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, React Router DOM, Axios, Recharts, Lucide React, Canvas Confetti |
| **Backend** | Node.js (v24), Express.js, JWT Authentication, bcryptjs, REST API |
| **Database** | Relational MySQL schema with Foreign Keys, Indexes, and Constraints (`database/schema.sql`) + Dual-Engine persistence (with automated local SQLite fallback) |
| **NLP Service** | Python 3.11, FastAPI, Uvicorn, Lexicon & Topic Modeling Engine |

---

## 📋 Default Demo Accounts

Use these pre-seeded accounts to explore each role instantly (or click the quick-login buttons on the login page):

| Role | Email | Password | Privileges |
|---|---|---|---|
| **Admin** | `admin@college.edu` | `AdminPassword123` | Full Institutional Control, Moderation, Settings, Reports |
| **Faculty** | `sarah.sharma@college.edu` | `FacultyPass123` | Department CSE, Subjects CS501 & CS503, Privacy-protected reviews |
| **Student** | `alex.johnson@student.college.edu` | `StudentPass123` | CSE Year 3, Feedback Submission & History Tracking |

---

## ⚡ Quick Start (Windows)

### Option A: One-Click Startup
Double-click:
```bat
scripts\start-all.bat
```
This automatically launches the Python NLP Service (port 8000), Node.js Backend (port 5000), React Frontend (port 5173), and opens `http://localhost:5173` in your browser.

---

### Option B: Manual Startup

#### 1. Start Python NLP Microservice (Port 8000)
```powershell
cd nlp-service
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

#### 2. Start Node.js Express Backend (Port 5000)
```powershell
cd backend
node server.js
```

#### 3. Start React Frontend (Port 5173)
```powershell
cd frontend
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

---

## 🗄️ MySQL Database Setup (Optional)

By default, the backend automatically uses the embedded SQLite database (`backend/database/feedback.db`) with identical schema, allowing immediate out-of-the-box operation without requiring MySQL to be running.

To use MySQL Server:
1. Ensure your local MySQL server is running on port `3306`.
2. Import the schema script:
   ```powershell
   mysql -u root -p < backend/database/schema.sql
   ```
3. Update `backend/.env` with your MySQL credentials:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=student_feedback_db
   ```
4. Restart the backend server.
