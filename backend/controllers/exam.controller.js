const db = require('../config/database');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/response');
const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');
const ollamaService = require('../services/ollamaService');
const pdfService = require('../services/pdfService');
const fs = require('fs');

const createExam = async (req, res, next) => {
  try {
    const { title, description, durationMinutes, duration, totalMarks, total_marks, branch, year, section, startTime, start_time, endTime, end_time } = req.body;
    const finalDuration = durationMinutes || duration || 60;
    const finalTotalMarks = totalMarks || total_marks || 100;
    const finalYear = year ? Number(year) : null;
    const teacherCollegeId = req.user.college_id || 1;
    const finalStartTime = startTime || start_time || null;
    const finalEndTime = endTime || end_time || null;

    const result = await db.query(
      'INSERT INTO exams (title, description, duration, total_marks, branch, year, section, college_id, created_by, start_time, end_time) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
      [title, description || null, finalDuration, finalTotalMarks, branch || null, finalYear, section || null, teacherCollegeId, req.user.id, finalStartTime, finalEndTime]
    );
    sendSuccess(res, 201, 'Exam created successfully', { exam: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

const getTeacherExams = async (req, res, next) => {
  try {
    const teacherCollegeId = req.user.college_id || 1;
    const result = await db.query('SELECT * FROM exams WHERE created_by = $1 AND college_id = $2', [req.user.id, teacherCollegeId]);
    sendSuccess(res, 200, 'Exams retrieved', { exams: result.rows });
  } catch (error) {
    next(error);
  }
};

const getExamById = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const result = await db.query('SELECT * FROM exams WHERE id = $1', [examId]);
    if (result.rows.length === 0) {
      throw new ApiError(404, 'Exam not found');
    }
    sendSuccess(res, 200, 'Exam loaded', result.rows[0]);
  } catch (error) {
    next(error);
  }
};

const updateExam = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const { title, description, duration, durationMinutes, totalMarks, total_marks, branch, year, section, startTime, start_time, endTime, end_time } = req.body;
    const finalYear = year ? Number(year) : null;
    const finalDuration = duration || durationMinutes || 60;
    const finalTotalMarks = totalMarks || total_marks || 100;
    const finalStartTime = startTime || start_time || null;
    const finalEndTime = endTime || end_time || null;

    const result = await db.query(
      'UPDATE exams SET title = $1, description = $2, duration = $3, total_marks = $4, branch = $5, year = $6, section = $7, start_time = $8, end_time = $9 WHERE id = $10 RETURNING *',
      [title, description, finalDuration, finalTotalMarks, branch || null, finalYear, section || null, finalStartTime, finalEndTime, examId]
    );
    sendSuccess(res, 200, 'Exam updated', result.rows[0]);
  } catch (error) {
    next(error);
  }
};

const deleteExam = async (req, res, next) => {
  try {
    const { examId } = req.params;
    await db.query('DELETE FROM exams WHERE id = $1', [examId]);
    sendSuccess(res, 200, 'Exam deleted successfully');
  } catch (error) {
    next(error);
  }
};

const publishExam = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const result = await db.query('UPDATE exams SET is_published = true WHERE id = $1 RETURNING *', [examId]);
    sendSuccess(res, 200, 'Exam published', result.rows[0]);
  } catch (error) {
    next(error);
  }
};

const publishGeneratedExam = async (req, res, next) => {
  try {
    const { examName, description, department, year, section, startDate, startTime, endDate, endTime, duration, totalMarks, questions } = req.body;
    const teacherCollegeId = req.user.college_id || 1;
    
    // Format dates to ISO strings if needed, or just combine them if they are separate
    const startDateTime = startDate ? `${startDate} ${startTime || '00:00'}:00` : null;
    const endDateTime = endDate ? `${endDate} ${endTime || '23:59'}:00` : null;

    // Create the exam
    const examResult = await db.query(
      'INSERT INTO exams (title, description, duration, total_marks, branch, year, section, college_id, created_by, start_time, end_time, is_published) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true) RETURNING id',
      [examName, description, duration, totalMarks, department, Number(year) || null, section || null, teacherCollegeId, req.user.id, startDateTime, endDateTime]
    );
    const newExamId = examResult.rows[0].id;

    // Calculate marks per question
    const marksPerQuestion = questions.length > 0 ? (totalMarks / questions.length) : 1;

    // Insert questions
    for (const q of questions) {
      const isSubjective = !q.options || q.options.length === 0;
      await db.query(
        'INSERT INTO questions (exam_id, question_text, question_type, options, correct_option, marks, model_answer) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [
          newExamId,
          q.question,
          isSubjective ? 'SUBJECTIVE' : 'MCQ',
          isSubjective ? null : JSON.stringify(q.options),
          isSubjective ? null : String.fromCharCode(65 + (q.correctAnswer || 0)),
          marksPerQuestion,
          isSubjective ? (q.modelAnswer || 'Expected answer provided by teacher') : null
        ]
      );
    }
    
    sendSuccess(res, 201, 'Exam and questions published successfully', { examId: newExamId });
  } catch (error) {
    next(error);
  }
};

