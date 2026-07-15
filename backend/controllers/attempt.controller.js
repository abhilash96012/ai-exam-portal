const db = require('../config/database');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/response');

const getAvailableExams = async (req, res, next) => {
  try {
    // Load student's branch, year, section & college_id profile
    const student = await db.query('SELECT branch, year, section, college_id FROM users WHERE id = $1', [req.user.id]);
    const studentBranch = student.rows[0]?.branch || '';
    const studentYear = student.rows[0]?.year || 0;
    const studentSection = student.rows[0]?.section || '';
    const studentCollegeId = student.rows[0]?.college_id || 1;

    // Select all published exams matching student branch/year/section/college (or open/null exams),
    // counting questions and checking student attempt status
    const result = await db.query(
      `SELECT e.*, 
              (SELECT COUNT(*) FROM questions q WHERE q.exam_id = e.id) as totalQuestions,
              (SELECT ea.status FROM exam_attempts ea WHERE ea.exam_id = e.id AND ea.student_id = $1 ORDER BY ea.id DESC LIMIT 1) as attemptStatus
       FROM exams e 
       WHERE e.is_published = true
         AND e.college_id = $2
         AND (e.branch IS NULL OR e.branch = '' OR e.branch = $3)
         AND (e.year IS NULL OR e.year = 0 OR e.year = $4)
         AND (e.section IS NULL OR e.section = '' OR e.section = $5)`,
      [req.user.id, studentCollegeId, studentBranch, studentYear, studentSection]
    );

    // Map database properties to the schema names the frontend expects
    const mappedExams = result.rows.map(exam => ({
      ...exam,
      durationMinutes: exam.duration, // alias for frontend getStudentExams mapper
      totalQuestions: exam.totalQuestions || 0
    }));

    sendSuccess(res, 200, 'Exams retrieved successfully', { exams: mappedExams });
  } catch (error) {
    next(error);
  }
};

const startExam = async (req, res, next) => {
  try {
    const { examId } = req.params;

    // Load student's branch, year, section & college_id profile
    const student = await db.query('SELECT branch, year, section, college_id FROM users WHERE id = $1', [req.user.id]);
    const studentBranch = student.rows[0]?.branch || '';
    const studentYear = student.rows[0]?.year || 0;
    const studentSection = student.rows[0]?.section || '';
    const studentCollegeId = student.rows[0]?.college_id || 1;

    // Load exam metadata and check eligibility
    const examResult = await db.query(
      `SELECT * FROM exams 
       WHERE id = $1 
         AND is_published = true
         AND college_id = $2
         AND (branch IS NULL OR branch = '' OR branch = $3)
         AND (year IS NULL OR year = 0 OR year = $4)
         AND (section IS NULL OR section = '' OR section = $5)`,
      [examId, studentCollegeId, studentBranch, studentYear, studentSection]
    );
    if (examResult.rows.length === 0) {
      throw new ApiError(404, 'Published exam not found or you are not eligible to take it.');
    }
    const exam = examResult.rows[0];
  const now = new Date();

  if (exam.start_time) {
    const startTimeDate = new Date(exam.start_time);
    if (now < startTimeDate) {
      throw new ApiError(400, `This exam is scheduled to start at ${startTimeDate.toLocaleString()}.`);
    }
  }

  if (exam.end_time) {
    const endTimeDate = new Date(exam.end_time);
    if (now > endTimeDate) {
      throw new ApiError(400, 'This exam has expired and is no longer accepting new attempts.');
    }
  }

    // Check if student already has a started attempt
    let attempt;
    const existing = await db.query(
      'SELECT * FROM exam_attempts WHERE exam_id = $1 AND student_id = $2',
      [examId, req.user.id]
    );

    if (existing.rows.length > 0) {
      // Check if any of the existing attempts are submitted (handles race condition duplicates)
      const hasSubmitted = existing.rows.find(r => r.status === 'SUBMITTED');
      if (hasSubmitted) {
        throw new ApiError(400, 'You have already submitted this exam.');
      }
      
      // If not submitted, resume an existing started attempt
      attempt = existing.rows.find(r => r.status === 'STARTED') || existing.rows[0];
    } else {
      // Create a new attempt
      const result = await db.query(
        'INSERT INTO exam_attempts (exam_id, student_id, status, start_time) VALUES ($1, $2, $3, CURRENT_TIMESTAMP) RETURNING *',
        [examId, req.user.id, 'STARTED']
      );
      attempt = result.rows[0];
    }

    // Load questions for the exam
    // Load questions for the exam
    const questionsResult = await db.query(
      'SELECT id, exam_id, question_text, question_type, options, marks FROM questions WHERE exam_id = $1',
      [examId]
    );

    // Map database questions back to the properties the student UI expects
    const questions = questionsResult.rows.map((q) => {
      let parsedOptions = [];
      try {
        parsedOptions = JSON.parse(q.options || '[]');
      } catch (e) {
        parsedOptions = [];
      }

      return {
        id: q.id,
        exam_id: q.exam_id,
        question_text: q.question_text,
        question_type: q.question_type || 'MCQ',
        option_a: parsedOptions[0] || '',
        option_b: parsedOptions[1] || '',
        option_c: parsedOptions[2] || '',
        option_d: parsedOptions[3] || '',
        marks: q.marks
      };
    });

    sendSuccess(res, 201, 'Exam attempt started successfully', {
      attempt,
      exam: {
        ...exam,
        durationMinutes: exam.duration,
        totalQuestions: questions.length
      },
      questions
    });
  } catch (error) {
    next(error);
  }
};

