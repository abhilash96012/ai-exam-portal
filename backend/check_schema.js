require('dotenv').config();
const db = require('./config/database');

async function check() {
  const res1 = await db.query("SELECT sql FROM sqlite_master WHERE name='answers';");
  console.log("answers:", res1.rows);
  const res2 = await db.query("SELECT sql FROM sqlite_master WHERE name='questions';");
  console.log("questions:", res2.rows);

  process.exit(0);
}

check().catch(console.error);
