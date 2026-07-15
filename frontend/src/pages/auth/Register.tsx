import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import authService from "../../services/authService";
import studentAuthService from "../../services/studentAuthService";

const Register: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [collegeId, setCollegeId] = useState("");
  const [newCollegeName, setNewCollegeName] = useState("");
  const [newCollegeDomain, setNewCollegeDomain] = useState("");
  const [colleges, setColleges] = useState<{ id: number; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const role = location.state?.role || "ADMIN";

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

  const validate = (): boolean => {
    if (!name.trim() || !email.trim() || !password || !confirmPassword || !collegeId) {
      setError("All fields are required");
      return false;
    }

    if (collegeId === "new") {
      if (!newCollegeName.trim() || !newCollegeDomain.trim()) {
        setError("New college name and domain suffix are required");
        return false;
      }
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
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
      if (role === "TEACHER") {
        await authService.registerTeacher({
          name: name.trim(),
          email: email.trim(),
          password,
          collegeId: Number(collegeId),
        });
      } else {
        await authService.registerAdmin({
          name: name.trim(),
          email: email.trim(),
          password,
          collegeId: collegeId === "new" ? "new" : Number(collegeId),
          newCollegeName: collegeId === "new" ? newCollegeName.trim() : undefined,
          newCollegeDomain: collegeId === "new" ? newCollegeDomain.trim() : undefined,
        });
      }

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
          Create {role === "TEACHER" ? "Teacher" : "Admin"} Account
        </h1>
        <p className="text-center text-gray-500 text-sm mb-6">
          {role === "TEACHER" 
            ? "Register as a teacher to manage your exams" 
            : "Register as an administrator to manage your college portal"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@college.edu"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Select Your College
            </label>
            <select
              value={collegeId}
              onChange={(e) => setCollegeId(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              required
            >
              <option value="">Choose a college...</option>
              {colleges.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.name}
                </option>
              ))}
              {role === "ADMIN" && <option value="new">+ Register a new college...</option>}
            </select>
          </div>

          {collegeId === "new" && (
            <div className="space-y-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-xs font-semibold text-blue-800">
                Register New College:
              </p>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  College Name *
                </label>
                <input
                  type="text"
                  value={newCollegeName}
                  onChange={(e) => setNewCollegeName(e.target.value)}
                  placeholder="e.g. Stanford University"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Email Domain Suffix *
                </label>
                <input
                  type="text"
                  value={newCollegeDomain}
                  onChange={(e) => setNewCollegeDomain(e.target.value)}
                  placeholder="e.g. stanford.edu"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm bg-white"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm mt-4"
          >
            {isLoading ? "Creating account..." : `Create ${role === "TEACHER" ? "Teacher" : "Admin"} Account`}
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
