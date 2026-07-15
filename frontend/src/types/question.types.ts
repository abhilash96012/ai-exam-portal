export interface Question {
  id: string;
  examId: string;
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
  questionType?: string;
  modelAnswer?: string;
}