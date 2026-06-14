import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import examService from "../../services/examService";
import Loader from "../../components/common/Loader";

interface ExamSummary {
  id: string;
  title: string;
  subject: string;
  status: string;
}

const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const data = await examService.getTeacherExams();
        setExams(data);
      } catch (error) {
        console.error("Failed to fetch exams:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExams();
  }, []);

  const stats = {
    total: exams.length,
    active: exams.filter((e) => e.status === "ACTIVE").length,
    students: 0,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return "bg-green-100 text-green-700 border border-green-200";
      case "DRAFT":
        return "bg-yellow-100 text-yellow-700 border border-yellow-200";
      case "ACTIVE":
        return "bg-blue-100 text-blue-700 border border-blue-200";
      default:
        return "bg-gray-100 text-gray-700 border border-gray-200";
    }
  };

  const handleDeleteExam = async (examId: string) => {
    if (!window.confirm("Are you sure you want to delete this exam?")) {
      return;
    }

    try {
      await examService.deleteExam(examId);
      setExams((prev) => prev.filter((exam) => exam.id !== examId));
    } catch (error) {
      console.error("Failed to delete exam", error);
    }
  };

  const getActionButtons = (exam: ExamSummary) => {
    if (exam.status === "PUBLISHED" || exam.status === "ACTIVE") {
      return (
        <>
          <Link
            to={`/teacher/exams/${exam.id}`}
            className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            View
          </Link>
          <Link
            to={`/teacher/results/${exam.id}`}
            className="px-4 py-1.5 bg-yellow-500 text-white text-sm font-medium rounded-md hover:bg-yellow-600 transition-colors"
          >
            Results
          </Link>
        </>
      );
    }
    return (
      <>
        <Link
          to={`/teacher/exams/${exam.id}/edit`}
          className="px-4 py-1.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
        >
          Edit
        </Link>
        <button
          onClick={() => handleDeleteExam(exam.id)}
          className="px-4 py-1.5 border border-red-300 text-red-600 text-sm font-medium rounded-md hover:bg-red-50 transition-colors"
        >
          Delete
        </button>
      </>
    );
  };

  if (isLoading) {
    return <Loader fullScreen text="Loading dashboard..." />;
  }

  const displayExams = exams;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Welcome, {user?.name}!
        </h1>
        <p className="text-gray-500 mt-1 text-sm sm:text-base">
          Manage your exams efficiently
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <p className="text-sm text-gray-500 mb-1">Total Exams</p>
          <p className="text-3xl sm:text-4xl font-bold text-gray-900">
            {stats.total}
          </p>
          <div className="mt-2 h-1 w-12 bg-blue-600 rounded"></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <p className="text-sm text-yellow-600 mb-1">Active Exams</p>
          <p className="text-3xl sm:text-4xl font-bold text-gray-900">
            {stats.active}
          </p>
          <div className="mt-2 h-1 w-12 bg-yellow-500 rounded"></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
          <p className="text-sm text-green-600 mb-1">Students Enrolled</p>
          <p className="text-3xl sm:text-4xl font-bold text-gray-900">
            {stats.students}
          </p>
          <div className="mt-2 h-1 w-12 bg-green-500 rounded"></div>
        </div>
      </div>

      {/* Create Button */}
      <Link
        to="/teacher/exams/create"
        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition-colors mb-6 sm:mb-8 w-full sm:w-auto justify-center sm:justify-start"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        Create New Exam
      </Link>

      {/* Recent Exams Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Exams</h2>
        </div>

        {/* Mobile Card View */}
        <div className="block sm:hidden divide-y divide-gray-200">
          {displayExams.map((exam) => (
            <div key={exam.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-900">{exam.title}</p>
                  <p className="text-sm text-gray-600">{exam.subject}</p>
                </div>
                <span
                  className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${getStatusBadge(exam.status)}`}
                >
                  {exam.status === "PUBLISHED"
                    ? "Published"
                    : exam.status === "DRAFT"
                      ? "Draft"
                      : "Active"}
                </span>
              </div>
              <div className="flex gap-2">{getActionButtons(exam)}</div>
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Exam Title
                </th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {displayExams.map((exam) => (
                <tr key={exam.id} className="hover:bg-gray-50">
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <p className="font-medium text-gray-900">{exam.title}</p>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-gray-600">
                    {exam.subject}
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <span
                      className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getStatusBadge(exam.status)}`}
                    >
                      {exam.status === "PUBLISHED"
                        ? "Published"
                        : exam.status === "DRAFT"
                          ? "Draft"
                          : "Active"}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center gap-2">
                      {getActionButtons(exam)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {displayExams.length === 0 && (
          <p className="p-4 sm:p-6 text-gray-500 text-center">
            No exams created yet
          </p>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
