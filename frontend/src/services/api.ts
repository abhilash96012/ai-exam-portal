import axios from "axios";

const AUTH_STORAGE_KEY = "authUserState";

// Central axios instance for the app
const api = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true,
});

// Attach JWT token from localStorage on every request
api.interceptors.request.use((config) => {
  try {
    const token =
      localStorage.getItem("authToken") ||
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken");

    if (token) {
      config.headers = config.headers || {};
      // Adjust scheme/key as per backend implementation if needed
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // localStorage may be unavailable in some environments; fail silently
  }

  return config;
});

// Global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const backendMessage = error?.response?.data?.message;

    // If auth is missing/invalid, clear tokens and redirect to login
    if (status === 401) {
      try {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem("authToken");
        localStorage.removeItem("token");
        localStorage.removeItem("accessToken");
      } catch {
        // ignore
      }

      if (typeof window !== "undefined") {
        if (window.location.pathname !== "/login") {
          window.location.replace("/login");
        }
      }
    }

    const normalizedError = new Error(
      backendMessage || error.message || "Something went wrong"
    ) as Error & { status?: number; raw?: unknown };

    if (status) {
      normalizedError.status = status;
    }
    normalizedError.raw = error;

    // Re-throw normalized error so callers can handle it
    return Promise.reject(normalizedError);
  }
);

export default api;