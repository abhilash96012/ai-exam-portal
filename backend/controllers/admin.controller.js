const db = require('../config/database');
const { sendSuccess } = require('../utils/response');
const ApiError = require('../utils/ApiError');
const bcrypt = require('bcrypt');
const fs = require('fs');
const { parse } = require('csv-parse/sync');
const { v4: uuidv4 } = require('uuid');
const mailService = require('../services/mailService');

const getTeacherInviteDetails = async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) {
      throw new ApiError(400, 'Invitation token is missing');
    }

    const result = await db.query(
      'SELECT * FROM teacher_invitations WHERE token = $1',
      [token]
    );

    if (result.rows.length === 0) {
      throw new ApiError(404, 'Invalid invitation token');
    }

    const invitation = result.rows[0];
    if (invitation.status !== 'PENDING') {
      throw new ApiError(400, `Invitation has already been ${invitation.status.toLowerCase()}`);
    }

    if (new Date(invitation.expires_at) < new Date()) {
      await db.query(
        "UPDATE teacher_invitations SET status = 'EXPIRED' WHERE id = $1",
        [invitation.id]
      );
      throw new ApiError(400, 'Invitation token has expired');
    }

    sendSuccess(res, 200, 'Invitation details loaded successfully', {
      name: invitation.name,
      email: invitation.email,
      expiresAt: invitation.expires_at
    });
  } catch (error) {
    next(error);
  }
};

const completeTeacherInvite = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      throw new ApiError(400, 'Token and password are required');
    }

    const result = await db.query(
      'SELECT * FROM teacher_invitations WHERE token = $1',
      [token]
    );

    if (result.rows.length === 0) {
      throw new ApiError(404, 'Invalid invitation token');
    }

    const invitation = result.rows[0];
    if (invitation.status !== 'PENDING') {
      throw new ApiError(400, `Invitation has already been ${invitation.status.toLowerCase()}`);
    }

    if (new Date(invitation.expires_at) < new Date()) {
      await db.query(
        "UPDATE teacher_invitations SET status = 'EXPIRED' WHERE id = $1",
        [invitation.id]
      );
      throw new ApiError(400, 'Invitation token has expired');
    }

    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [invitation.email]
    );

    const hashedPass = await bcrypt.hash(password, 10);
    const collegeId = invitation.college_id || 1;

    if (existingUser.rows.length > 0) {
      await db.query(
        "UPDATE users SET role = 'TEACHER', password = $1, college_id = $2 WHERE id = $3",
        [hashedPass, collegeId, existingUser.rows[0].id]
      );
    } else {
      await db.query(
        "INSERT INTO users (name, email, password, role, college_id, profile_completed) VALUES ($1, $2, $3, 'TEACHER', $4, true)",
        [invitation.name, invitation.email, hashedPass, collegeId]
      );
    }

    await db.query(
      "UPDATE teacher_invitations SET status = 'ACCEPTED' WHERE id = $1",
      [invitation.id]
    );

    sendSuccess(res, 200, 'Teacher account created successfully');
  } catch (error) {
    next(error);
  }
};
const getDashboardStats = async (req, res, next) => {
  try {
    const adminCollegeId = req.user.college_id || 1;

    const studentsRes = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'STUDENT' AND college_id = $1", [adminCollegeId]);
    const teachersRes = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'TEACHER' AND college_id = $1", [adminCollegeId]);
    const examsRes = await db.query("SELECT COUNT(*) as count FROM exams WHERE college_id = $1", [adminCollegeId]);
    const publishedRes = await db.query("SELECT COUNT(*) as count FROM exams WHERE college_id = $1 AND is_published = 1", [adminCollegeId]);

    const stats = {
      totalStudents: Number(studentsRes.rows[0]?.count || 0),
      totalTeachers: Number(teachersRes.rows[0]?.count || 0),
      totalExams: Number(examsRes.rows[0]?.count || 0),
      totalPublishedExams: Number(publishedRes.rows[0]?.count || 0)
    };

    sendSuccess(res, 200, 'Dashboard statistics loaded successfully', stats);
  } catch (error) {
    next(error);
  }
};
const getSystemSettings = async (req, res) => sendSuccess(res, 200, 'Ok', {});
const updateSystemSettings = async (req, res) => sendSuccess(res, 200, 'Ok', {});

// Map database user row to StudentMasterRecord frontend model
const mapUserToStudent = (row) => ({
  id: String(row.id),
  registrationNumber: row.register_number,
  registration_number: row.register_number,
  name: row.name,
  email: row.email,
  branch: row.branch || 'General',
  department: row.branch || 'General',
  year: row.year || 1,
  profileCompleted: row.profile_completed === 1 || row.profile_completed === true,
  isActive: row.is_active === 1 || row.is_active === true,
  createdAt: row.created_at
});

