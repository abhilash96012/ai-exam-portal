const axios = require('axios');

async function testN8n() {
  const url = 'http://localhost:5678/webhook/upload-syllabus';
  const payload = {
    type: 'teacher',
    subject: 'java',
    branch: 'CSE',
    department: 'CSE',
    year: '1-1',
    questionType: 'Descriptive',
    difficulty: 'Easy',
    count: 5,
    prompt: 'generate 5 questions from unit-1',
    data: {
      text: 'Java is a programming language. Unit 1: Introduction to Java. History of Java, features of Java.'
    }
  };

  try {
    console.log('Sending request to n8n...');
    const response = await axios.post(url, payload);
    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response Data:', error.response.data);
    }
  }
}

testN8n();