const uploadSyllabus = async (req, res, next) => {
  try {
    const { examId } = req.params;
    if (!req.file) {
      throw new ApiError(400, 'No file uploaded');
    }

    const filePath = req.file.path;
    logger.info(`Extracting text from uploaded file: ${filePath}`);
    const extractedText = await pdfService.extractText(filePath);

    // Save extracted text to the syllabus_text field of the exam (leaving description for summary)
    await db.query(
      'UPDATE exams SET syllabus_text = $1 WHERE id = $2',
      [extractedText, examId]
    );

    // Clean up temporary uploaded file
    fs.unlinkSync(filePath);

    logger.info(`Successfully stored syllabus text in database for Exam ID: ${examId}`);
    sendSuccess(res, 200, 'Syllabus text extracted and saved', { text: extractedText });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

// Mock generator for testing when n8n and Ollama are offline
const generateMockQuestions = (count, subject, difficulty) => {
  const diffLabel = difficulty ? difficulty.toUpperCase() : 'MEDIUM';
  const genericQuestions = [
    {
      questionText: `[${diffLabel}] What is the primary definition or role of ${subject || 'this subject'}?`,
      option_a: 'Core foundation concept and system architecture',
      option_b: 'A physical computer hardware device',
      option_c: 'A syntax compiler warning code',
      option_d: 'Database transaction serialization',
      options: [
        'Core foundation concept and system architecture',
        'A physical computer hardware device',
        'A syntax compiler warning code',
        'Database transaction serialization'
      ],
      correctOption: 'A',
      marks: 1,
      source_context: 'This subject deals with foundational concepts and system methodologies.'
    },
    {
      questionText: 'Which of the following is considered a development best practice?',
      option_a: 'Comprehensive code reviews and unit testing',
      option_b: 'Deploying code directly to production without testing',
      option_c: 'Disabling version control logs',
      option_d: 'Eliminating docstrings and comments',
      options: [
        'Comprehensive code reviews and unit testing',
        'Deploying code directly to production without testing',
        'Disabling version control logs',
        'Eliminating docstrings and comments'
      ],
      correctOption: 'A',
      marks: 1,
      source_context: 'Best practices dictate thorough testing and code quality checks.'
    },
    {
      questionText: 'What is the main benefit of a file-based SQL database like SQLite?',
      option_a: 'Simplicity and zero-installation configuration',
      option_b: 'Infinite concurrent scaling capability',
      option_c: 'Network replication speed',
      option_d: 'Integrated cloud cluster balance',
      options: [
        'Simplicity and zero-installation configuration',
        'Infinite concurrent scaling capability',
        'Network replication speed',
        'Integrated cloud cluster balance'
      ],
      correctOption: 'A',
      marks: 1,
      source_context: 'File-based databases allow quick local setups without server configuration.'
    },
    {
      questionText: 'Which storage data structure operates on the LIFO (Last-In, First-Out) model?',
      option_a: 'Stack',
      option_b: 'Queue',
      option_c: 'Binary Tree',
      option_d: 'Linked List',
      options: [
        'Stack',
        'Queue',
        'Binary Tree',
        'Linked List'
      ],
      correctOption: 'A',
      marks: 1,
      source_context: 'Stacks store elements and pop them in a LIFO order.'
    },
    {
      questionText: 'What is the purpose of an API route endpoint?',
      option_a: 'To enable communication and data transfer between systems',
      option_b: 'To style client interface buttons',
      option_c: 'To serve static images locally',
      option_d: 'To write compiler binaries',
      options: [
        'To enable communication and data transfer between systems',
        'To style client interface buttons',
        'To serve static images locally',
        'To write compiler binaries'
      ],
      correctOption: 'A',
      marks: 1,
      source_context: 'API endpoints expose interfaces for communication.'
    }
  ];

  const results = [];
  for (let i = 0; i < count; i++) {
    const template = genericQuestions[i % genericQuestions.length];
    results.push({
      ...template,
      id: i + 1
    });
  }
  return results;
};

const generateQuestions = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const exam = await db.query('SELECT * FROM exams WHERE id = $1', [examId]);
    if (exam.rows.length === 0) {
      throw new ApiError(404, 'Exam not found');
    }

    const count = req.body.count || 5;
    const subject = exam.rows[0].title;
    // Retrieve syllabus text stored in exam syllabus_text column
    let syllabusText = exam.rows[0].syllabus_text || '';

    // Optimize for CPU speed: Truncate very long texts to 4000 characters
    if (syllabusText.length > 4000) {
      logger.info(`Syllabus length is ${syllabusText.length} chars. Truncating to 4000 for faster CPU execution...`);
      syllabusText = syllabusText.substring(0, 4000);
    }
    
    const difficultyLevel = req.body.difficulty || 'Easy';

    try {
      logger.info('Attempting to generate questions via n8n webhook...');
      const response = await axios.post(config.n8n.webhookUrl, {
        type: 'teacher',
        subject: subject,
        questionType: req.body.questionType || 'MCQ',
        difficulty: difficultyLevel,
        count: count,
        prompt: req.body.prompt || 'generate questions',
        data: { text: syllabusText }
      }, { timeout: 5000 });
      
      logger.info('Successfully generated questions via n8n!');
      return sendSuccess(res, 200, 'Questions generated via n8n', response.data);
    } catch (n8nError) {
      logger.warn(`n8n webhook failed: ${n8nError.message}. Attempting local Ollama...`);
      
      try {
        const questions = await ollamaService.generateQuestions(syllabusText, count, subject, difficultyLevel, req.body.questionType || 'MCQ');
        
        // Map local Ollama response keys to frontend keys
        const mappedQuestions = questions.map((q, idx) => {
          const optA = q.option_a || q.optionA || (q.options && q.options[0]);
          const optB = q.option_b || q.optionB || (q.options && q.options[1]);
          const optC = q.option_c || q.optionC || (q.options && q.options[2]);
          const optD = q.option_d || q.optionD || (q.options && q.options[3]);
          
          let correctStr = q.correct_option || q.correctOption;
          if (!correctStr && q.correctAnswer !== undefined) {
             correctStr = ['A', 'B', 'C', 'D'][q.correctAnswer] || 'A';
          }

          return {
            id: idx + 1,
            questionText: q.question_text || q.questionText || q.question,
            option_a: optA,
            option_b: optB,
            option_c: optC,
            option_d: optD,
            options: q.options || [optA, optB, optC, optD],
            correctOption: correctStr,
            marks: q.marks || 1,
            source_context: q.source_context || q.sourceContext || 'Generated by local AI'
          };
        });
        
        logger.info('Successfully generated questions via local Ollama!');
        return sendSuccess(res, 200, 'Questions generated via local Ollama', { questions: mappedQuestions });
      } catch (ollamaError) {
        logger.warn(`Ollama service failed: ${ollamaError.message}. Falling back to high-quality mock questions...`);
        
        const mockQuestions = generateMockQuestions(count, subject, difficultyLevel);
        return sendSuccess(res, 200, 'Questions generated via Mock Fallback (n8n & Ollama offline)', { questions: mockQuestions });
      }
    }
  } catch (error) {
    next(error);
  }
};

