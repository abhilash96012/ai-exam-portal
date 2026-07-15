const db = require('../config/database');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/response');

const getStudentResults = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT ea.id as attemptId,
              ea.exam_id as examId,
              e.title as examTitle,
              u.branch,
              u.year,
              ea.score,
              ea.max_score as totalMarks,
              ea.end_time as submittedAt
       FROM exam_attempts ea 
       JOIN exams e ON ea.exam_id = e.id 
       JOIN users u ON ea.student_id = u.id
       WHERE ea.student_id = $1 AND ea.status = 'SUBMITTED'`,
      [req.user.id]
    );

    const mappedResults = result.rows.map(row => {
      const score = row.score || 0;
      const totalMarks = row.totalMarks || 10;
      const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0;
      const passed = percentage >= 40;

      return {
        attemptId: String(row.attemptId),
        examId: String(row.examId),
        examTitle: row.examTitle,
        branch: row.branch || 'General',
        year: row.year || 1,
        score: score,
        totalMarks: totalMarks,
        percentage: Number(percentage.toFixed(2)),
        passed: passed,
        submittedAt: row.submittedAt || new Date().toISOString()
      };
    });

    sendSuccess(res, 200, 'Student results retrieved', { results: mappedResults });
  } catch (error) {
    next(error);
  }
};

const getStudentResultByExam = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const result = await db.query(
      'SELECT id FROM exam_attempts WHERE exam_id = $1 AND student_id = $2 AND status = $3 LIMIT 1',
      [examId, req.user.id, 'SUBMITTED']
    );

    if (result.rows.length === 0) {
      throw new ApiError(404, 'Attempt result not found');
    }

    sendSuccess(res, 200, 'Attempt resolved successfully', { attemptId: result.rows[0].id });
  } catch (error) {
    next(error);
  }
};

const getResultDetails = async (req, res, next) => {
  try {
    const { attemptId } = req.params;

    // Load attempt and exam metadata
    const attemptResult = await db.query(
      `SELECT ea.*, e.title, e.duration 
       FROM exam_attempts ea 
       JOIN exams e ON ea.exam_id = e.id 
       WHERE ea.id = $1`,
      [attemptId]
    );

    if (attemptResult.rows.length === 0) {
      throw new ApiError(404, 'Attempt result not found');
    }

    const attempt = attemptResult.rows[0];
    const score = attempt.score || 0;
    const totalMarks = attempt.max_score || 10;
    const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0;
    const passed = percentage >= 40;

    const resultObj = {
      score,
      totalMarks,
      percentage: Number(percentage.toFixed(2)),
      passed
    };

    // Load questions along with student answers
    const questions = await db.query(
      `SELECT q.*, 
              a.selected_option as selectedOption, 
              a.text_answer as textAnswer, 
              a.is_correct as isCorrect, 
              a.score as studentScore, 
              a.feedback as answerFeedback
       FROM questions q
       LEFT JOIN answers a ON q.id = a.question_id AND a.attempt_id = $1
       WHERE q.exam_id = $2`,
      [attemptId, attempt.exam_id]
    );

    const formattedQuestions = questions.rows.map((q) => ({
      id: q.id,
      questionText: q.question_text,
      questionType: q.question_type || 'MCQ',
      options: JSON.parse(q.options || '[]'),
      correctOption: q.correct_option,
      modelAnswer: q.model_answer,
      marks: q.marks,
      selectedOption: q.selectedOption,
      textAnswer: q.textAnswer,
      isCorrect: q.isCorrect === 1 || q.isCorrect === true,
      studentScore: q.studentScore || 0,
      feedback: q.answerFeedback
    }));

    sendSuccess(res, 200, 'Result details loaded successfully', {
      result: resultObj,
      questions: formattedQuestions
    });
  } catch (error) {
    next(error);
  }
};

const getTeacherAllResults = async (req, res, next) => {
  try {
    // Select all exams created by this teacher
    const examsResult = await db.query(
      'SELECT id, title, description, created_at FROM exams WHERE created_by = $1',
      [req.user.id]
    );

    const examsSummary = [];

    for (const exam of examsResult.rows) {
      // Query attempts for this exam
      const attemptsResult = await db.query(
        'SELECT score, max_score, status FROM exam_attempts WHERE exam_id = $1',
        [exam.id]
      );

      const totalAttempts = attemptsResult.rows.length;
      const completedAttempts = attemptsResult.rows.filter(a => a.status === 'SUBMITTED').length;
      
      let totalScore = 0;
      let passedCount = 0;
      let completedCount = 0;

      for (const attempt of attemptsResult.rows) {
        if (attempt.status === 'SUBMITTED') {
          completedCount++;
          const score = attempt.score || 0;
          const totalMarks = attempt.max_score || 10;
          const pct = totalMarks > 0 ? (score / totalMarks) * 100 : 0;
          totalScore += pct;
          if (pct >= 40) passedCount++;
        }
      }

      const averageScore = completedCount > 0 ? totalScore / completedCount : 0;

      examsSummary.push({
        examId: String(exam.id),
        title: exam.title,
        branch: 'General',
        year: 1,
        status: completedAttempts > 0 ? 'COMPLETED' : 'PUBLISHED',
        totalAttempts,
        completedAttempts,
        averageScore: Number(averageScore.toFixed(2)),
        passedCount,
        createdAt: exam.created_at || new Date().toISOString()
      });
    }

    sendSuccess(res, 200, 'Teacher results retrieved', { exams: examsSummary });
  } catch (error) {
    next(error);
  }
};

const getExamResults = async (req, res, next) => {
  try {
    const { examId } = req.params;

    // Load exam metadata
    const examResult = await db.query('SELECT * FROM exams WHERE id = $1', [examId]);
    if (examResult.rows.length === 0) {
      throw new ApiError(404, 'Exam not found');
    }
    const exam = examResult.rows[0];

    // Load all attempts for this exam
    const attemptsResult = await db.query(
      `SELECT ea.*, u.id as studentId, u.name as studentName, u.email as studentEmail, u.register_number as registerNumber
       FROM exam_attempts ea
       JOIN users u ON ea.student_id = u.id
       WHERE ea.exam_id = $1 AND ea.status = 'SUBMITTED'`,
      [examId]
    );

    let totalScore = 0;
    let passedCount = 0;
    const results = attemptsResult.rows.map(row => {
      const score = row.score || 0;
      const totalMarks = row.max_score || 10;
      const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0;
      const passed = percentage >= 40;

      totalScore += percentage;
      if (passed) passedCount++;

      return {
        attemptId: String(row.id),
        studentId: String(row.studentId),
        studentName: row.studentName,
        studentEmail: row.studentEmail,
        registerNumber: row.registerNumber || 'N/A',
        score: score,
        totalMarks: totalMarks,
        percentage: Number(percentage.toFixed(2)),
        passed: passed,
        submittedAt: row.end_time || new Date().toISOString()
      };
    });

    const statistics = {
      totalAttempts: results.length,
      averageScore: results.length > 0 ? Number((totalScore / results.length).toFixed(2)) : 0,
      passedCount,
      failedCount: results.length - passedCount
    };

    sendSuccess(res, 200, 'Exam results retrieved', {
      exam: {
        id: exam.id,
        title: exam.title,
        durationMinutes: exam.duration
      },
      statistics,
      results
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStudentResults,
  getStudentResultByExam,
  getResultDetails,
  getTeacherAllResults,
  getExamResults
};
