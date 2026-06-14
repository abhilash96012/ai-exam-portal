import api from "./api";

// Question CRUD for teacher exam management

export interface QuestionPayload {
  examId: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: "A" | "B" | "C" | "D";
  marks?: number;
  explanation?: string | null;
}

export const getExamQuestions = async (examId: string) => {
  const response = await api.get(`/questions/exam/${examId}`);
  return response.data.data?.questions ?? [];
};

export const createQuestion = async (payload: QuestionPayload) => {
  const response = await api.post("/questions", payload);
  return response.data.data?.question ?? response.data.data;
};

export const updateQuestion = async (
  questionId: string,
  payload: Partial<QuestionPayload>,
) => {
  const response = await api.put(`/questions/${questionId}`, payload);
  return response.data.data?.question ?? response.data.data;
};

export const deleteQuestion = async (questionId: string) => {
  await api.delete(`/questions/${questionId}`);
};

export const deleteExamQuestions = async (examId: string) => {
  await api.delete(`/questions/exam/${examId}`);
};

export default {
  getExamQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  deleteExamQuestions,
};