const getExamStatistics = async (req, res, next) => {
  try {
    const { examId } = req.params;
    
    // Get all attempts for this exam
    const attemptsRes = await db.query(
      "SELECT * FROM exam_attempts WHERE exam_id = $1 AND status = 'SUBMITTED'",
      [examId]
    );
    const attempts = attemptsRes.rows;

    // Get total attempts including STARTED
    const totalAttemptsRes = await db.query(
      "SELECT COUNT(*) as count FROM exam_attempts WHERE exam_id = $1",
      [examId]
    );
    const totalAttempts = parseInt(totalAttemptsRes.rows[0]?.count || 0);
    const completedAttempts = attempts.length;

    if (completedAttempts === 0) {
      return res.json({
        success: true,
        data: {
          totalAttempts,
          completedAttempts,
          averageScore: 0,
          highestScore: 0,
          lowestScore: 0,
          hardestQuestions: [],
          scoreDistribution: { '0-25': 0, '26-50': 0, '51-75': 0, '76-100': 0 }
        }
      });
    }

    let totalScore = 0;
    let highestScore = 0;
    let lowestScore = 999999;
    const scoreDistribution = { '0-25': 0, '26-50': 0, '51-75': 0, '76-100': 0 };

    attempts.forEach(a => {
      const percentage = (a.score / (a.max_score || 1)) * 100;
      totalScore += percentage;
      if (percentage > highestScore) highestScore = percentage;
      if (percentage < lowestScore) lowestScore = percentage;

      if (percentage <= 25) scoreDistribution['0-25']++;
      else if (percentage <= 50) scoreDistribution['26-50']++;
      else if (percentage <= 75) scoreDistribution['51-75']++;
      else scoreDistribution['76-100']++;
    });

    const averageScore = totalScore / completedAttempts;

    // Hardest questions
    const answersRes = await db.query(`
      SELECT 
        a.question_id, 
        q.question_text, 
        COUNT(a.id) as total_answers, 
        SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) as correct_answers
      FROM answers a
      JOIN questions q ON a.question_id = q.id
      JOIN exam_attempts ea ON a.attempt_id = ea.id
      WHERE ea.exam_id = $1 AND ea.status = 'SUBMITTED'
      GROUP BY a.question_id
      HAVING total_answers > 0
    `, [examId]);

    const hardestQuestions = answersRes.rows
      .map(row => {
        const failureRate = 100 - ((row.correct_answers / row.total_answers) * 100);
        return {
          questionId: row.question_id,
          questionText: row.question_text,
          failureRate: failureRate
        };
      })
      .sort((a, b) => b.failureRate - a.failureRate)
      .slice(0, 3); // Top 3 hardest

    res.json({
      success: true,
      data: {
        totalAttempts,
        completedAttempts,
        averageScore: averageScore.toFixed(2),
        highestScore: highestScore.toFixed(2),
        lowestScore: lowestScore.toFixed(2),
        hardestQuestions,
        scoreDistribution
      }
    });
  } catch (error) {
    next(error);
  }
};

