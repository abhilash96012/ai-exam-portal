import React, { useEffect, useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import adminService from "../../services/adminService";
import type { StudentMasterRecord } from "../../types/admin.types";
import Loader from "../../components/common/Loader";

const StudentManagement: React.FC = () => {
  const [students, setStudents] = useState<StudentMasterRecord[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<StudentMasterRecord | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newStudent, setNewStudent] = useState({
    registration_number: "",
    name: "",
    email: "",
    department: "",
  });

  const loadStudents = async (searchText?: string) => {
    const data = await adminService.getStudents(searchText);
    setStudents(data);
  };

  useEffect(() => {
    const initialLoad = async () => {
      try {
        await loadStudents();
      } catch (err: any) {
        setError(err?.message || "Failed to load students");
      } finally {
        setIsLoading(false);
      }
    };

    initialLoad();
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        await loadStudents(search.trim());
      } catch (err: any) {
        setError(err?.message || "Search failed");
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const handleCsvUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsUploading(true);
    setError(null);
    setMessage(null);

    try {
      const result = await adminService.uploadStudentsCsv(file);
      await loadStudents(search.trim());
      setMessage(
        `CSV synced. Processed: ${result.totalProcessed}, inserted: ${result.insertedCount}, updated: ${result.updatedCount}`,
      );
    } catch (err: any) {
      setError(err?.message || "Failed to upload CSV");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newStudent.registration_number.trim() || !newStudent.name.trim() || !newStudent.email.trim() || !newStudent.department.trim()) {
      setError("Please fill all required fields");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newStudent.email)) {
      setError("Please enter a valid email address");
      return;
    }

    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      const studentToAdd = {
        registration_number: newStudent.registration_number.trim(),
        name: newStudent.name.trim(),
        email: newStudent.email.trim(),
        branch: "",
        department: newStudent.department,
      };

      await adminService.createStudent(studentToAdd);
      
      await loadStudents(search.trim());
      setNewStudent({
        registration_number: "",
        name: "",
        email: "",
        department: "",
      });
      setShowAddForm(false);
      setMessage("Student added successfully!");
    } catch (err: any) {
      setError(err?.message || "Failed to add student");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (studentId: string) => {
    if (!window.confirm("Delete this student record?")) {
      return;
    }

    try {
      await adminService.deleteStudent(studentId);
      setStudents((prev) => prev.filter((student) => student.id !== studentId));
      setMessage("Student deleted successfully");
    } catch (err: any) {
      setError(err?.message || "Failed to delete student");
    }
  };

  const handleUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editing) {
      return;
    }

    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      const updated = await adminService.updateStudent(editing.id, {
        registrationNumber: editing.registration_number,
        name: editing.name,
        email: editing.email,
        department: editing.department,
      });

      setStudents((prev) =>
        prev.map((student) => (student.id === updated.id ? updated : student)),
      );
      setEditing(null);
      setMessage("Student updated successfully");
    } catch (err: any) {
      setError(err?.message || "Failed to update student");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resultText = useMemo(() => {
    if (!search.trim()) {
      return `${students.length} students`;
    }

    return `${students.length} results for "${search.trim()}"`;
  }, [students.length, search]);

  if (isLoading) {
    return <Loader fullScreen text="Loading students..." />;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Student Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">{resultText}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Student
          </button>
          <label className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 cursor-pointer disabled:opacity-60 transition-colors">
            {isUploading ? "Uploading..." : "Upload CSV"}
            <input
              type="file"
              accept=".csv"
              className="hidden"
              disabled={isUploading}
              onChange={handleCsvUpload}
            />
          </label>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by registration number or name"
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

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

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Registration No
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Department
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {students.map((student) => (
                <tr key={student.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {student.registration_number}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{student.name}</td>
                  <td className="px-4 py-3 text-gray-700 text-sm">{student.email || "-"}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {student.department}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditing(student)}
                        className="px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(student.id)}
                        className="px-3 py-1.5 rounded-md border border-red-300 text-red-600 hover:bg-red-50 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {students.length === 0 && (
          <p className="p-6 text-center text-sm text-gray-500">
            No students found
          </p>
        )}
      </div>

      {/* Add Student Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-xl bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Add New Student
              </h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form className="space-y-4" onSubmit={handleAddStudent}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Registration Number *
                </label>
                <input
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={newStudent.registration_number}
                  onChange={(e) =>
                    setNewStudent({
                      ...newStudent,
                      registration_number: e.target.value,
                    })
                  }
                  placeholder="e.g., CSE2024001"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student Name *
                </label>
                <input
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={newStudent.name}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, name: e.target.value })
                  }
                  placeholder="Full name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={newStudent.email}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, email: e.target.value })
                  }
                  placeholder="student@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department *
                </label>
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={newStudent.department}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, department: e.target.value })
                  }
                  required
                >
                  <option value="">Select Department</option>
                  <option value="CSE">CSE</option>
                  <option value="CSD">CSD</option>
                  <option value="CSIT">CSIT</option>
                  <option value="AIML">AIML</option>
                  <option value="AIDS">AIDS</option>
                  <option value="IT">IT</option>
                  <option value="Mechanical">Mechanical</option>
                  <option value="Civil">Civil</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Adding..." : "Add Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-xl bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Edit Student
              </h2>
              <button
                onClick={() => setEditing(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form className="space-y-4" onSubmit={handleUpdate}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Registration Number *
                </label>
                <input
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editing.registration_number}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      registration_number: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editing.name}
                  onChange={(e) =>
                    setEditing({ ...editing, name: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editing.email || ""}
                  onChange={(e) =>
                    setEditing({ ...editing, email: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department *
                </label>
                <input
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editing.department}
                  onChange={(e) =>
                    setEditing({ ...editing, department: e.target.value })
                  }
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;
