import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import adminService from "../../services/adminService";

interface InviteDetails {
  name: string;
  email: string;
  expiresAt: string;
}

const TeacherSetupPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [details, setDetails] = useState<InviteDetails | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const loadInvite = async () => {
      if (!token) {
        setError("Invitation token is missing");
        setIsLoading(false);
        return;
      }

      try {
        const data = await adminService.getTeacherInviteDetails(token);
        setDetails(data);
      } catch (err: any) {
        setError(err?.message || "Invalid or expired invitation");
      } finally {
        setIsLoading(false);
      }
    };

    loadInvite();
  }, [token]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!token) {
      setError("Invitation token is missing");
      return;
    }

    if (!password.trim() || !confirmPassword.trim()) {
      setError("Password and confirm password are required");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await adminService.completeTeacherInvite({
        token,
        password,
        confirmPassword,
      });
      setSuccess("Your teacher account is ready. Please login to continue.");
    } catch (err: any) {
      setError(err?.message || "Failed to complete teacher setup");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl bg-white border border-gray-200 p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Set Teacher Password
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Complete your invitation and activate your account.
        </p>

        {isLoading && (
          <div className="text-sm text-gray-600">Validating invitation...</div>
        )}

        {!isLoading && details && (
          <>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 mb-4 text-sm">
              <p className="text-gray-600">Name</p>
              <p className="font-medium text-gray-900">{details.name}</p>
              <p className="text-gray-600 mt-2">Email</p>
              <p className="font-medium text-gray-900">{details.email}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                required
              />
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                required
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-blue-600 text-white px-4 py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
              >
                {isSubmitting ? "Setting up..." : "Create Teacher Account"}
              </button>
            </form>
          </>
        )}

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2.5">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-4 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm px-3 py-2.5">
            {success}
          </div>
        )}

        {!isLoading && (
          <div className="mt-5 text-sm">
            <Link
              to="/login"
              className="text-blue-600 hover:underline font-medium"
            >
              Back to login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherSetupPassword;
