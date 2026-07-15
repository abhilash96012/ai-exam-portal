const db = require('../config/database');
const { sendSuccess } = require('../utils/response');

const createQuestion = async (req, res, next) => {
  try {
    const { examId, questionText, optionA, optionB, optionC, optionD, correctOption, modelAnswer, marks, sourceContext } = req.body;
    const optionsArray = [optionA || "", optionB || "", optionC || "", optionD || ""];
    
    const result = await db.query(
      'INSERT INTO questions (exam_id, question_text, options, correct_option, model_answer, marks, source_context) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [examId, questionText, JSON.stringify(optionsArray), correctOption, modelAnswer, marks || 1, sourceContext]
    );
    sendSuccess(res, 201, 'Question created', result.rows[0]);
  } catch (error) {
    next(error);
  }
};

const createBulkQuestions = async (req, res, next) => {
  try {
    const { examId, questions } = req.body;
    const inserted = [];
    for (const q of questions) {
      const optionsArray = [q.optionA || "", q.optionB || "", q.optionC || "", q.optionD || ""];
      const result = await db.query(
        'INSERT INTO questions (exam_id, question_text, options, correct_option, model_answer, marks, source_context) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [examId, q.questionText, JSON.stringify(optionsArray), q.correctOption, q.modelAnswer, q.marks || 1, q.sourceContext]
      );
      inserted.push(result.rows[0]);
    }
    sendSuccess(res, 201, 'Bulk questions created', inserted);
  } catch (error) {
    next(error);
  }
};

const getQuestionById = async (req, res, next) => {
  try {
    const result = await db.query('SELECT * FROM questions WHERE id = $1', [req.params.questionId]);
    sendSuccess(res, 200, 'Question loaded', result.rows[0]);
  } catch (error) {
    next(error);
  }
};

const getExamQuestions = async (req, res, next) => {
  try {
    const result = await db.query('SELECT * FROM questions WHERE exam_id = $1', [req.params.examId]);
    sendSuccess(res, 200, 'Questions loaded', result.rows);
  } catch (error) {
    next(error);
  }
};

const updateQuestion = async (req, res, next) => {
  try {
    const { questionText, optionA, optionB, optionC, optionD, correctOption, modelAnswer, marks, sourceContext } = req.body;
    const optionsArray = [optionA || "", optionB || "", optionC || "", optionD || ""];
    
    const result = await db.query(
      'UPDATE questions SET question_text = $1, options = $2, correct_option = $3, model_answer = $4, marks = $5, source_context = $6 WHERE id = $7 RETURNING *',
      [questionText, JSON.stringify(optionsArray), correctOption, modelAnswer, marks, sourceContext, req.params.questionId]
    );
    sendSuccess(res, 200, 'Question updated', result.rows[0]);
  } catch (error) {
    next(error);
  }
};

const deleteQuestion = async (req, res, next) => {
  try {
    await db.query('DELETE FROM questions WHERE id = $1', [req.params.questionId]);
    sendSuccess(res, 200, 'Question deleted');
  } catch (error) {
    next(error);
  }
};

const deleteExamQuestions = async (req, res, next) => {
  try {
    await db.query('DELETE FROM questions WHERE exam_id = $1', [req.params.examId]);
    sendSuccess(res, 200, 'Exam questions deleted');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createQuestion,
  createBulkQuestions,
  getQuestionById,
  getExamQuestions,
  updateQuestion,
  deleteQuestion,
  deleteExamQuestions
};
