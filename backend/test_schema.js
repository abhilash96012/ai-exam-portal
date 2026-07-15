const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'data', 'exam_automation.db');
const db = new sqlite3.Database(dbPath);

db.all("PRAGMA table_info(questions)", [], (err, rows) => {
  if (err) {
    console.error(err);
  } else {
    console.log(rows);
  }
  db.close();
});
