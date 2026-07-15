const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('Configured user:', process.env.SMTP_USER);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

transporter.sendMail({
  from: process.env.SMTP_FROM,
  to: 'jayaabhilash9601@gmail.com',
  subject: 'Test Email from Exam Platform',
  text: 'Hello, this is a test email to verify SMTP delivery works.',
}).then(info => {
  console.log('SUCCESS! Email sent:', info.response);
  process.exit(0);
}).catch(err => {
  console.error('ERROR! Failed to send email:', err);
  process.exit(1);
});
