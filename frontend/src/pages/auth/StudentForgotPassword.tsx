import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Loader, RotateCcw } from "lucide-react";
import studentAuthService from "../../services/studentAuthService";

const StudentForgotPassword: React.FC = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState<"email" | "verify">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [timeLeft, setTimeLeft] = useState(600);
  const [timerId, setTimerId] = useState<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerId) {
        window.clearInterval(timerId);
      }
    };
  }, [timerId]);

  const startTimer = () => {
    if (timerId) {
      window.clearInterval(timerId);
    }

    setTimeLeft(600);
    const id = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setTimerId(id);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await studentAuthService.sendForgotPasswordOTP(email);
      setSuccessMessage(response.message || "If your account exists, OTP has been sent.");
      setStep("verify");
      startTimer();
    } catch (err: any) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otp.length !== 6) {
      setError("Please enter valid 6-digit OTP");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await studentAuthService.verifyForgotPasswordOTPAndReset(
        email,
        otp,
        password,
        confirmPassword,
      );

      setSuccessMessage(response.message || "Password reset successful.");

      navigate("/login", {
        replace: true,
        state: { passwordReset: true },
      });
    } catch (err: any) {
      setError(err.message || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await studentAuthService.resendForgotPasswordOTP(email);
      setSuccessMessage(response.message || "OTP resent successfully");
      setOtp("");
      startTimer();
    } catch (err: any) {
      setError(err.message || "Failed to resend OTP");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Lock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Forgot Password</h1>
          <p className="text-sm text-gray-600 mt-2">
            {step === "email"
              ? "Enter your student email to receive OTP"
              : "Enter OTP and set your new password"}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-lg border border-green-200 bg-green-50 text-sm text-green-700">
            {successMessage}
          </div>
        )}

        {step === "email" ? (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                placeholder="student email"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-60"
            >
              {isLoading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyAndReset} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                readOnly
                className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">OTP (6 digits)</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                  setError(null);
                }}
                placeholder="000000"
                maxLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center tracking-widest"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                placeholder="At least 6 characters"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError(null);
                }}
                placeholder="Re-enter password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-sm text-yellow-800 text-center">
              OTP expires in {formatTime(timeLeft)}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-60"
            >
              {isLoading ? "Resetting..." : "Verify OTP and Reset Password"}
            </button>

            <button
              type="button"
              onClick={handleResend}
              disabled={isLoading || timeLeft > 0}
              className="w-full py-2 rounded-lg border border-blue-300 text-blue-700 hover:bg-blue-50 disabled:opacity-60 inline-flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Resend OTP
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="text-sm text-blue-600 hover:underline"
          >
            Back to Login
          </button>
        </div>

        {isLoading && (
          <div className="mt-4 text-center text-sm text-gray-500 inline-flex items-center justify-center w-full gap-2">
            <Loader className="w-4 h-4 animate-spin" />
            Please wait...
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentForgotPassword;
