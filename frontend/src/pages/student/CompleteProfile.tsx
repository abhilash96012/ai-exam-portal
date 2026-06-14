import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import authService from "../../services/authService";
import Button from "../../components/common/Button";

const BRANCH_OPTIONS = ["CSD", "CSE", "AIDS", "IT", "ECE", "EEE"] as const;
const YEAR_OPTIONS = [1, 2, 3, 4] as const;

const CompleteProfile: React.FC = () => {
  const navigate = useNavigate();
  const { user, completeProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    registrationNumber: user?.registerNumber || "",
    branch: user?.branch || "",
    year: user?.year ? String(user.year) : "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.branch) {
      setError("Please select your branch");
      return;
    }

    const numericYear = Number(formData.year);
    if (!numericYear || numericYear < 1 || numericYear > 4) {
      setError("Please select a valid year");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (!user) return;

      const updatedUser = await authService.completeStudentProfile({
        name: formData.fullName,
        branch: formData.branch,
        year: numericYear,
        registerNumber: formData.registrationNumber,
      });

      completeProfile({
        name: updatedUser.name,
        branch: updatedUser.branch ?? formData.branch,
        year: updatedUser.year ?? numericYear,
        registerNumber: updatedUser.registerNumber ?? formData.registrationNumber,
      });
      navigate("/student/dashboard");
    } catch (err: any) {
      setError(err?.message || "Failed to complete profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-6 sm:py-12 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-4 sm:p-8">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Complete Your Profile
          </h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">
            Please fill in your details to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
              className="w-full px-3 py-2.5 sm:py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Registration Number
            </label>
            <input
              type="text"
              name="registrationNumber"
              value={formData.registrationNumber}
              onChange={handleChange}
              required
              className="w-full px-3 py-2.5 sm:py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              placeholder="Enter your registration number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Branch
            </label>
            <select
              name="branch"
              value={formData.branch}
              onChange={handleChange}
              required
              className="w-full px-3 py-2.5 sm:py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base bg-white"
            >
              <option value="">Select your branch</option>
              {BRANCH_OPTIONS.map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Year
            </label>
            <select
              name="year"
              value={formData.year}
              onChange={handleChange}
              required
              className="w-full px-3 py-2.5 sm:py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base bg-white"
            >
              <option value="">Select your year</option>
              {YEAR_OPTIONS.map((year) => (
                <option key={year} value={year}>
                  Year {year}
                </option>
              ))}
            </select>
          </div>

          <Button type="submit" isLoading={isLoading} fullWidth>
            Complete Profile
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfile;
