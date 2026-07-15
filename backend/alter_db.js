const db = require('./config/database');

async function alterTable() {
  try {
    await db.exec("ALTER TABLE questions ADD COLUMN question_type VARCHAR(20) DEFAULT 'MCQ'");
    console.log("Column question_type added successfully.");
  } catch (err) {
    if (err.message.includes("duplicate column name")) {
      console.log("Column already exists.");
    } else {
      console.error(err);
    }
  }
  process.exit(0);
}

alterTable();
