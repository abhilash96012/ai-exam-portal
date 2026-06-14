import api from "./api";

// All exam-related API calls are centralized here.
// Request/response shapes are kept flexible by not
// enforcing strict typings on payloads.

// TEACHER - EXAMS

export const createExam = async (payload: any) => {
  const response = await api.post("/exams", payload);
  return response.data;
};

export const getTeacherExams = async (params?: any) => {
  const response = await api.get("/exams", { params });
  // Backend wraps payload as { success, status, message, data: { exams: [...] } }
  const exams = response.data.data?.exams ?? [];

  // Normalise into the simpler shape the teacher UI expects
  return exams.map((exam: any) => ({
    id: exam.id,
    title: exam.title,
    subject: exam.description || "General",
    status: exam.status,
    // Keep original exam in case callers need extra fields
    _raw: exam,
  }));
};

export const getExamById = async (examId: string) => {
  const response = await api.get(`/exams/${examId}`);
  return response.data;
};

export const updateExam = async (examId: string, payload: any) => {
  const response = await api.put(`/exams/${examId}`, payload);
  return response.data;
};

export const deleteExam = async (examId: string) => {
  const response = await api.delete(`/exams/${examId}`);
  return response.data;
};

export const publishExam = async (examId: string, payload?: any) => {
  const response = await api.post(`/exams/${examId}/publish`, payload);
  return response.data;
};

export const createQuestionsBulk = async (examId: string, questions: any[]) => {
  const response = await api.post("/questions/bulk", {
    examId,
    questions,
  });
  return response.data;
};

export const uploadSyllabus = async (
  examId: string,
  formData: FormData,
  config?: { [key: string]: any }
) => {
  const response = await api.post(`/exams/${examId}/syllabus`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    ...(config || {}),
  });
  // Backend wraps payload as { success, status, message, data }
  return response.data.data;
};

export const generateQuestions = async (examId: string, payload?: any) => {
  const response = await api.post(
    `/exams/${examId}/generate-questions`,
    payload || {}
  );
  // Unwrap to return the data payload ({ questions, ... }) directly
  return response.data.data;
};

export const getExamStatistics = async (examId: string, params?: any) => {
  const response = await api.get(`/exams/${examId}/statistics`, { params });
  return response.data;
};

// STUDENT - EXAMS

export const getStudentExams = async (params?: any) => {
  const response = await api.get("/student/exams", { params });
  // Backend wraps payload as { success, status, message, data: { exams: [...] } }
  const exams = response.data.data?.exams ?? [];

  // Normalise into the simpler shape the student UI expects
  return exams.map((exam: any) => ({
    id: exam.id,
    title: exam.title,
    subject: exam.description || "General",
    // UI uses `duration` and `totalQuestions`; backend sends camelCase fields
    duration: exam.durationMinutes,
    totalQuestions: exam.totalQuestions,
    // Map backend status / attempt info to high-level UI states
    status:
      exam.attemptStatus === "SUBMITTED"
        ? "completed"
        : "available",
    deadline: exam.endTime || null,
    // Keep original exam in case callers need extra fields
    _raw: exam,
  }));
};

export default {
  // teacher
  createExam,
  getTeacherExams,
  getExamById,
  updateExam,
  deleteExam,
  publishExam,
  createQuestionsBulk,
  uploadSyllabus,
  generateQuestions,
  getExamStatistics,
  // student
  getStudentExams,
};