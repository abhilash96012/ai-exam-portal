export type ExamStatus =
  | "DRAFT"
  | "GENERATED"
  | "PUBLISHED"
  | "ACTIVE"
  | "SUBMITTED"
  | "EVALUATED";

export interface Exam {
  id: string;
  title: string;
  duration: number; // minutes
  totalQuestions: number;
  status: ExamStatus;
  createdBy: string; // teacherId
  createdAt: string;
}