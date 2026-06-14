const { Pool } = require('pg');
require('dotenv').config({ path: './backend/.env' });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'exam_automation',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function checkUsers() {
  try {
    const res = await pool.query('SELECT id, name, email, role FROM users');
    console.log('Users in database:');
    console.table(res.rows);
  } catch (err) {
    console.error('Error checking users:', err.message);
  } finally {
    await pool.end();
  }
}

checkUsers();
