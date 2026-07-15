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
const generateQuestions = async (syllabusContent, questionCount = 10, subject = '', difficulty = 'medium', questionType = 'MCQ') => {
  const prompt = buildQuestionPrompt(syllabusContent, questionCount, subject, difficulty, questionType);

  try {
    logger.info('Calling Ollama API for question generation', { questionCount, subject });

    const response = await axios.post(config.ollama.apiUrl, {
      model: config.ollama.model,
      prompt: prompt,
      format: "json",
      stream: false,
      options: {
        temperature: 0.7,
        top_p: 0.9,
        num_predict: 4096,
      },
    }, {
      timeout: 300000, // 5 minutes timeout for CPU AI generation
    });

    if (!response.data || !response.data.response) {
      throw new Error('Invalid response from Ollama');
    }

    const questions = parseQuestionsFromResponse(response.data.response, questionType);
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
const buildQuestionPrompt = (content, count, subject, difficulty, questionType) => {
  if (questionType === 'SUBJECTIVE') {
    return `You are an expert exam question creator. Generate ${count} SUBJECTIVE (descriptive/essay) questions based on the following syllabus/content for ${subject || 'the given subject'}.
    
IMPORTANT: The difficulty level of these questions MUST BE ${difficulty.toUpperCase()}. Adjust the complexity and depth of knowledge accordingly.

IMPORTANT: Return ONLY a valid JSON array. Do not include any text before or after the JSON.

Each question object must have this exact structure:
{
  "question_text": "The question text here?",
  "model_answer": "A detailed model answer or grading rubric that explains what a correct student response should contain."
}

Requirements:
- Generate exactly ${count} questions
- Questions should test deep understanding and require descriptive answers
- The difficulty level of all questions should be strictly ${difficulty.toUpperCase()}

SYLLABUS/CONTENT:
${content}

Return only the JSON array with ${count} questions:`;
  }

    return `You are an expert exam question creator. Generate exactly ${count} multiple choice questions (MCQs) based on the following syllabus/content for ${subject || 'the given subject'}.
  
IMPORTANT: The difficulty level of these questions MUST BE ${difficulty.toUpperCase()}.

CRITICAL INSTRUCTION: You MUST return ONLY a valid JSON array of ${count} objects. DO NOT output any introduction, explanation, or conversational text. ONLY JSON.

Each question object MUST have this EXACT structure with NO missing fields:
{
  "question_text": "The text of the question?",
  "option_a": "First option",
  "option_b": "Second option",
  "option_c": "Third option",
  "option_d": "Fourth option",
  "correct_option": "A"
}

Requirements:
- Generate exactly ${count} questions.
- Each question must have exactly 4 options (option_a, option_b, option_c, option_d).
- "correct_option" must be exactly "A", "B", "C", or "D".
- YOU MUST format it as a valid JSON array like [ { ... }, { ... } ].

SYLLABUS/CONTENT:
${content}

Return ONLY the JSON array:`;
};

/**
 * Parse questions from Ollama response
 * @param {string} responseText - Raw response text from Ollama
 * @returns {Array} Parsed questions array
 */
const parseQuestionsFromResponse = (responseText, questionType = 'MCQ') => {
  try {
    logger.info('Raw Ollama response:', { responseText });
    let questions = [];
    
    // Try to find JSON array in response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      questions = JSON.parse(jsonMatch[0]);
    } else {
      // If no array, try to find a single JSON object
      const singleMatch = responseText.match(/\{[\s\S]*\}/);
      if (singleMatch) {
        const parsed = JSON.parse(singleMatch[0]);
        // Sometimes it wraps the array in an object like {"questions": [...]}
        if (parsed.questions && Array.isArray(parsed.questions)) {
          questions = parsed.questions;
        } else {
          questions = [parsed];
        }
      } else {
        logger.warn('No JSON array or object found in Ollama response');
        return [];
      }
    }

    if (questionType === 'SUBJECTIVE') {
      const validQuestions = questions
        .filter(q => q.question_text && q.model_answer)
        .map(q => ({
          question: q.question_text.trim(),
          modelAnswer: q.model_answer.trim(),
          questionType: 'SUBJECTIVE',
          marks: 5,
        }));
      return validQuestions;
    }

    // Validate and clean questions
    const validQuestions = questions
      .filter(q => {
        const hasQuestion = q.question_text || q.questionText || q.question;
        const hasOptions = (q.option_a || q.optionA || q.a || (q.options && q.options[0])) && 
                           (q.option_b || q.optionB || q.b || (q.options && q.options[1])) && 
                           (q.option_c || q.optionC || q.c || (q.options && q.options[2])) && 
                           (q.option_d || q.optionD || q.d || (q.options && q.options[3]));
        return hasQuestion && hasOptions;
      })
      .map(q => {
        const correct = (q.correct_option || q.correctOption || q.correct_answer || q.correctAnswer || q.answer || 'A').toString().toUpperCase().trim();
        let correctIndex = 0;
        if (correct.includes('A') || correct === '0') correctIndex = 0;
        else if (correct.includes('B') || correct === '1') correctIndex = 1;
        else if (correct.includes('C') || correct === '2') correctIndex = 2;
        else if (correct.includes('D') || correct === '3') correctIndex = 3;

        return {
          question: (q.question_text || q.questionText || q.question).trim(),
          options: [
            (q.option_a || q.optionA || q.a || (q.options && q.options[0])).trim(),
            (q.option_b || q.optionB || q.b || (q.options && q.options[1])).trim(),
            (q.option_c || q.optionC || q.c || (q.options && q.options[2])).trim(),
            (q.option_d || q.optionD || q.d || (q.options && q.options[3])).trim()
          ],
          correctAnswer: correctIndex,
          questionType: 'MCQ',
          marks: 1,
        };
      });

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

/**
 * Evaluate a subjective answer
 * @param {string} question - The question text
 * @param {string} modelAnswer - The expected model answer
 * @param {string} studentAnswer - The student's typed answer
 * @param {number} maxMarks - The maximum marks available for this question
 * @returns {Promise<{score: number, feedback: string}>}
 */
const evaluateSubjectiveAnswer = async (question, modelAnswer, studentAnswer, maxMarks = 5) => {
  const prompt = `You are an expert teacher grading an exam.
You must grade the student's answer to the following question.

QUESTION: ${question}
MODEL ANSWER (Expected Points): ${modelAnswer}
STUDENT ANSWER: ${studentAnswer || "(No answer provided)"}

You must assign a score from 0 to ${maxMarks} (integers or half marks). 
Also provide brief, constructive feedback on why this score was awarded.

IMPORTANT: Return ONLY a valid JSON object. Do not include any text before or after the JSON.
{
  "score": <number>,
  "feedback": "<string>"
}
`;

  try {
    const response = await axios.post(config.ollama.apiUrl, {
      model: config.ollama.model,
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.1, // Low temperature for more consistent grading
        top_p: 0.9,
      },
    }, {
      timeout: 60000, // 1 minute timeout per question
    });

    const jsonMatch = response.data.response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON object found in Ollama grading response');
    }

    const result = JSON.parse(jsonMatch[0]);
    return {
      score: Number(result.score) || 0,
      feedback: result.feedback || 'Graded by AI.'
    };
  } catch (error) {
    logger.error('Failed to grade subjective answer with Ollama:', error.message);
    return {
      score: 0,
      feedback: 'AI grading failed. Please review manually.'
    };
  }
};

module.exports = {
  generateQuestions,
  checkAvailability,
  getAvailableModels,
  evaluateSubjectiveAnswer,
};
