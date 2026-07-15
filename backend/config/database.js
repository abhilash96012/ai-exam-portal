const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const isPostgres = !!process.env.DATABASE_URL;

let db;
let pool;

if (isPostgres) {
  // PostgreSQL Configuration (Neon / Render)
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
} else {
  // SQLite Fallback (Local Development)
  const sqlite3 = require('sqlite3').verbose();
  const dbDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  const dbPath = path.join(dbDir, 'exam_automation.db');
  db = new sqlite3.Database(dbPath);
}

const query = async (text, params = []) => {
  if (isPostgres) {
    try {
      const result = await pool.query(text, params);
      return { rows: result.rows, lastID: null, changes: result.rowCount };
    } catch (err) {
      throw err;
    }
  } else {
    // SQLite query handling
    // Convert pg-style placeholders ($1, $2) to sqlite-style placeholders (?, ?)
    let sqliteText = text;
    let paramIndex = 1;
    while (sqliteText.includes(`$${paramIndex}`)) {
      sqliteText = sqliteText.replace(`$${paramIndex}`, '?');
      paramIndex++;
    }

    return new Promise((resolve, reject) => {
      const isSelect = sqliteText.trim().toUpperCase().startsWith('SELECT');
      const isReturning = sqliteText.toUpperCase().includes('RETURNING');

      if (isSelect || isReturning) {
        db.all(sqliteText, params, (err, rows) => {
          if (err) return reject(err);
          resolve({ rows: rows || [] });
        });
      } else {
        db.run(sqliteText, params, function (err) {
          if (err) return reject(err);
          resolve({ rows: [], lastID: this.lastID, changes: this.changes });
        });
      }
    });
  }
};

const exec = async (text) => {
  if (isPostgres) {
    return pool.query(text);
  } else {
    return new Promise((resolve, reject) => {
      db.exec(text, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }
};

module.exports = {
  query,
  exec,
  isPostgres,
  pool: {
    end: () => {
      if (isPostgres) return pool.end();
      return new Promise((resolve) => db.close(resolve));
    },
  },
};
