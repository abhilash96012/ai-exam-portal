import api from "./api";

// STUDENT RESULTS

export const getStudentResults = async () => {
  const response = await api.get("/student/results");
  // Backend: { success, status, message, data: { results: [...] } }
  return response.data.data.results ?? [];
};

export const getStudentResultByAttempt = async (attemptId: string) => {
  const response = await api.get(`/student/results/${attemptId}`);
  // Returns { result, answers }
  return response.data.data;
};

// TEACHER RESULTS

export const getTeacherResultsSummary = async () => {
  const response = await api.get("/teacher/results");
  // { exams: [...] }
  return response.data.data.exams ?? [];
};

export const getTeacherExamResults = async (examId: string) => {
  const response = await api.get(`/teacher/exams/${examId}/results`);
  // { exam, statistics, results }
  return response.data.data;
};

export const getResultDetails = async (attemptId: string) => {
  const response = await api.get(`/teacher/results/${attemptId}`);
  // Same shape as student getResultDetails
  return response.data.data;
};

export default {
  getStudentResults,
  getStudentResultByAttempt,
  getTeacherResultsSummary,
  getTeacherExamResults,
  getResultDetails,
};
