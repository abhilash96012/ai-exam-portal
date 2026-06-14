import api from "./api";

// Start or resume an exam attempt for a given exam
export const startExam = async (examId: string) => {
  const response = await api.post(`/student/exams/${examId}/start`);
  // Backend shape: { success, status, message, data: { attempt, exam, questions } }
  return response.data.data;
};

// Submit an attempt with all answers
export const submitAttempt = async (
  attemptId: string,
  answers: { questionId: string; selectedOption: string }[],
) => {
  const response = await api.post(`/student/attempts/${attemptId}/submit`, {
    answers,
  });
  // Backend wraps payload as { success, status, message, data }
  return response.data.data;
};

// Save a single answer for an attempt (per-question save)
export const saveAnswer = async (
  attemptId: string,
  payload: { questionId: string; selectedOption: string },
) => {
  const response = await api.post(
    `/student/attempts/${attemptId}/answer`,
    payload,
  );
  return response.data.data;
};

export default {
  startExam,
  submitAttempt,
  saveAnswer,
};