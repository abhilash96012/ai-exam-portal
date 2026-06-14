import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import authService from "../../services/authService";
import type { UserRole } from "../../services/authService";

const Login: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [studentEmail, setStudentEmail] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("STUDENT");

  const { login, user, isAuthenticated, profileCompleted } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const successMessage =
    (location.state as any)?.registered === true
      ? "Account created successfully. Please sign in."
      : (location.state as any)?.passwordReset === true
        ? "Password reset successful. Please sign in with your new password."
        : null;

  // Navigate after auth state is updated
  useEffect(() => {
    const token =
      localStorage.getItem("authToken") ||
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken");

    if (isAuthenticated && user && token) {
      if (user.role === "ADMIN") {
        navigate("/admin/dashboard", { replace: true });
      } else if (user.role === "TEACHER") {
        navigate("/teacher/dashboard", { replace: true });
      } else if (profileCompleted) {
        navigate("/student/dashboard", { replace: true });
      } else {
        navigate("/student/complete-profile", { replace: true });
      }
    }
  }, [isAuthenticated, user, profileCompleted, navigate]);

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!studentEmail.trim() || !studentPassword.trim()) {
      setError("Please enter email and password");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await authService.login({
        email: studentEmail,
        password: studentPassword,
        role: selectedRole,
      });

      if (data.accessToken) {
        localStorage.setItem("authToken", data.accessToken);
      }

      login({
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        branch: data.user.branch ?? null,
        year: data.user.year ?? null,
        registerNumber: data.user.registerNumber ?? null,
        profileCompleted: data.user.profileCompleted,
      });
    } catch (err: any) {
      setError(err?.message || "Invalid email or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-xl sm:text-2xl font-bold text-center text-gray-800 mb-2">
          Welcome Back
        </h1>
        <p className="text-center text-gray-500 text-sm mb-6">
          Sign in to continue
        </p>

        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-3">
              Sign in as student, teacher, or admin
            </p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {(["STUDENT", "TEACHER", "ADMIN"] as UserRole[]).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => {
                    setSelectedRole(role);
                    setError(null);
                    setStudentEmail("");
                    setStudentPassword("");
                  }}
                  className={`rounded-md px-2 py-2 text-xs font-medium border transition-colors ${
                    selectedRole === role
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
            <form onSubmit={handleStudentLogin} className="space-y-3">
              {/* Email Field (always shown) */}
              <div>
                <input
                  type="email"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  placeholder={`${selectedRole.toLowerCase()} email`}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              <div>
                <input
                  type="password"
                  value={studentPassword}
                  onChange={(e) => setStudentPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            {/* Create Account Link - Only for Teacher/Admin */}
            {selectedRole !== "STUDENT" && (
              <p className="mt-3 text-xs text-gray-500 text-center">
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/register")}
                  className="text-blue-600 hover:underline font-medium"
                >
                  Create Account
                </button>
              </p>
            )}

            {/* Student Register Link */}
            {selectedRole === "STUDENT" && (
              <div className="mt-3 text-xs text-gray-500 text-center space-y-2">
                <p>
                  First time?{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/student/register")}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Register with Email
                  </button>
                </p>
                <p>
                  Forgot password?{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/student/forgot-password")}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Reset with OTP
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>

        {successMessage && !error && (
          <div className="mt-4 bg-green-50 text-green-700 p-3 rounded-lg text-sm">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <p className="mt-6 text-center text-xs text-gray-500">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default Login;
