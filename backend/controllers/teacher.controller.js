const db = require('../config/database');
const { sendSuccess } = require('../utils/response');

const ollamaService = require('../services/ollamaService');

const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const getSubjects = async (req, res) => sendSuccess(res, 200, 'Ok', ['Java Programming', 'Database Systems', 'Software Engineering']);

const generateQuestionsFromPrompt = async (req, res, next) => {
  try {
    const { prompt, subject, questionType, difficulty, numberOfQuestions } = req.body;
    const count = numberOfQuestions || 5;
    
    // Treat the prompt as the context/syllabus for Ollama
    const questions = await ollamaService.generateQuestions(
      prompt || 'Generate general questions for this subject',
      count,
      subject || 'General Knowledge',
      difficulty || 'Medium',
      questionType || 'MCQ'
    );
    
    sendSuccess(res, 200, 'Questions generated successfully', { questions });
  } catch (error) {
    next(error);
  }
};

const generateQuestionsFromFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { subject, questionType, difficulty, numberOfQuestions } = req.body;
    const count = numberOfQuestions || 5;
    let extractedText = '';

    // Parse file based on mimetype
    if (req.file.mimetype === 'application/pdf') {
      const data = await pdfParse(req.file.buffer);
      extractedText = data.text;
    } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ buffer: req.file.buffer });
      extractedText = result.value;
    } else {
      return res.status(400).json({ success: false, message: 'Unsupported file type. Please upload a PDF or DOCX file.' });
    }

    if (!extractedText.trim()) {
      return res.status(400).json({ success: false, message: 'Could not extract text from the file. Please ensure it contains readable text.' });
    }

    // Limit text to roughly 2000 words (~12,000 chars) to avoid overloading Ollama
    const maxChars = 12000;
    if (extractedText.length > maxChars) {
      extractedText = extractedText.substring(0, maxChars) + '...';
    }

    const questions = await ollamaService.generateQuestions(
      extractedText,
      count,
      subject || 'General Knowledge',
      difficulty || 'Medium',
      questionType || 'MCQ'
    );

    if (!questions || questions.length === 0) {
      return res.status(500).json({ success: false, message: 'AI failed to generate questions in the correct format. Please try again.' });
    }

    sendSuccess(res, 200, 'Questions generated successfully from document', { questions });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSubjects,
  generateQuestionsFromPrompt,
  generateQuestionsFromFile
};