const getStudents = async (req, res, next) => {
  try {
    const adminCollegeId = req.user.college_id || 1;
    let queryText = "SELECT * FROM users WHERE role = 'STUDENT' AND college_id = $1";
    let params = [adminCollegeId];
    
    if (req.query.search) {
      queryText += " AND (name LIKE $2 OR email LIKE $2 OR register_number LIKE $2)";
      params.push(`%${req.query.search}%`);
    }
    
    const result = await db.query(queryText, params);
    const students = result.rows.map(mapUserToStudent);
    
    sendSuccess(res, 200, 'Students retrieved successfully', { students });
  } catch (error) {
    next(error);
  }
};

const createStudent = async (req, res, next) => {
  try {
    const { registration_number, name, email, department, branch } = req.body;
    const adminCollegeId = req.user.college_id || 1;

    const collegeResult = await db.query('SELECT domain FROM colleges WHERE id = $1', [adminCollegeId]);
    const collegeDomain = collegeResult.rows[0]?.domain;
    if (!collegeDomain) {
      throw new ApiError(404, 'College not found');
    }

    const studentDomain = email.split('@')[1];
    if (studentDomain.toLowerCase() !== collegeDomain.toLowerCase()) {
      throw new ApiError(400, `Student email domain must match the college domain: @${collegeDomain}`);
    }

    // Check if email already registered
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      throw new ApiError(400, 'Email address already registered');
    }

    // Check if registration number already registered in this college
    if (registration_number) {
      if (registration_number.length > 10) {
        throw new ApiError(400, 'Registration number cannot exceed 10 characters.');
      }
      const existingReg = await db.query(
        'SELECT id FROM users WHERE register_number = $1 AND college_id = $2',
        [registration_number, adminCollegeId]
      );
      if (existingReg.rows.length > 0) {
        throw new ApiError(400, 'Registration number is already in use by another student in your college.');
      }
    }

    const defaultPass = await bcrypt.hash('student123', 10);
    const finalBranch = branch || department || 'General';

    const result = await db.query(
      'INSERT INTO users (name, email, password, role, register_number, branch, year, college_id, profile_completed) VALUES ($1, $2, $3, $4, $5, $6, 1, $7, true) RETURNING *',
      [name, email, defaultPass, 'STUDENT', registration_number, finalBranch, adminCollegeId]
    );

    sendSuccess(res, 201, 'Student created successfully', { student: mapUserToStudent(result.rows[0]) });
  } catch (error) {
    next(error);
  }
};

const uploadStudentsCsv = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ApiError(400, 'No CSV file uploaded');
    }

    const adminCollegeId = req.user.college_id || 1;
    const collegeResult = await db.query('SELECT domain FROM colleges WHERE id = $1', [adminCollegeId]);
    const collegeDomain = collegeResult.rows[0]?.domain;
    if (!collegeDomain) {
      throw new ApiError(404, 'College not found');
    }

    const fileContent = fs.readFileSync(req.file.path, 'utf8');
    
    // Parse CSV records synchronously
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    let insertedCount = 0;
    let updatedCount = 0;

    for (const record of records) {
      const name = record.name || record.Name || record.student_name || '';
      const email = record.email || record.Email || '';
      const reg = record.register_number || record.registration_number || record.registrationNumber || record.roll_no || record.roll_number || '';
      const branch = record.branch || record.department || record.Branch || 'General';
      const year = parseInt(record.year || record.Year || '1', 10) || 1;
      const rawPassword = record.password || record.Password || 'student123';

      if (!email || !name) continue;

      const studentDomain = email.split('@')[1];
      if (studentDomain.toLowerCase() !== collegeDomain.toLowerCase()) {
        throw new ApiError(400, `Student ${name} (${email}) has an email domain that does not match this college domain: @${collegeDomain}`);
      }

      // Check if student already exists
      const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
      
      if (existing.rows.length > 0) {
        // Update details (only update password if explicitly provided in CSV)
        if (record.password || record.Password) {
          const hashedPass = await bcrypt.hash(rawPassword, 10);
          await db.query(
            'UPDATE users SET name = $1, register_number = $2, branch = $3, year = $4, password = $5 WHERE id = $6',
            [name, reg, branch, year, hashedPass, existing.rows[0].id]
          );
        } else {
          await db.query(
            'UPDATE users SET name = $1, register_number = $2, branch = $3, year = $4 WHERE id = $5',
            [name, reg, branch, year, existing.rows[0].id]
          );
        }
        updatedCount++;
      } else {
        // Insert new student linked to this admin's college
        const hashedPass = await bcrypt.hash(rawPassword, 10);
        await db.query(
          'INSERT INTO users (name, email, password, role, register_number, branch, year, college_id, profile_completed) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)',
          [name, email, hashedPass, 'STUDENT', reg, branch, year, adminCollegeId]
        );
        insertedCount++;
      }
    }

    // Clean up file
    fs.unlinkSync(req.file.path);

    sendSuccess(res, 200, 'CSV uploaded and processed successfully', {
      totalProcessed: records.length,
      insertedCount,
      updatedCount
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

const updateStudent = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { registrationNumber, registration_number, name, email, branch, department } = req.body;
    
    const reg = registrationNumber || registration_number;
    const br = branch || department || 'General';
    const adminCollegeId = req.user.college_id || 1;

    if (reg) {
      if (reg.length > 10) {
        throw new ApiError(400, 'Registration number cannot exceed 10 characters.');
      }
      const existingReg = await db.query(
        'SELECT id FROM users WHERE register_number = $1 AND college_id = $2 AND id != $3',
        [reg, adminCollegeId, studentId]
      );
      if (existingReg.rows.length > 0) {
        throw new ApiError(400, 'Registration number is already in use by another student in your college.');
      }
    }

    const result = await db.query(
      'UPDATE users SET name = $1, email = $2, register_number = $3, branch = $4 WHERE id = $5 RETURNING *',
      [name, email, reg, br, studentId]
    );

    if (result.rows.length === 0) {
      throw new ApiError(404, 'Student not found');
    }

    sendSuccess(res, 200, 'Student updated successfully', { student: mapUserToStudent(result.rows[0]) });
  } catch (error) {
    next(error);
  }
};

