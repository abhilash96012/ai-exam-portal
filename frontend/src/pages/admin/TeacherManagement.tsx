import React, { useEffect, useState } from "react";
import adminService from "../../services/adminService";
import type { TeacherInvitation } from "../../types/admin.types";
import Loader from "../../components/common/Loader";

const TeacherManagement: React.FC = () => {
  const [invitations, setInvitations] = useState<TeacherInvitation[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadInvites = async () => {
    const data = await adminService.getTeacherInvitations();
    setInvitations(data);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        await loadInvites();
      } catch (err: any) {
        setError(err?.message || "Failed to load teacher invitations");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleInvite = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!name.trim() || !email.trim()) {
      setError("Name and email are required");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const result = await adminService.inviteTeacher({
        name: name.trim(),
        email: email.trim(),
      });

      await loadInvites();
      setName("");
      setEmail("");

      setMessage(
        result.emailDelivered
          ? "Invitation email sent successfully"
          : `Invitation created. Share setup link: ${result.inviteLink}`,
      );
    } catch (err: any) {
      setError(err?.message || "Failed to send invitation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const badgeClass = (status: TeacherInvitation["status"]) => {
    if (status === "ACCEPTED") {
      return "bg-green-100 text-green-700 border border-green-200";
    }

    if (status === "EXPIRED") {
      return "bg-red-100 text-red-700 border border-red-200";
    }

    return "bg-yellow-100 text-yellow-700 border border-yellow-200";
  };

  if (isLoading) {
    return <Loader fullScreen text="Loading teacher management..." />;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Teacher Management</h1>
        <p className="text-sm text-gray-500 mt-1">
          Invite teachers and track invitation status.
        </p>
      </div>

      <form
        onSubmit={handleInvite}
        className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6 space-y-4"
      >
        <h2 className="text-lg font-semibold text-gray-900">Invite Teacher</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Teacher Name"
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
            required
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Teacher Email"
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
            required
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
        >
          {isSubmitting ? "Sending Invite..." : "Invite Teacher"}
        </button>
      </form>

      {message && (
        <div className="rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Invited Teachers
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Expires
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invitations.map((invite) => (
                <tr key={invite.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {invite.name}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{invite.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${badgeClass(invite.status)}`}
                    >
                      {invite.status.charAt(0) +
                        invite.status.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {new Date(invite.expires_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {invitations.length === 0 && (
          <p className="p-6 text-center text-sm text-gray-500">
            No teacher invitations yet.
          </p>
        )}
      </div>
    </div>
  );
};

export default TeacherManagement;