const exportResultsCsv = async (req, res, next) => {
  try {
    const { examId } = req.params;

    const query = `
      SELECT 
        ea.id as attempt_id,
        u.name as student_name,
        u.email as student_email,
        ea.status,
        ea.score,
        ea.max_score,
        ea.start_time,
        ea.end_time,
        ea.tab_switch_count
      FROM exam_attempts ea
      JOIN users u ON ea.student_id = u.id
      WHERE ea.exam_id = $1
      ORDER BY ea.end_time DESC
    `;
    const results = await db.query(query, [examId]);

    if (results.rows.length === 0) {
      return res.status(404).send("No attempts found for this exam.");
    }

    const headers = [
      "Attempt ID",
      "Student Name",
      "Student Email",
      "Status",
      "Score",
      "Max Score",
      "Percentage",
      "Start Time",
      "End Time",
      "Cheat Warnings"
    ];

    const rows = results.rows.map(row => {
      const percentage = row.max_score ? ((row.score / row.max_score) * 100).toFixed(2) + '%' : 'N/A';
      return [
        row.attempt_id,
        `"${row.student_name}"`,
        `"${row.student_email}"`,
        row.status,
        row.score || 0,
        row.max_score || 0,
        percentage,
        `"${row.start_time || ''}"`,
        `"${row.end_time || ''}"`,
        row.tab_switch_count || 0
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=exam_${examId}_results.csv`);
    res.send(csvContent);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createExam,
  getTeacherExams,
  getExamById,
  updateExam,
  deleteExam,
  publishExam,
  publishGeneratedExam,
  uploadSyllabus,
  generateQuestions,
  getExamStatistics,
  exportResultsCsv
};
