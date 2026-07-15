/**
 * Student OTP Verification Page
 * Student verifies OTP and creates password
 */

import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Lock, ArrowRight, Loader, RotateCcw, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import studentAuthService from "../../services/studentAuthService";

const StudentOTPVerification: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const email = (location.state as any)?.email || "";

  const [formState, setFormState] = useState({
    otp: "",
    name: "",
    password: "",
    confirmPassword: "",
    collegeId: "",
  });

  const [colleges, setColleges] = useState<{ id: number; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [canResendOTP, setCanResendOTP] = useState(false);

  // Fetch colleges list on mount
  useEffect(() => {
    const loadColleges = async () => {
      try {
        const list = await studentAuthService.getColleges();
        setColleges(list);
      } catch (err: any) {
        console.error("Failed to load colleges:", err);
      }
    };
    loadColleges();
  }, []);

  // Redirect if no email provided
  useEffect(() => {
    if (!email) {
      navigate("/student/register");
    }
  }, [email, navigate]);

  // Timer for OTP expiration
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResendOTP(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setFormState((prev) => ({
      ...prev,
      otp: value,
    }));
    setError(null);
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formState.otp.trim() || formState.otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    if (!formState.name.trim()) {
      setError("Please enter your name");
      return;
    }

    if (!formState.collegeId) {
      setError("Please select your college");
      return;
    }

    if (!formState.password || formState.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (formState.password !== formState.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await studentAuthService.verifyOTPAndRegister(
        email,
        formState.otp,
        formState.password,
        formState.confirmPassword,
        formState.name,
        formState.collegeId ? Number(formState.collegeId) : null
      );

      if (response.data) {
        // Store tokens
        localStorage.setItem("authToken", response.data.accessToken);
        localStorage.setItem("refreshToken", response.data.refreshToken);

        // Update auth context
        login({
          id: response.data.user.id,
          name: response.data.user.name,
          email: response.data.user.email,
          role: response.data.user.role as "ADMIN" | "TEACHER" | "STUDENT",
          branch: response.data.user.branch ?? null,
          year: response.data.user.year ?? null,
          registerNumber: response.data.user.registerNumber ?? null,
          profileCompleted: response.data.user.profileCompleted,
        });

        setSuccessMessage("Account created successfully! Redirecting...");

        // Redirect to dashboard
        setTimeout(() => {
          navigate("/student/dashboard", { replace: true });
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || "Failed to verify OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await studentAuthService.resendOTP(email);
      setSuccessMessage("New OTP sent to your email!");
      setFormState((prev) => ({ ...prev, otp: "" }));
      setTimeLeft(600);
      setCanResendOTP(false);

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to resend OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!email) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Lock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Verify Your Email
          </h1>
          <p className="text-gray-600 text-sm">
            Enter the OTP sent to <strong>{email}</strong>
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 rounded-lg border border-red-200 bg-red-50">
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-4 rounded-lg border border-green-200 bg-green-50">
            <p className="text-sm text-green-700 font-medium">{successMessage}</p>
          </div>
        )}

        {/* Timer */}
        <div className="mb-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
          <p className="text-center text-sm text-yellow-800">
            OTP expires in: <strong className="text-lg">{formatTime(timeLeft)}</strong>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleVerifyOTP} className="space-y-4">
          {/* OTP Input */}
          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
              OTP (6 digits) *
            </label>
            <input
              id="otp"
              type="text"
              name="otp"
              value={formState.otp}
              onChange={handleOtpChange}
              placeholder="000000"
              maxLength={6}
              disabled={isLoading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl font-mono tracking-widest disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Name Input */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Your Name *
            </label>
            <input
              id="name"
              type="text"
              name="name"
              value={formState.name}
              onChange={handleInputChange}
              placeholder="Enter your full name"
              disabled={isLoading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* College Input */}
          <div>
            <label htmlFor="collegeId" className="block text-sm font-medium text-gray-700 mb-2">
              Select Your College *
            </label>
            <select
              id="collegeId"
              name="collegeId"
              value={formState.collegeId}
              onChange={handleInputChange}
              disabled={isLoading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Select your college</option>
              {colleges.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.name}
                </option>
              ))}
            </select>
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password *
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                value={formState.password}
                onChange={handleInputChange}
                placeholder="At least 6 characters"
                disabled={isLoading}
                className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password Input */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password *
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formState.confirmPassword}
                onChange={handleInputChange}
                placeholder="Re-enter your password"
                disabled={isLoading}
                className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Verify Button */}
          <button
            type="submit"
            disabled={isLoading || formState.otp.length !== 6}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 mt-6 ${
              isLoading || formState.otp.length !== 6
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer hover:shadow-lg"
            }`}
          >
            {isLoading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Creating Account...
              </>
            ) : (
              <>
                Create Account
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Resend OTP */}
        <div className="mt-6 text-center">
          {canResendOTP ? (
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={isLoading}
              className="text-blue-600 hover:underline font-medium flex items-center justify-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-4 h-4" />
              Resend OTP
            </button>
          ) : (
            <p className="text-sm text-gray-600">
              Didn't receive OTP? <span className="font-medium">Resend in {formatTime(timeLeft)}</span>
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            <button
              type="button"
              onClick={() => navigate("/student/register")}
              className="text-blue-600 hover:underline font-medium"
            >
              Use different email
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default StudentOTPVerification;
