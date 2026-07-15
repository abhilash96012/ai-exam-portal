const ollamaService = require('./services/ollamaService');

async function testGeneration() {
  try {
    const prompt = 'Generate 3 descriptive questions about SQL Joins, Normalization (1NF, 2NF, 3NF), and ACID properties. The questions should ask the student to explain the concepts with real-world examples.';
    
    console.log('Calling ollamaService.generateQuestions...');
    const questions = await ollamaService.generateQuestions(
      prompt,
      3,
      'Database Systems',
      'Medium',
      'SUBJECTIVE'
    );
    
    console.log('Resulting parsed questions:', JSON.stringify(questions, null, 2));
  } catch (error) {
    console.error('Error occurred:', error);
  }
}

testGeneration();
