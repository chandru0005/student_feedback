const bcrypt = require('bcryptjs');
const { initDatabase, query } = require('./db');

async function seed() {
  console.log('[Seed] Starting database seeding...');
  await initDatabase();

  // Check if users already seeded
  const existingUsers = await query('SELECT count(*) as count FROM users');
  const count = existingUsers.rows && existingUsers.rows[0] ? (existingUsers.rows[0].count || existingUsers.rows[0]['count(*)']) : 0;
  
  if (count > 0) {
    console.log('[Seed] Database already contains data. Skipping default seed.');
    return;
  }

  // 1. Seed System Settings
  const settings = [
    ['allow_anonymous_feedback', 'true', 'Permits students to hide identity from faculty'],
    ['allow_student_edit', 'true', 'Allows students to edit or delete their pending feedback'],
    ['academic_year', '2026-2027', 'Current active academic year'],
    ['categories', 'Teaching,Faculty,Subject,Laboratory,Infrastructure,Library,Hostel,Transport,Internet,Other', 'Configured feedback categories']
  ];
  for (const [k, v, desc] of settings) {
    await query(
      'INSERT OR REPLACE INTO system_settings (setting_key, setting_value, description) VALUES (?, ?, ?)',
      [k, v, desc]
    );
  }

  // 2. Seed Departments
  const departments = [
    ['CSE', 'Computer Science & Engineering'],
    ['ECE', 'Electronics & Communication Engineering'],
    ['MECH', 'Mechanical Engineering'],
    ['IT', 'Information Technology']
  ];
  for (const [code, name] of departments) {
    await query('INSERT INTO departments (code, name) VALUES (?, ?)', [code, name]);
  }

  // Fetch department IDs
  const cseDept = (await query("SELECT id FROM departments WHERE code = 'CSE'")).rows[0].id;
  const eceDept = (await query("SELECT id FROM departments WHERE code = 'ECE'")).rows[0].id;

  // 3. Seed Users (Admin, Faculty, Students)
  const salt = await bcrypt.genSalt(10);
  const adminHash = await bcrypt.hash('AdminPassword123', salt);
  const facultyHash = await bcrypt.hash('FacultyPass123', salt);
  const studentHash = await bcrypt.hash('StudentPass123', salt);

  // Admin
  await query(
    'INSERT INTO users (name, email, register_number, password_hash, role, department_id, year) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ['System Administrator', 'admin@college.edu', 'ADM001', adminHash, 'admin', cseDept, 0]
  );

  // Faculty
  const fac1Res = await query(
    'INSERT INTO users (name, email, register_number, password_hash, role, department_id, year) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ['Dr. Sarah Sharma', 'sarah.sharma@college.edu', 'FAC001', facultyHash, 'faculty', cseDept, 0]
  );
  const fac1Id = fac1Res.insertId;

  const fac2Res = await query(
    'INSERT INTO users (name, email, register_number, password_hash, role, department_id, year) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ['Prof. Rajesh Patel', 'rajesh.patel@college.edu', 'FAC002', facultyHash, 'faculty', cseDept, 0]
  );
  const fac2Id = fac2Res.insertId;

  const fac3Res = await query(
    'INSERT INTO users (name, email, register_number, password_hash, role, department_id, year) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ['Dr. Anita Verma', 'anita.verma@college.edu', 'FAC003', facultyHash, 'faculty', eceDept, 0]
  );
  const fac3Id = fac3Res.insertId;

  // Students
  const stu1Res = await query(
    'INSERT INTO users (name, email, register_number, password_hash, role, department_id, year) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ['Alex Johnson', 'alex.johnson@student.college.edu', 'REG2023001', studentHash, 'student', cseDept, 3]
  );
  const stu1Id = stu1Res.insertId;

  const stu2Res = await query(
    'INSERT INTO users (name, email, register_number, password_hash, role, department_id, year) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ['Priya Nair', 'priya.nair@student.college.edu', 'REG2023002', studentHash, 'student', cseDept, 3]
  );
  const stu2Id = stu2Res.insertId;

  const stu3Res = await query(
    'INSERT INTO users (name, email, register_number, password_hash, role, department_id, year) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ['Rahul Mehta', 'rahul.mehta@student.college.edu', 'REG2024010', studentHash, 'student', eceDept, 2]
  );
  const stu3Id = stu3Res.insertId;

  // 4. Seed Subjects
  const sub1Res = await query(
    'INSERT INTO subjects (code, name, department_id, semester) VALUES (?, ?, ?, ?)',
    ['CS501', 'Data Structures and Algorithms', cseDept, 5]
  );
  const sub1Id = sub1Res.insertId;

  const sub2Res = await query(
    'INSERT INTO subjects (code, name, department_id, semester) VALUES (?, ?, ?, ?)',
    ['CS502', 'Database Management Systems', cseDept, 5]
  );
  const sub2Id = sub2Res.insertId;

  const sub3Res = await query(
    'INSERT INTO subjects (code, name, department_id, semester) VALUES (?, ?, ?, ?)',
    ['CS503', 'Web Development & Cloud Computing', cseDept, 5]
  );
  const sub3Id = sub3Res.insertId;

  const sub4Res = await query(
    'INSERT INTO subjects (code, name, department_id, semester) VALUES (?, ?, ?, ?)',
    ['EC401', 'Digital Signal Processing', eceDept, 4]
  );
  const sub4Id = sub4Res.insertId;

  // 5. Faculty Subject Assignments
  await query('INSERT INTO faculty_subjects (faculty_id, subject_id, academic_year) VALUES (?, ?, ?)', [fac1Id, sub1Id, '2026-2027']);
  await query('INSERT INTO faculty_subjects (faculty_id, subject_id, academic_year) VALUES (?, ?, ?)', [fac1Id, sub3Id, '2026-2027']);
  await query('INSERT INTO faculty_subjects (faculty_id, subject_id, academic_year) VALUES (?, ?, ?)', [fac2Id, sub2Id, '2026-2027']);
  await query('INSERT INTO faculty_subjects (faculty_id, subject_id, academic_year) VALUES (?, ?, ?)', [fac3Id, sub4Id, '2026-2027']);

  // 6. Seed Sample Feedback with Multi-Criteria Ratings and NLP Sentiments
  const sampleFeedbacks = [
    {
      student_id: stu1Id,
      faculty_id: fac1Id,
      subject_id: sub1Id,
      department_id: cseDept,
      semester: 5,
      category: 'Teaching',
      text: 'Dr. Sarah Sharma is exceptional at explaining complex algorithmic problems. She is very patient during doubts and encourages classroom interaction. Best professor in this semester!',
      is_anon: 0,
      status: 'submitted',
      ratings: { tq: 5, sk: 5, com: 5, dc: 5, ci: 5, punc: 5, avg: 5.0 },
      sentiment: {
        label: 'Positive',
        score: 0.952,
        conf: 0.965,
        subj: 0.85,
        keywords: ['explaining', 'algorithmic', 'patient', 'doubts', 'encourages', 'interaction'],
        topics: ['Teaching & Delivery', 'Doubt & Interaction'],
        pos: ['Dr. Sarah Sharma is exceptional at explaining complex algorithmic problems', 'Best professor in this semester'],
        neg: [],
        sug: []
      }
    },
    {
      student_id: stu2Id,
      faculty_id: fac1Id,
      subject_id: sub3Id,
      department_id: cseDept,
      semester: 5,
      category: 'Subject',
      text: 'Good course content overall. The lectures are clear and informative, but we need more hands-on lab sessions for cloud deployment. It would be better if recorded slides were provided.',
      is_anon: 1,
      status: 'reviewed',
      ratings: { tq: 4, sk: 4, com: 4, dc: 3, ci: 4, punc: 4, avg: 3.83 },
      sentiment: {
        label: 'Positive',
        score: 0.420,
        conf: 0.760,
        subj: 0.60,
        keywords: ['content', 'lectures', 'informative', 'cloud', 'deployment', 'slides'],
        topics: ['Teaching & Delivery', 'Laboratory & Practical'],
        pos: ['The lectures are clear and informative'],
        neg: [],
        sug: ['We need more hands-on lab sessions for cloud deployment', 'It would be better if recorded slides were provided']
      }
    },
    {
      student_id: stu1Id,
      faculty_id: fac2Id,
      subject_id: sub2Id,
      department_id: cseDept,
      semester: 5,
      category: 'Faculty',
      text: 'Lectures follow the textbook closely. Sometimes the pace feels rushed and doubts are not resolved in class. Needs more interactive discussions.',
      is_anon: 1,
      status: 'submitted',
      ratings: { tq: 2, sk: 4, com: 2, dc: 2, ci: 2, punc: 4, avg: 2.67 },
      sentiment: {
        label: 'Negative',
        score: -0.485,
        conf: 0.785,
        subj: 0.70,
        keywords: ['textbook', 'rushed', 'doubts', 'resolved', 'interactive'],
        topics: ['Teaching & Delivery', 'Doubt & Interaction'],
        pos: [],
        neg: ['Sometimes the pace feels rushed and doubts are not resolved in class'],
        sug: ['Needs more interactive discussions']
      }
    },
    {
      student_id: stu3Id,
      faculty_id: fac3Id,
      subject_id: sub4Id,
      department_id: eceDept,
      semester: 4,
      category: 'Teaching',
      text: 'Dr. Anita Verma has thorough subject knowledge and is always punctual. Her problem-solving approach in DSP is very helpful for university examinations.',
      is_anon: 0,
      status: 'submitted',
      ratings: { tq: 5, sk: 5, com: 4, dc: 4, ci: 4, punc: 5, avg: 4.5 },
      sentiment: {
        label: 'Positive',
        score: 0.880,
        conf: 0.935,
        subj: 0.75,
        keywords: ['thorough', 'knowledge', 'punctual', 'helpful', 'examinations'],
        topics: ['Teaching & Delivery', 'Faculty Behavior'],
        pos: ['Dr. Anita Verma has thorough subject knowledge and is always punctual', 'Her problem-solving approach in DSP is very helpful'],
        neg: [],
        sug: []
      }
    },
    {
      student_id: stu2Id,
      faculty_id: null,
      subject_id: null,
      department_id: cseDept,
      semester: 5,
      category: 'Laboratory',
      text: 'The computer lab systems in block B are frequently crashing. Internet connection is very slow during practical exams and chairs are broken.',
      is_anon: 1,
      status: 'flagged',
      ratings: { tq: 1, sk: 1, com: 1, dc: 1, ci: 1, punc: 1, avg: 1.0 },
      sentiment: {
        label: 'Negative',
        score: -0.915,
        conf: 0.950,
        subj: 0.85,
        keywords: ['computer', 'systems', 'crashing', 'internet', 'broken'],
        topics: ['Laboratory & Practical', 'Infrastructure & Facilities'],
        pos: [],
        neg: ['The computer lab systems in block B are frequently crashing', 'Internet connection is very slow during practical exams and chairs are broken'],
        sug: []
      }
    }
  ];

  for (const fb of sampleFeedbacks) {
    const res = await query(
      `INSERT INTO feedback (student_id, faculty_id, subject_id, department_id, academic_year, semester, feedback_category, written_feedback, is_anonymous, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [fb.student_id, fb.faculty_id, fb.subject_id, fb.department_id, '2026-2027', fb.semester, fb.category, fb.text, fb.is_anon, fb.status]
    );
    const fbId = res.insertId;

    await query(
      `INSERT INTO feedback_ratings (feedback_id, teaching_quality, subject_knowledge, communication, doubt_clarification, classroom_interaction, punctuality, average_rating)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [fbId, fb.ratings.tq, fb.ratings.sk, fb.ratings.com, fb.ratings.dc, fb.ratings.ci, fb.ratings.punc, fb.ratings.avg]
    );

    await query(
      `INSERT INTO feedback_sentiment (feedback_id, sentiment, sentiment_score, confidence_score, subjectivity_score, keywords, detected_topics, positive_aspects, negative_aspects, suggestions)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        fbId,
        fb.sentiment.label,
        fb.sentiment.score,
        fb.sentiment.conf,
        fb.sentiment.subj,
        JSON.stringify(fb.sentiment.keywords),
        JSON.stringify(fb.sentiment.topics),
        JSON.stringify(fb.sentiment.pos),
        JSON.stringify(fb.sentiment.neg),
        JSON.stringify(fb.sentiment.sug)
      ]
    );
  }

  console.log('[Seed] Database seeding completed successfully!');
  console.log('--- DEMO CREDENTIALS ---');
  console.log('Admin:   admin@college.edu / AdminPassword123');
  console.log('Faculty: sarah.sharma@college.edu / FacultyPass123');
  console.log('Student: alex.johnson@student.college.edu / StudentPass123');
}

if (require.main === module) {
  seed().then(() => process.exit(0)).catch(err => {
    console.error('[Seed Error]', err);
    process.exit(1);
  });
}

module.exports = { seed };
