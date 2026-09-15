const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');
let mysql = null;
try {
  mysql = require('mysql2/promise');
} catch (e) {
  // mysql2 optional if not installed
}

let dbMode = 'sqlite'; // 'mysql' or 'sqlite'
let mysqlPool = null;
let sqliteDb = null;
const sqliteFilePath = path.join(__dirname, 'feedback.db');

// Helper to save sqlite database to disk
function saveSqliteDb() {
  if (sqliteDb) {
    try {
      const data = sqliteDb.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(sqliteFilePath, buffer);
    } catch (err) {
      console.error('[DB] Error persisting SQLite file:', err.message);
    }
  }
}

// Initialize SQLite database
async function initSqlite() {
  const SQL = await initSqlJs();
  if (fs.existsSync(sqliteFilePath)) {
    try {
      const fileBuffer = fs.readFileSync(sqliteFilePath);
      sqliteDb = new SQL.Database(fileBuffer);
    } catch (e) {
      console.warn('[DB] Corrupt SQLite file, recreating:', e.message);
      sqliteDb = new SQL.Database();
    }
  } else {
    sqliteDb = new SQL.Database();
  }

  // Create tables in SQLite
  sqliteDb.run(`
    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      register_number TEXT UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student',
      department_id INTEGER,
      year INTEGER DEFAULT 1,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (department_id) REFERENCES departments(id)
    );

    CREATE TABLE IF NOT EXISTS subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      department_id INTEGER NOT NULL,
      semester INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (department_id) REFERENCES departments(id)
    );

    CREATE TABLE IF NOT EXISTS faculty_subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      faculty_id INTEGER NOT NULL,
      subject_id INTEGER NOT NULL,
      academic_year TEXT NOT NULL DEFAULT '2026-2027',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (faculty_id) REFERENCES users(id),
      FOREIGN KEY (subject_id) REFERENCES subjects(id),
      UNIQUE (faculty_id, subject_id, academic_year)
    );

    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER,
      faculty_id INTEGER,
      subject_id INTEGER,
      department_id INTEGER NOT NULL,
      academic_year TEXT NOT NULL DEFAULT '2026-2027',
      semester INTEGER NOT NULL DEFAULT 1,
      feedback_category TEXT NOT NULL DEFAULT 'Teaching',
      written_feedback TEXT NOT NULL,
      is_anonymous INTEGER DEFAULT 0,
      status TEXT DEFAULT 'submitted',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES users(id),
      FOREIGN KEY (faculty_id) REFERENCES users(id),
      FOREIGN KEY (subject_id) REFERENCES subjects(id),
      FOREIGN KEY (department_id) REFERENCES departments(id)
    );

    CREATE TABLE IF NOT EXISTS feedback_ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      feedback_id INTEGER NOT NULL UNIQUE,
      teaching_quality INTEGER NOT NULL,
      subject_knowledge INTEGER NOT NULL,
      communication INTEGER NOT NULL,
      doubt_clarification INTEGER NOT NULL,
      classroom_interaction INTEGER NOT NULL,
      punctuality INTEGER NOT NULL,
      average_rating REAL NOT NULL,
      FOREIGN KEY (feedback_id) REFERENCES feedback(id)
    );

    CREATE TABLE IF NOT EXISTS feedback_sentiment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      feedback_id INTEGER NOT NULL UNIQUE,
      sentiment TEXT NOT NULL,
      sentiment_score REAL NOT NULL,
      confidence_score REAL NOT NULL,
      subjectivity_score REAL NOT NULL,
      keywords TEXT,
      detected_topics TEXT,
      positive_aspects TEXT,
      negative_aspects TEXT,
      suggestions TEXT,
      analyzed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (feedback_id) REFERENCES feedback(id)
    );

    CREATE TABLE IF NOT EXISTS system_settings (
      setting_key TEXT PRIMARY KEY,
      setting_value TEXT NOT NULL,
      description TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  saveSqliteDb();
}

// Connect database
async function initDatabase() {
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'student_feedback_db';
  const port = parseInt(process.env.DB_PORT || '3306', 10);

  if (process.env.USE_SQLITE !== 'true' && mysql) {
    try {
      const tempConn = await mysql.createConnection({ host, user, password, port });
      await tempConn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
      await tempConn.end();

      mysqlPool = mysql.createPool({
        host,
        user,
        password,
        database,
        port,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });

      // Test connection
      await mysqlPool.query('SELECT 1');
      dbMode = 'mysql';
      console.log(`[Database] Successfully connected to MySQL server on ${host}:${port}/${database}`);
      return;
    } catch (err) {
      console.log(`[Database] MySQL server not reachable (${err.code || err.message}). Gracefully using local SQLite storage.`);
    }
  }

  // Fallback to SQLite
  dbMode = 'sqlite';
  await initSqlite();
  console.log('[Database] Running with high-performance SQLite engine (feedback.db)');
}

// Universal query runner supporting both MySQL and SQLite
async function query(sql, params = []) {
  if (dbMode === 'mysql' && mysqlPool) {
    const [rows, fields] = await mysqlPool.execute(sql, params);
    return {
      rows: Array.isArray(rows) ? rows : [],
      insertId: rows.insertId,
      affectedRows: rows.affectedRows
    };
  }

  // SQLite execution
  if (!sqliteDb) {
    await initSqlite();
  }

  const trimmed = sql.trim();
  const isSelect = /^SELECT/i.test(trimmed);

  try {
    if (isSelect) {
      const stmt = sqliteDb.prepare(sql);
      stmt.bind(params);
      const rows = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();
      return { rows, insertId: null, affectedRows: rows.length };
    } else {
      sqliteDb.run(sql, params);
      let insertId = null;
      if (/^INSERT/i.test(trimmed)) {
        const idRes = sqliteDb.exec("SELECT last_insert_rowid() AS id");
        if (idRes.length > 0 && idRes[0].values.length > 0) {
          insertId = idRes[0].values[0][0];
        }
      }
      const changesRes = sqliteDb.exec("SELECT changes() AS affected");
      const affectedRows = changesRes.length > 0 ? changesRes[0].values[0][0] : 1;
      saveSqliteDb();
      return { rows: [], insertId, affectedRows };
    }
  } catch (err) {
    console.error(`[DB Error in query: ${sql}]`, err.message);
    throw err;
  }
}

module.exports = {
  initDatabase,
  query,
  getMode: () => dbMode
};
