const db = require('../config/database');
const bcrypt = require('bcrypt');
const logger = require('../utils/logger');

async function seed() {
  try {
    logger.info('Seeding default colleges...');
    await db.query("INSERT INTO colleges (name, domain) VALUES ('College A', 'gmail.com')");
    await db.query("INSERT INTO colleges (name, domain) VALUES ('College B', 'sastra.ac.in')");

    logger.info('Seeding default users...');
    const hashedAdmin = await bcrypt.hash('admin123', 10);
    const hashedTeacher = await bcrypt.hash('123456789', 10);
    const hashedStudent = await bcrypt.hash('student123', 10);

    await db.query(
      `INSERT INTO users (name, email, password, role, college_id) VALUES 
       ('System Admin', 'admin@gmail.com', $1, 'ADMIN', 1),
       ('Mahadev Teacher', 'mahadev1@gmail.com', $2, 'TEACHER', 1),
       ('Alice Student', 'alice@example.com', $3, 'STUDENT', 1)
       ON CONFLICT (email) DO NOTHING`,
      [hashedAdmin, hashedTeacher, hashedStudent]
    );

    logger.info('Seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    logger.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
