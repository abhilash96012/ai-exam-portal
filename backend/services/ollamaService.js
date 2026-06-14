/**
 * Ollama AI Service
 * Handles AI question generation using local Ollama instance
 */

const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Generate MCQ questions from syllabus content
 * @param {string} syllabusContent - Text content of syllabus
 * @param {number} questionCount - Number of questions to generate
 * @param {string} subject - Subject name for context
 * @returns {Promise<Array>} Array of generated questions
 */
const generateQuestions = async (syllabusContent, questionCount = 10, subject = '') => {
  const prompt = buildQuestionPrompt(syllabusContent, questionCount, subject);

  try {
    logger.info('Calling Ollama API for question generation', { questionCount, subject });

    const response = await axios.post(config.ollama.apiUrl, {
      model: config.ollama.model,
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.7,
        top_p: 0.9,
        num_predict: 4096,
      },
    }, {
      timeout: 120000, // 2 minutes timeout for AI generation
    });

    if (!response.data || !response.data.response) {
      throw new Error('Invalid response from Ollama');
    }

    const questions = parseQuestionsFromResponse(response.data.response);
    logger.info(`Generated ${questions.length} questions successfully`);

    return questions;
  } catch (error) {
    logger.error('Ollama API error:', {
      message: error.message,
      code: error.code,
    });

    if (error.code === 'ECONNREFUSED') {
      throw new Error('Ollama service is not running. Please start Ollama on localhost:11434');
    }

    if (error.code === 'ETIMEDOUT') {
      throw new Error('Question generation timed out. Please try with fewer questions.');
    }

    throw new Error(`Failed to generate questions: ${error.message}`);
  }
};

/**
 * Build the prompt for question generation
 * @param {string} content - Syllabus content
 * @param {number} count - Number of questions
 * @param {string} subject - Subject name
 * @returns {string} Formatted prompt
 */
const buildQuestionPrompt = (content, count, subject) => {
  return `You are an expert exam question creator. Generate ${count} multiple choice questions (MCQs) based on the following syllabus/content for ${subject || 'the given subject'}.

IMPORTANT: Return ONLY a valid JSON array. Do not include any text before or after the JSON.

Each question object must have this exact structure:
{
  "question_text": "The question text here?",
  "option_a": "First option",
  "option_b": "Second option",
  "option_c": "Third option",
  "option_d": "Fourth option",
  "correct_option": "A"
}

Requirements:
- Generate exactly ${count} questions
- Each question should have 4 options (A, B, C, D)
- Only one correct answer per question
- correct_option must be exactly "A", "B", "C", or "D"
- Questions should test understanding, not just memorization
- Include mix of difficulty levels (easy, medium, hard)
- Options should be plausible (avoid obviously wrong answers)

SYLLABUS/CONTENT:
${content}

Return only the JSON array with ${count} questions:`;
};

/**
 * Parse questions from Ollama response
 * @param {string} responseText - Raw response text from Ollama
 * @returns {Array} Parsed questions array
 */
const parseQuestionsFromResponse = (responseText) => {
  try {
    // Try to find JSON array in response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      logger.warn('No JSON array found in Ollama response');
      return [];
    }

    const questions = JSON.parse(jsonMatch[0]);

    // Validate and clean questions
    const validQuestions = questions
      .filter(q => {
        return q.question_text && 
               q.option_a && 
               q.option_b && 
               q.option_c && 
               q.option_d && 
               ['A', 'B', 'C', 'D'].includes(q.correct_option?.toUpperCase());
      })
      .map(q => ({
        questionText: q.question_text.trim(),
        optionA: q.option_a.trim(),
        optionB: q.option_b.trim(),
        optionC: q.option_c.trim(),
        optionD: q.option_d.trim(),
        correctOption: q.correct_option.toUpperCase(),
        marks: 1,
      }));

    return validQuestions;
  } catch (error) {
    logger.error('Failed to parse Ollama response:', error.message);
    return [];
  }
};

/**
 * Check if Ollama service is available
 * @returns {Promise<boolean>} True if available
 */
const checkAvailability = async () => {
  try {
    const response = await axios.get(`${config.ollama.apiUrl.replace('/api/generate', '/api/tags')}`, {
      timeout: 5000,
    });
    return response.status === 200;
  } catch (error) {
    logger.warn('Ollama service not available:', error.message);
    return false;
  }
};

/**
 * Get list of available models
 * @returns {Promise<Array>} List of model names
 */
const getAvailableModels = async () => {
  try {
    const response = await axios.get(`${config.ollama.apiUrl.replace('/api/generate', '/api/tags')}`, {
      timeout: 5000,
    });
    return response.data.models?.map(m => m.name) || [];
  } catch (error) {
    logger.warn('Failed to get Ollama models:', error.message);
    return [];
  }
};

module.exports = {
  generateQuestions,
  checkAvailability,
  getAvailableModels,
};
