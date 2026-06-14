import api from "./api";
import type {
  AdminDashboardStats,
  PlatformAnalytics,
  SyllabusActivityItem,
  SyllabusItem,
  SyllabusLibraryResponse,
  SyllabusOptions,
  SyllabusStatus,
  StudentMasterRecord,
  SystemSettings,
  TeacherInvitation,
} from "../types/admin.types";

const getDashboardStats = async (): Promise<AdminDashboardStats> => {
  const response = await api.get("/admin/dashboard");
  return response.data.data;
};

const getStudents = async (search?: string): Promise<StudentMasterRecord[]> => {
  const response = await api.get("/admin/students", {
    params: search ? { search } : undefined,
  });
  return response.data.data.students || [];
};

const uploadStudentsCsv = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/admin/students/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data.data as {
    totalProcessed: number;
    insertedCount: number;
    updatedCount: number;
  };
};

const createStudent = async (payload: {
  registration_number: string;
  name: string;
  email: string;
  department: string;
  branch?: string;
}): Promise<StudentMasterRecord> => {
  const response = await api.post("/admin/students", payload);
  return response.data.data.student;
};

const updateStudent = async (
  studentId: string,
  payload: {
    registrationNumber?: string;
    name?: string;
    email?: string;
    branch?: string;
    department?: string;
  },
): Promise<StudentMasterRecord> => {
  const response = await api.put(`/admin/students/${studentId}`, payload);
  return response.data.data.student;
};

const deleteStudent = async (studentId: string) => {
  const response = await api.delete(`/admin/students/${studentId}`);
  return response.data;
};

const inviteTeacher = async (payload: { name: string; email: string }) => {
  const response = await api.post("/admin/teachers/invite", payload);
  return response.data.data as {
    invitation: TeacherInvitation;
    inviteLink: string;
    emailDelivered: boolean;
  };
};

const getTeacherInvitations = async (): Promise<TeacherInvitation[]> => {
  const response = await api.get("/admin/teachers");
  return response.data.data.invitations || [];
};

const getTeacherInviteDetails = async (token: string) => {
  const response = await api.get("/admin/teachers/invite-details", {
    params: { token },
  });

  return response.data.data as {
    name: string;
    email: string;
    expiresAt: string;
  };
};

const completeTeacherInvite = async (payload: {
  token: string;
  password: string;
  confirmPassword: string;
}) => {
  const response = await api.post("/admin/teachers/complete-invite", payload);
  return response.data.data;
};

const getAnalytics = async (): Promise<PlatformAnalytics> => {
  const response = await api.get("/admin/analytics");
  return response.data.data;
};

const uploadSyllabus = async (payload: {
  subject: string;
  branch: string;
  department: string;
  year: string;
  file: File;
}): Promise<SyllabusItem> => {
  const formData = new FormData();
  formData.append("subject", payload.subject);
  formData.append("branch", payload.branch);
  formData.append("department", payload.department);
  formData.append("year", payload.year);
  formData.append("syllabus", payload.file);

  const response = await api.post("/admin/syllabus", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data.data.syllabus;
};

const getSyllabusLibrary = async (params?: {
  search?: string;
  branch?: string;
  department?: string;
  year?: string;
  status?: SyllabusStatus;
  page?: number;
  limit?: number;
}): Promise<SyllabusLibraryResponse> => {
  const response = await api.get("/admin/syllabus", { params });
  return response.data.data;
};

const updateSyllabusStatus = async (
  syllabusId: string,
  status: SyllabusStatus,
): Promise<SyllabusItem> => {
  const response = await api.patch(`/admin/syllabus/${syllabusId}/status`, {
    status,
  });

  return response.data.data.syllabus;
};

const deleteSyllabus = async (syllabusId: string): Promise<void> => {
  await api.delete(`/admin/syllabus/${syllabusId}`);
};

const getSyllabusOptions = async (): Promise<SyllabusOptions> => {
  const response = await api.get("/admin/syllabus/options");
  return response.data.data;
};

const getSyllabusActivity = async (
  limit = 10,
): Promise<SyllabusActivityItem[]> => {
  const response = await api.get("/admin/syllabus/activity", {
    params: { limit },
  });

  return response.data.data.activity || [];
};

const downloadSyllabus = async (
  syllabusId: string,
): Promise<{ blob: Blob; filename: string }> => {
  const response = await api.get(`/admin/syllabus/${syllabusId}/download`, {
    responseType: "blob",
  });

  const disposition = String(response.headers["content-disposition"] || "");
  const encodedMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  const plainMatch = disposition.match(/filename="?([^";]+)"?/i);

  const filename = encodedMatch?.[1]
    ? decodeURIComponent(encodedMatch[1])
    : plainMatch?.[1] || "syllabus";

  return {
    blob: response.data as Blob,
    filename,
  };
};

const getSystemSettings = async (): Promise<SystemSettings> => {
  const response = await api.get("/admin/settings/system");
  return response.data.data.settings;
};

const updateSystemSettings = async (
  payload: Partial<SystemSettings>,
): Promise<SystemSettings> => {
  const response = await api.put("/admin/settings/system", payload);
  return response.data.data.settings;
};

export default {
  getDashboardStats,
  getStudents,
  uploadStudentsCsv,
  createStudent,
  updateStudent,
  deleteStudent,
  inviteTeacher,
  getTeacherInvitations,
  getTeacherInviteDetails,
  completeTeacherInvite,
  getAnalytics,
  uploadSyllabus,
  getSyllabusLibrary,
  updateSyllabusStatus,
  deleteSyllabus,
  getSyllabusOptions,
  getSyllabusActivity,
  downloadSyllabus,
  getSystemSettings,
  updateSystemSettings,
};
