const db = require('../config/database');
const { sendSuccess } = require('../utils/response');

const getTeacherAnalytics = async (req, res, next) => {
  try {
    const teacherId = req.user.id;

    // 1. Get total exams created by this teacher
    const examsResult = await db.query(
      'SELECT id, title, total_marks, is_published FROM exams WHERE created_by = $1',
      [teacherId]
    );
    const exams = examsResult.rows;
    const totalExams = exams.length;
    const publishedExams = exams.filter(e => e.is_published).length;

    // 2. Get all attempts for these exams
    const attemptsResult = await db.query(
      `SELECT a.id, a.exam_id, a.total_score, a.status, e.title, e.total_marks 
       FROM exam_attempts a 
       JOIN exams e ON a.exam_id = e.id 
       WHERE e.created_by = $1 AND a.status = 'SUBMITTED'`,
      [teacherId]
    );
    const attempts = attemptsResult.rows;
    const totalAttempts = attempts.length;

    // 3. Calculate average score
    let averageScore = 0;
    let averagePercentage = 0;
    
    if (totalAttempts > 0) {
      const totalScoreSum = attempts.reduce((sum, a) => sum + Number(a.total_score), 0);
      averageScore = totalScoreSum / totalAttempts;
      
      const totalMaxMarksSum = attempts.reduce((sum, a) => sum + Number(a.total_marks), 0);
      if (totalMaxMarksSum > 0) {
        averagePercentage = (totalScoreSum / totalMaxMarksSum) * 100;
      }
    }

    // 4. Calculate pass/fail (assuming 40% is pass)
    let passed = 0;
    let failed = 0;
    
    attempts.forEach(a => {
      const percentage = (Number(a.total_score) / Number(a.total_marks)) * 100;
      if (percentage >= 40) passed++;
      else failed++;
    });

    // 5. Exam Performance Comparison (for Bar Chart)
    // Group attempts by exam_id to get average score per exam
    const examPerformanceMap = {};
    attempts.forEach(a => {
      if (!examPerformanceMap[a.exam_id]) {
        examPerformanceMap[a.exam_id] = {
          name: a.title,
          totalScore: 0,
          count: 0,
          maxMarks: Number(a.total_marks)
        };
      }
      examPerformanceMap[a.exam_id].totalScore += Number(a.total_score);
      examPerformanceMap[a.exam_id].count += 1;
    });

    const examPerformanceData = Object.keys(examPerformanceMap).map(examId => {
      const data = examPerformanceMap[examId];
      const avgScore = data.totalScore / data.count;
      const percentage = (avgScore / data.maxMarks) * 100;
      return {
        name: data.name.substring(0, 20) + (data.name.length > 20 ? '...' : ''), // truncate for chart
        averageScore: Math.round(percentage) // Return percentage for normalized comparison
      };
    });

    sendSuccess(res, 200, 'Analytics fetched successfully', {
      kpi: {
        totalExams,
        publishedExams,
        totalAttempts,
        averagePercentage: Math.round(averagePercentage),
        passRate: totalAttempts > 0 ? Math.round((passed / totalAttempts) * 100) : 0
      },
      examPerformanceData,
      passFailData: [
        { name: 'Passed', value: passed },
        { name: 'Failed', value: failed }
      ]
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTeacherAnalytics
};
