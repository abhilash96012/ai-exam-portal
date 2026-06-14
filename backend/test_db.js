const db = require('./config/database');

async function testConnection() {
  try {
    const res = await db.query('SELECT current_database(), current_user');
    console.log('Database Connected Successfully!');
    console.log('Result:', res.rows[0]);
  } catch (err) {
    console.error('Database Connection Error:', err.message);
  } finally {
    await db.pool.end();
  }
}

testConnection();
