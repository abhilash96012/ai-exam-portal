const db = require('../config/database');
const logger = require('../utils/logger');

const db = require('../config/database');
const logger = require('../utils/logger');

const getSchema = (isPg) => {
  const PK = isPg ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
  
  return `
    CREATE TABLE IF NOT EXISTS colleges (
      id ${PK},
      name VARCHAR(150) NOT NULL,
      domain VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id ${PK},
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(100) NOT NULL,
      role VARCHAR(20) DEFAULT 'STUDENT',
      register_number VARCHAR(50),
      branch VARCHAR(100),
      year INTEGER,
      section VARCHAR(10),
      college_id INTEGER REFERENCES colleges(id) ON DELETE SET NULL,
      profile_completed BOOLEAN DEFAULT FALSE,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS exams (
      id ${PK},
      title VARCHAR(150) NOT NULL,
      description TEXT,
      syllabus_text TEXT,
      duration INTEGER NOT NULL,
      total_marks INTEGER NOT NULL,
      is_published BOOLEAN DEFAULT FALSE,
      branch VARCHAR(100),
      year INTEGER,
      section VARCHAR(10),
      college_id INTEGER REFERENCES colleges(id) ON DELETE CASCADE,
      created_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS questions (
      id ${PK},
      exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
      question_text TEXT NOT NULL,
      options TEXT,
      correct_option VARCHAR(10),
      model_answer TEXT,
      marks INTEGER DEFAULT 1,
      source_context TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS syllabus_library (
      id ${PK},
      subject VARCHAR(100) NOT NULL,
      department VARCHAR(100),
      year VARCHAR(20),
      extracted_text TEXT,
      status VARCHAR(20) DEFAULT 'UPLOADED',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS exam_attempts (
      id ${PK},
      exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
      student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      status VARCHAR(20) DEFAULT 'STARTED',
      start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      end_time TIMESTAMP,
      score REAL,
      max_score INTEGER,
      feedback TEXT
    );

    CREATE TABLE IF NOT EXISTS answers (
      id ${PK},
      attempt_id INTEGER REFERENCES exam_attempts(id) ON DELETE CASCADE,
      question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
      selected_option VARCHAR(10),
      text_answer TEXT,
      is_correct BOOLEAN,
      score REAL,
      feedback TEXT
    );
  `;
};

async function init() {
  try {
    const isPg = db.isPostgres;
    logger.info(\`Initializing \${isPg ? 'PostgreSQL' : 'SQLite'} database schema...\`);
    await db.exec(getSchema(isPg));
    logger.info('Database tables initialized successfully.');
    process.exit(0);
  } catch (error) {
    logger.error('Database initialization failed:', error);
    process.exit(1);
  }
}

init();
