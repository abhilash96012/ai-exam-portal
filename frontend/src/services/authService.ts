import api from "./api";

export type UserRole = "ADMIN" | "TEACHER" | "STUDENT";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  branch?: string | null;
  year?: number | null;
  registerNumber?: string | null;
  profileCompleted?: boolean;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken?: string;
  refreshToken?: string;
  [key: string]: any;
}

export interface LoginPayload {
  email: string;
  password: string;
  role?: UserRole; // optional, backend will infer when not provided
}

export interface RegisterStudentPayload {
  name: string;
  email: string;
  password: string;
  register_number: string;
  branch: string;
  year: number;
  role?: "STUDENT";
}

const login = async (payload: LoginPayload): Promise<AuthResponse> => {
  const response = await api.post("/auth/login", payload);
  // Backend wraps payload under `data`, so unwrap here
  return response.data.data;
};

const registerStudent = async (
  payload: RegisterStudentPayload,
): Promise<AuthResponse> => {
  const response = await api.post("/auth/register", {
    ...payload,
    role: "STUDENT",
  });
  // Same response wrapper as login
  return response.data.data;
};

const completeStudentProfile = async (payload: {
  name: string;
  branch?: string | null;
  year?: number | null;
  registerNumber: string;
}): Promise<AuthUser> => {
  const response = await api.put("/auth/complete-profile", payload);
  return response.data.data.user as AuthUser;
};

const logout = async () => {
  await api.post("/auth/logout");
  return true;
};

export default {
  login,
  registerStudent,
  completeStudentProfile,
  logout,
};