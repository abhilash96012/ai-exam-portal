require('dotenv').config({ path: './backend/.env' });
const db = require('./backend/config/database');
async function checkTeachers() {
    try {
        const result = await db.query("SELECT email, role, is_active FROM users WHERE role = 'TEACHER'");
        console.log('Registered Teachers:');
        console.log(JSON.stringify(result.rows, null, 2));
        const invites = await db.query("SELECT email, status FROM teacher_invitations");
        console.log('Invitations:');
        console.log(JSON.stringify(invites.rows, null, 2));
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        process.exit();
    }
}
checkTeachers();