const getAttempt = async (req, res, next) => {
  try {
    const { attemptId } = req.params;

    // Load attempt and exam metadata
    const attemptResult = await db.query(
      `SELECT ea.*, e.title, e.duration 
       FROM exam_attempts ea 
       JOIN exams e ON ea.exam_id = e.id 
       WHERE ea.id = $1 AND ea.student_id = $2`,
      [attemptId, req.user.id]
    );

    if (attemptResult.rows.length === 0) {
      throw new ApiError(404, 'Exam attempt not found');
    }

    const attempt = attemptResult.rows[0];

    // Load questions (do not leak correctOption/modelAnswer to student during active attempt!)
    const questionsResult = await db.query(
      'SELECT id, exam_id, question_text, question_type, options, marks FROM questions WHERE exam_id = $1',
      [attempt.exam_id]
    );

    const questions = questionsResult.rows.map((q) => {
      let parsedOptions = [];
      try {
        parsedOptions = JSON.parse(q.options || '[]');
      } catch (e) {
        parsedOptions = [];
      }

      return {
        id: q.id,
        exam_id: q.exam_id,
        question_text: q.question_text,
        question_type: q.question_type || 'MCQ',
        option_a: parsedOptions[0] || '',
        option_b: parsedOptions[1] || '',
        option_c: parsedOptions[2] || '',
        option_d: parsedOptions[3] || '',
        marks: q.marks
      };
    });

    sendSuccess(res, 200, 'Attempt loaded successfully', {
      attempt,
      exam: {
        title: attempt.title,
        durationMinutes: attempt.duration,
        totalQuestions: questions.length
      },
      questions
    });
  } catch (error) {
    next(error);
  }
};

const getRemainingTime = async (req, res, next) => {
  try {
    const { attemptId } = req.params;

    const attempt = await db.query(
      `SELECT ea.*, e.duration 
       FROM exam_attempts ea 
       JOIN exams e ON ea.exam_id = e.id 
       WHERE ea.id = $1 AND ea.student_id = $2`,
      [attemptId, req.user.id]
    );

    if (attempt.rows.length === 0) {
      throw new ApiError(404, 'Attempt not found');
    }

    const start = new Date(attempt.rows[0].start_time);
    const durationSeconds = attempt.rows[0].duration * 60;
    const elapsedSeconds = Math.floor((Date.now() - start.getTime()) / 1000);
    const remainingSeconds = Math.max(0, durationSeconds - elapsedSeconds);

    sendSuccess(res, 200, 'Remaining time loaded', { remainingSeconds });
  } catch (error) {
    next(error);
  }
};

