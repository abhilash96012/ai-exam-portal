export interface Attempt {
  id: string;
  examId: string;
  studentId: string;
  answers: Record<number, number>; // questionIndex -> optionIndex
  score: number;
  startedAt: string;
  submittedAt?: string;
}