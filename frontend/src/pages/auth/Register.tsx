import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../../services/authService";

const BRANCHES = ["CSD", "CSE", "AIDS", "IT", "ECE", "EEE", "MECH"];
const YEARS = [
  { value: "1", label: "1st Year" },
  { value: "2", label: "2nd Year" },
  { value: "3", label: "3rd Year" },
  { value: "4", label: "4th Year" },
];

const Register: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [registerNumber, setRegisterNumber] = useState("");
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const validate = (): boolean => {
    if (
      !name ||
      !email ||
      !password ||
      !confirmPassword ||
      !registerNumber ||
      !branch ||
      !year
    ) {
      setError("All fields are required");
      return false;
    }

    if (!email.endsWith("@gmail.com")) {
      setError("Email must be a valid Gmail address");
      return false;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    if (registerNumber.length !== 10) {
      setError("Registration number must be 10 characters");
      return false;
    }

    if (!["1", "2", "3", "4"].includes(year)) {
      setError("Please select a valid year");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);

    if (!validate()) return;

    setIsLoading(true);

    try {
      await authService.registerStudent({
        name,
        email,
        password,
        register_number: registerNumber,
        branch,
        year: Number(year),
        role: "STUDENT",
      });

      navigate("/login", { replace: true, state: { registered: true } });
    } catch (err: any) {
      setError(err?.message || "Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-xl sm:text-2xl font-bold text-center text-gray-800 mb-2">
          Create Student Account
        </h1>
        <p className="text-center text-gray-500 text-sm mb-6">
          Join to take exams and view your results
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Gmail address"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          <div>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          <div>
            <input
              type="text"
              value={registerNumber}
              onChange={(e) => setRegisterNumber(e.target.value)}
              placeholder="Registration number"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          <div>
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="">Select branch</option>
              {BRANCHES.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="">Select year</option>
              {YEARS.map((y) => (
                <option key={y.value} value={y.value}>
                  {y.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isLoading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        {error && (
          <div className="mt-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <p className="mt-6 text-center text-xs text-gray-500">
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
    </div>
  );
};

export default Register;