const saveAnswer = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const { questionId, selectedOption, textAnswer } = req.body;

    // Verify ownership of the attempt
    const attempt = await db.query('SELECT id FROM exam_attempts WHERE id = $1 AND student_id = $2', [attemptId, req.user.id]);
    if (attempt.rows.length === 0) {
      throw new ApiError(403, 'Unauthorized access to attempt');
    }

    const existing = await db.query(
      'SELECT id FROM answers WHERE attempt_id = $1 AND question_id = $2',
      [attemptId, questionId]
    );

    if (existing.rows.length > 0) {
      await db.query(
        'UPDATE answers SET selected_option = $1, text_answer = $2 WHERE id = $3',
        [selectedOption || null, textAnswer || null, existing.rows[0].id]
      );
    } else {
      await db.query(
        'INSERT INTO answers (attempt_id, question_id, selected_option, text_answer) VALUES ($1, $2, $3, $4)',
        [attemptId, questionId, selectedOption || null, textAnswer || null]
      );
    }

    sendSuccess(res, 200, 'Answer saved successfully');
  } catch (error) {
    next(error);
  }
};

const submitExam = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const { tabSwitchCount } = req.body;

    // Verify ownership and load attempt
    const attemptResult = await db.query(
      'SELECT * FROM exam_attempts WHERE id = $1 AND student_id = $2',
      [attemptId, req.user.id]
    );
    if (attemptResult.rows.length === 0) {
      throw new ApiError(403, 'Unauthorized access to attempt');
    }

    const attempt = attemptResult.rows[0];
    if (attempt.status === 'SUBMITTED') {
      throw new ApiError(400, 'Exam has already been submitted');
    }

    const examId = attempt.exam_id;

    // Load exam questions and student answers
    const questions = await db.query('SELECT id, question_type, question_text, correct_option, model_answer, marks FROM questions WHERE exam_id = $1', [examId]);
    const answers = await db.query('SELECT * FROM answers WHERE attempt_id = $1', [attemptId]);

    const ollamaService = require('../services/ollamaService');

    let score = 0;
    let maxScore = 0;

    // Grade MCQs and Subjective questions automatically
    for (const q of questions.rows) {
      maxScore += q.marks || 1;
      const studentAns = answers.rows.find((a) => a.question_id === q.id);
      
      if (studentAns) {
        const isMcq = !q.question_type || q.question_type === 'MCQ';
        
        if (isMcq) {
          const isCorrect = studentAns.selected_option && 
            studentAns.selected_option.trim().toUpperCase() === (q.correct_option || '').trim().toUpperCase();
          
          if (isCorrect) {
            score += q.marks || 1;
            await db.query('UPDATE answers SET is_correct = true, score = $1 WHERE id = $2', [q.marks, studentAns.id]);
          } else {
            await db.query('UPDATE answers SET is_correct = false, score = 0 WHERE id = $2', [studentAns.id]);
          }
        } else {
          // SUBJECTIVE Grading via AI
          const evalResult = await ollamaService.evaluateSubjectiveAnswer(
            q.question_text, 
            q.model_answer, 
            studentAns.text_answer, 
            q.marks || 5
          );
          
          score += evalResult.score;
          await db.query(
            'UPDATE answers SET score = $1, feedback = $2 WHERE id = $3', 
            [evalResult.score, evalResult.feedback, studentAns.id]
          );
        }
      }
    }

    // Set submitted state
    await db.query(
      'UPDATE exam_attempts SET status = $1, score = $2, max_score = $3, tab_switch_count = $4, end_time = CURRENT_TIMESTAMP WHERE id = $5',
      ['SUBMITTED', score, maxScore, tabSwitchCount || 0, attemptId]
    );

    sendSuccess(res, 200, 'Exam submitted and graded successfully', { score, maxScore });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAvailableExams,
  startExam,
  getAttempt,
  getRemainingTime,
  saveAnswer,
  submitExam
};
