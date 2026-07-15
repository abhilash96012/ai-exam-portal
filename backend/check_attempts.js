require('dotenv').config();
const db = require('./config/database');

async function check() {
  const res = await db.query('SELECT * FROM exam_attempts;');
  console.log(JSON.stringify(res.rows, null, 2));
  process.exit(0);
}

check().catch(console.error);
