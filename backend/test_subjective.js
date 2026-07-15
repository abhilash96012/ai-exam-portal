const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let teacherToken = '';
let studentToken = '';
let examId = '';
let attemptId = '';

async function testSubjectiveFlow() {
  try {
    console.log("1. Registering/Logging in as Teacher...");
    try {
      const tReg = await axios.post(`${BASE_URL}/auth/register`, {
        name: 'Test Teacher',
        email: 'testteacher' + Date.now() + '@example.com',
        password: 'password123',
        role: 'TEACHER',
        collegeId: 1
      });
      teacherToken = tReg.data.data.accessToken;
    } catch(e) { 
      throw new Error("Teacher registration failed: " + JSON.stringify(e.response?.data)); 
    }
    console.log("Teacher logged in.");

    console.log("2. Creating an Exam...");
    const createExamRes = await axios.post(`${BASE_URL}/exams`, {
      title: 'Subjective Test',
      duration: 60,
      total_marks: 10
    }, { headers: { Authorization: `Bearer ${teacherToken}` } });
    examId = createExamRes.data.data.exam.id;
    console.log("Exam created with ID:", examId);

    console.log("3. Inserting Subjective Questions directly into DB for speed...");
    // We will bypass generate and directly hit the database to set up a subjective question
    const { Client } = require('pg'); // wait we use pg or sqlite? we use sqlite!
    // Since we use sqlite, we can just require the local db instance
    const db = require('./config/database');
    await db.query(
      `INSERT INTO questions (exam_id, question_text, question_type, model_answer, marks) VALUES ($1, $2, $3, $4, $5)`,
      [examId, 'What is the capital of France and why is it famous?', 'SUBJECTIVE', 'The capital is Paris. It is famous for the Eiffel Tower and its rich history.', 5]
    );
    console.log("Subjective question inserted.");

    console.log("4. Publishing Exam...");
    await axios.post(`${BASE_URL}/exams/${examId}/publish`, {}, { headers: { Authorization: `Bearer ${teacherToken}` } });
    console.log("Exam published.");

    console.log("5. Logging in as Student...");
    try {
      const sReg = await axios.post(`${BASE_URL}/auth/register`, {
        name: 'Test Student',
        email: 'teststudent' + Date.now() + '@example.com',
        password: 'password123',
        role: 'STUDENT',
        collegeId: 1,
        branch: 'CSE',
        year: 1,
        section: 'A',
        register_number: 'REG' + Date.now()
      });
      studentToken = sReg.data.data.accessToken;
    } catch(e) { 
      throw new Error("Student registration failed: " + JSON.stringify(e.response?.data)); 
    }
    console.log("Student logged in.");

    console.log("6. Starting Exam...");
    const startRes = await axios.post(`${BASE_URL}/student/exams/${examId}/start`, {}, { headers: { Authorization: `Bearer ${studentToken}` } });
    attemptId = startRes.data.data.attempt.id;
    const questions = startRes.data.data.questions;
    console.log("Exam started. Attempt ID:", attemptId);
    console.log("Questions loaded:", questions);

    console.log("7. Saving Text Answer...");
    await axios.post(`${BASE_URL}/student/attempts/${attemptId}/answer`, {
      questionId: questions[0].id,
      textAnswer: "The capital is Paris. It is known for the Eiffel Tower."
    }, { headers: { Authorization: `Bearer ${studentToken}` } });
    console.log("Answer saved.");

    console.log("8. Submitting Exam (This will trigger AI Grading)...");
    const submitRes = await axios.post(`${BASE_URL}/student/attempts/${attemptId}/submit`, {
      tabSwitchCount: 0
    }, { headers: { Authorization: `Bearer ${studentToken}` } });
    console.log("Exam submitted. Score details:", submitRes.data.data);

    console.log("9. Fetching Result Details...");
    const resultRes = await axios.get(`${BASE_URL}/student/results/${attemptId}`, { headers: { Authorization: `Bearer ${studentToken}` } });
    console.log("AI Grading Result for Question:");
    const qResult = resultRes.data.data.questions[0];
    console.log("Question:", qResult.questionText);
    console.log("Your Answer:", qResult.textAnswer);
    console.log("AI Score:", qResult.studentScore, "/", qResult.marks);
    console.log("AI Feedback:", qResult.feedback);

    console.log("\n✅ ALL TESTS PASSED!");
    process.exit(0);
  } catch (error) {
    console.error("Test failed!", error.response ? error.response.data : error.message);
    process.exit(1);
  }
}

testSubjectiveFlow();
