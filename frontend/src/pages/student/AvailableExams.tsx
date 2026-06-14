import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Loader from "../../components/common/Loader";
import examService from "../../services/examService";

interface Exam {
  // Keep fields flexible; align UI to what backend provides
  id: string;
  title?: string;
  subject?: string;
  duration?: number;
  totalQuestions?: number;
  status?: "available" | "completed" | "expired" | string;
  deadline?: string;
}

const AvailableExams: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "available" | "completed">(
    "all",
  );
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchExams = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // GET /student/exams
        const data = (await examService.getStudentExams()) || [];
        setExams(data);
      } catch (error) {
        console.error("Failed to fetch exams:", error);
        const message =
          (error as any)?.message || "Unable to load exams. Please try again.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExams();
  }, []);

  const filteredExams = exams.filter((exam) => {
    const matchesFilter =
      filter === "all" || (exam.status as string | undefined) === filter;
    const matchesSearch =
      (exam.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exam.subject || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const availableCount = exams.filter(
    (e) => (e.status as string | undefined) === "available",
  ).length;
  const completedCount = exams.filter(
    (e) => (e.status as string | undefined) === "completed",
  ).length;

  if (isLoading) {
    return <Loader fullScreen text="Loading exams..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Page Header */}
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">
            Available Exams
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Browse and start your assigned examinations
          </p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Exams</p>
                <p className="text-xl font-bold text-gray-800">
                  {exams.length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500">Completed</p>
                <p className="text-xl font-bold text-green-600">
                  {completedCount}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500">Pending</p>
                <p className="text-xl font-bold text-yellow-600">
                  {availableCount}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search exams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter("available")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === "available"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Available
              </button>
              <button
                onClick={() => setFilter("completed")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === "completed"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Completed
              </button>
            </div>
          </div>
        </div>

        {/* Exams List */}
        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-2">
              {error}
            </div>
          )}

          {filteredExams.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
              <svg
                className="w-12 h-12 mx-auto text-gray-300 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-gray-500">No exams found</p>
              <p className="text-sm text-gray-400 mt-1">
                {searchQuery
                  ? "Try a different search term"
                  : "Check back later for new exams"}
              </p>
            </div>
          ) : (
            filteredExams.map((exam) => (
              <div
                key={exam.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 hover:border-blue-200 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          exam.status === "completed"
                            ? "bg-green-100"
                            : "bg-blue-100"
                        }`}
                      >
                        {exam.status === "completed" ? (
                          <svg
                            className="w-5 h-5 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-5 h-5 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 text-sm sm:text-base">
                          {exam.title || "Untitled exam"}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                          {exam.subject || "General"}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 mt-2">
                          <span className="inline-flex items-center text-xs text-gray-500">
                            <svg
                              className="w-4 h-4 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            {exam.duration} mins
                          </span>
                          <span className="inline-flex items-center text-xs text-gray-500">
                            <svg
                              className="w-4 h-4 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            {exam.totalQuestions} questions
                          </span>
                          {exam.deadline && exam.status === "available" && (
                            <span className="inline-flex items-center text-xs text-orange-600">
                              <svg
                                className="w-4 h-4 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                              Due:{" "}
                              {new Date(exam.deadline).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {exam.status === "completed" ? (
                      <>
                        <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          Completed
                        </span>
                        <Link
                          to={`/student/exam/${exam.id}/result`}
                          className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
                        >
                          View Result
                        </Link>
                      </>
                    ) : (
                      <Link
                        to={`/student/exam/${exam.id}/instructions`}
                        className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors text-center"
                      >
                        Start Exam
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AvailableExams;
