export interface AdminDashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalExams: number;
  totalPublishedExams: number;
}

export interface StudentMasterRecord {
  id: string;
  registration_number: string;
  name: string;
  email?: string;
  branch: string;
  department: string;
  created_at: string;
  updated_at: string;
}

export interface TeacherInvitation {
  id: string;
  name: string;
  email: string;
  token: string;
  status: "PENDING" | "ACCEPTED" | "EXPIRED";
  expires_at: string;
  accepted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlatformAnalytics {
  totalRegisteredStudents: number;
  totalTeachers: number;
  totalExamsCreated: number;
  totalAttempts: number;
  averageScore: number;
  examsPerBranch: Array<{ branch: string; count: number }>;
  studentsPerDepartment: Array<{ department: string; count: number }>;
  passFailRatio: {
    pass: number;
    fail: number;
  };
}

export type SyllabusStatus = "UPLOADED" | "PROCESSING" | "READY";

export interface SyllabusItem {
  id: string;
  subject: string;
  branch: string;
  department: string;
  year: number;
  status: SyllabusStatus;
  filePath: string;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  uploadedBy: string;
  uploadedByName: string | null;
  uploadDate: string;
  updatedAt: string;
}

export interface SyllabusOverview {
  total_uploaded_syllabi: number;
  total_branches: number;
  total_departments: number;
  total_subjects: number;
  statusCounts: Record<SyllabusStatus, number>;
}

export interface SyllabusLibraryResponse {
  syllabi: SyllabusItem[];
  total: number;
  page: number;
  limit: number;
  overview: SyllabusOverview;
}

export interface SyllabusOptions {
  branches: string[];
  departments: string[];
  years: number[];
  subjects: string[];
}

export interface SyllabusActivityItem {
  event_type: string;
  title: string;
  event_time: string;
}

export interface SystemSettings {
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPassword: string;
  geminiApiKey: string;
  ollamaUrl: string;
  defaultQuestionCount: string;
  defaultDifficulty: "Easy" | "Medium" | "Hard";
  emailNotifications: boolean;
  updatedAt?: string;
}
