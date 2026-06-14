/**
 * Student Registration Page
 * Student enters email to verify with OTP
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, ArrowRight, Loader } from "lucide-react";
import studentAuthService from "../../services/studentAuthService";

const StudentRegister: React.FC = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await studentAuthService.sendOTP(email);
      setSuccessMessage("OTP sent to your email! Redirecting...");
      
      // Redirect to OTP verification page after 2 seconds
      setTimeout(() => {
        navigate("/student/verify-otp", { state: { email } });
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to send OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Student Registration
          </h1>
          <p className="text-gray-600 text-sm">
            Enter your email to verify and create your account
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

        {/* Form */}
        <form onSubmit={handleSendOTP} className="space-y-6">
          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              placeholder="your.email@example.com"
              disabled={isLoading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <p className="mt-2 text-xs text-gray-500">
              Make sure this email matches your registration in our system
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !email.trim()}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
              isLoading || !email.trim()
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer hover:shadow-lg"
            }`}
          >
            {isLoading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Sending OTP...
              </>
            ) : (
              <>
                Send OTP
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-blue-600 hover:underline font-medium"
            >
              Sign In
            </button>
          </p>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-100">
          <p className="text-xs text-gray-700">
            <strong>ℹ️ Note:</strong> An OTP will be sent to your email. You'll have 10 minutes to verify it.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StudentRegister;
