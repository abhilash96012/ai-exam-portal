const db = require('./backend/config/database');

async function checkUsers() {
  try {
    const res = await db.query('SELECT id, name, email, role FROM users');
    console.log('Users in database:');
    console.table(res.rows);
  } catch (err) {
    console.error('Error checking users:', err.message);
  } finally {
    await db.pool.end();
  }
}

checkUsers();
