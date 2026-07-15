const db = require('../config/database');

class SyllabusLibrary {
  static async findById(id) {
    const result = await db.query('SELECT * FROM syllabus_library WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async updateById(id, data) {
    const keys = Object.keys(data);
    if (keys.length === 0) return null;

    const setClauses = keys.map((key, index) => `"${key}" = $${index + 2}`).join(', ');
    const values = [id, ...Object.values(data)];

    const result = await db.query(
      `UPDATE syllabus_library SET ${setClauses} WHERE id = $1 RETURNING *`,
      values
    );
    return result.rows[0];
  }
}

module.exports = SyllabusLibrary;
