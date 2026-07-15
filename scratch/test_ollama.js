const ollamaService = require('../backend/services/ollamaService');
const config = require('../backend/config');

(async () => {
  try {
    console.log('Testing Ollama MCQ Generation...');
    const questions = await ollamaService.generateQuestions(
      'Python is a dynamically typed programming language created by Guido van Rossum.',
      2,
      'Python',
      'Medium',
      'MCQ'
    );
    console.log('Final output array length:', questions.length);
    console.log('Final output:', JSON.stringify(questions, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
})();