const deleteStudent = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    await db.query('DELETE FROM users WHERE id = $1', [studentId]);
    sendSuccess(res, 200, 'Student deleted successfully');
  } catch (error) {
    next(error);
  }
};

const getTeacherInvitations = async (req, res, next) => {
  try {
    const adminCollegeId = req.user.college_id || 1;
    const result = await db.query(
      'SELECT id, name, email, status, token, expires_at, created_at FROM teacher_invitations WHERE college_id = $1 ORDER BY created_at DESC',
      [adminCollegeId]
    );
    sendSuccess(res, 200, 'Teacher invitations loaded', { invitations: result.rows });
  } catch (error) {
    next(error);
  }
};

const inviteTeacher = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      throw new ApiError(400, 'Name and email are required');
    }

    const adminCollegeId = req.user.college_id || 1;

    const collegeResult = await db.query('SELECT domain FROM colleges WHERE id = $1', [adminCollegeId]);
    const collegeDomain = collegeResult.rows[0]?.domain;
    if (!collegeDomain) {
      throw new ApiError(404, 'College not found');
    }

    const teacherDomain = email.split('@')[1];
    if (teacherDomain.toLowerCase() !== collegeDomain.toLowerCase()) {
      throw new ApiError(400, `Teacher email domain must match the college domain: @${collegeDomain}`);
    }

    const userResult = await db.query(
      'SELECT id, role FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length > 0 && userResult.rows[0].role === 'TEACHER') {
      throw new ApiError(400, 'User with this email is already a registered teacher');
    }

    await db.query(
      'DELETE FROM teacher_invitations WHERE email = $1',
      [email]
    );

    const inviteId = uuidv4();
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await db.query(
      'INSERT INTO teacher_invitations (id, name, email, token, status, college_id, expires_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [inviteId, name, email, token, 'PENDING', adminCollegeId, expiresAt]
    );

    const inviteLink = `http://localhost:5173/teacher/setup-password?token=${token}`;
    const emailRes = await mailService.sendTeacherInvite({
      to: email,
      name,
      inviteLink,
      expiresAt
    });

    sendSuccess(res, 200, 'Teacher invited successfully', {
      invitation: { id: inviteId, name, email, status: 'PENDING', expires_at: expiresAt },
      inviteLink,
      emailDelivered: emailRes.delivered
    });
  } catch (error) {
    next(error);
  }
};
const getAnalytics = async (req, res, next) => {
  try {
    const adminCollegeId = req.user.college_id || 1;

    const studentsRes = await db.query(
      "SELECT COUNT(*) as count FROM users WHERE role = 'STUDENT' AND college_id = $1",
      [adminCollegeId]
    );
    const totalRegisteredStudents = parseInt(studentsRes.rows[0]?.count || 0, 10);

    const teachersRes = await db.query(
      "SELECT COUNT(*) as count FROM users WHERE role = 'TEACHER' AND college_id = $1",
      [adminCollegeId]
    );
    const totalTeachers = parseInt(teachersRes.rows[0]?.count || 0, 10);

    const examsRes = await db.query(
      "SELECT COUNT(*) as count FROM exams WHERE college_id = $1",
      [adminCollegeId]
    );
    const totalExamsCreated = parseInt(examsRes.rows[0]?.count || 0, 10);

    const attemptsRes = await db.query(
      "SELECT COUNT(*) as count FROM exam_attempts ea JOIN users u ON ea.student_id = u.id WHERE u.college_id = $1",
      [adminCollegeId]
    );
    const totalAttempts = parseInt(attemptsRes.rows[0]?.count || 0, 10);

    const avgScoreRes = await db.query(
      "SELECT AVG(score) as avg FROM exam_attempts ea JOIN users u ON ea.student_id = u.id WHERE u.college_id = $1 AND ea.score IS NOT NULL",
      [adminCollegeId]
    );
    const averageScore = parseFloat(avgScoreRes.rows[0]?.avg || 0);

    const examsPerBranchRes = await db.query(
      "SELECT branch, COUNT(*) as count FROM exams WHERE college_id = $1 GROUP BY branch",
      [adminCollegeId]
    );
    const examsPerBranch = examsPerBranchRes.rows.map(row => ({
      branch: row.branch,
      count: parseInt(row.count, 10)
    }));

    const studentsPerDepartmentRes = await db.query(
      "SELECT branch as department, COUNT(*) as count FROM users WHERE role = 'STUDENT' AND college_id = $1 GROUP BY branch",
      [adminCollegeId]
    );
    const studentsPerDepartment = studentsPerDepartmentRes.rows.map(row => ({
      department: row.department || 'General',
      count: parseInt(row.count, 10)
    }));

    const passFailRes = await db.query(
      "SELECT SUM(CASE WHEN score >= 50 THEN 1 ELSE 0 END) as pass, SUM(CASE WHEN score < 50 THEN 1 ELSE 0 END) as fail FROM exam_attempts ea JOIN users u ON ea.student_id = u.id WHERE u.college_id = $1 AND ea.score IS NOT NULL",
      [adminCollegeId]
    );
    const passFailRatio = {
      pass: parseInt(passFailRes.rows[0]?.pass || 0, 10),
      fail: parseInt(passFailRes.rows[0]?.fail || 0, 10)
    };

    sendSuccess(res, 200, 'Analytics loaded successfully', {
      totalRegisteredStudents,
      totalTeachers,
      totalExamsCreated,
      totalAttempts,
      averageScore,
      examsPerBranch,
      studentsPerDepartment,
      passFailRatio
    });
  } catch (error) {
    next(error);
  }
};
const getSyllabusOverview = async (req, res) => sendSuccess(res, 200, 'Ok', {
  total_uploaded_syllabi: 0,
  total_branches: 0,
  total_departments: 0,
  total_subjects: 0,
  statusCounts: { UPLOADED: 0, PROCESSING: 0, READY: 0 }
});
const getSyllabusOptions = async (req, res) => sendSuccess(res, 200, 'Ok', {
  branches: [],
  departments: [],
  years: [],
  subjects: []
});
const getRecentActivity = async (req, res) => sendSuccess(res, 200, 'Ok', { activity: [] });
const getSyllabusLibrary = async (req, res) => sendSuccess(res, 200, 'Ok', {
  syllabi: [],
  overview: {
    total_uploaded_syllabi: 0,
    total_branches: 0,
    total_departments: 0,
    total_subjects: 0,
    statusCounts: { UPLOADED: 0, PROCESSING: 0, READY: 0 }
  }
});
const getSyllabusById = async (req, res) => sendSuccess(res, 200, 'Ok', {});
const getSyllabusDebugInfo = async (req, res) => sendSuccess(res, 200, 'Ok', {});
const downloadSyllabus = async (req, res) => sendSuccess(res, 200, 'Ok', {});
const uploadSyllabus = async (req, res) => sendSuccess(res, 200, 'Ok', {});
const updateSyllabus = async (req, res) => sendSuccess(res, 200, 'Ok', {});
const updateSyllabusStatus = async (req, res) => sendSuccess(res, 200, 'Ok', {});
const deleteSyllabus = async (req, res) => sendSuccess(res, 200, 'Ok', {});

module.exports = {
  getTeacherInviteDetails,
  completeTeacherInvite,
  getDashboardStats,
  getSystemSettings,
  updateSystemSettings,
  getStudents,
  createStudent,
  uploadStudentsCsv,
  updateStudent,
  deleteStudent,
  getTeacherInvitations,
  inviteTeacher,
  getAnalytics,
  getSyllabusOverview,
  getSyllabusOptions,
  getRecentActivity,
  getSyllabusLibrary,
  getSyllabusById,
  getSyllabusDebugInfo,
  downloadSyllabus,
  uploadSyllabus,
  updateSyllabus,
  updateSyllabusStatus,
  deleteSyllabus
};
