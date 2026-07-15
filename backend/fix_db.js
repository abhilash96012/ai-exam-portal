require('dotenv').config();
const db = require('./config/database');

async function fix() {
  console.log("Cleaning duplicate attempts...");
  // Find all SUBMITTED attempts
  const res = await db.query("SELECT * FROM exam_attempts WHERE status = 'SUBMITTED'");
  
  for (const row of res.rows) {
    // Delete any STARTED attempts for the same exam_id and student_id
    await db.query(
      "DELETE FROM exam_attempts WHERE exam_id = ? AND student_id = ? AND status = 'STARTED'",
      [row.exam_id, row.student_id]
    );
  }
  
  // For any remaining duplicates (multiple STARTED), keep only one.
  const allRows = await db.query("SELECT * FROM exam_attempts");
  const seen = new Set();
  for (const row of allRows.rows) {
    const key = `${row.exam_id}-${row.student_id}`;
    if (seen.has(key)) {
      await db.query("DELETE FROM exam_attempts WHERE id = ?", [row.id]);
    } else {
      seen.add(key);
    }
  }

  // Add a unique constraint if possible, but SQLite doesn't easily support ADD CONSTRAINT on existing tables.
  // Instead, the application layer fix in attempt.controller.js will handle it safely.

  console.log("Database cleaned.");
  process.exit(0);
}

fix().catch(console.error);
