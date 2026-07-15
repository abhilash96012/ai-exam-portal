const db = require('./config/database');
const bcrypt = require('bcrypt');

async function reset() {
  const h = await bcrypt.hash('password123', 10);
  await db.query("UPDATE users SET password=$1 WHERE email='mahadev@gmail.com'", [h]);
  console.log('Password reset to password123 for mahadev@gmail.com');
}

reset();
