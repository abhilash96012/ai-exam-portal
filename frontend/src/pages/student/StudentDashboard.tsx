import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import examService from "../../services/examService";
import resultService from "../../services/resultService";
import Loader from "../../components/common/Loader";

interface ExamSummary {
  id: string;
  title: string;
  status: string;
  duration?: number;
  totalQuestions?: number;
}

interface StudentResultSummary {
  attemptId: string;
  examId: string;
  examTitle: string;
  branch: string;
  year: number;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  submittedAt: string;
}

const StudentProgressChart: React.FC<{ results: StudentResultSummary[] }> = ({ results }) => {
  if (results.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center justify-center min-h-[200px]">
        <p className="text-sm text-gray-400">No exam attempts yet to plot trend.</p>
      </div>
    );
  }

  const sortedResults = [...results].sort(
    (a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
  );

  const points = sortedResults.map((r, i) => ({
    x: sortedResults.length > 1 ? (i / (sortedResults.length - 1)) * 300 + 40 : 190,
    y: 150 - (r.percentage / 100) * 110,
    title: r.examTitle,
    score: r.percentage,
  }));

  const pathD = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    return `${acc} L ${p.x} ${p.y}`;
  }, "");

  const gridY = [0, 25, 50, 75, 100].map(val => ({
    y: 150 - (val / 100) * 110,
    label: `${val}%`,
  }));

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6 flex flex-col justify-between">
      <div>
        <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-1">
          Performance Trend
        </h2>
        <p className="text-xs text-gray-500">Your score history percentages over time</p>
      </div>
      <div className="relative mt-4">
        <svg viewBox="0 0 380 180" className="w-full h-auto overflow-visible">
          {gridY.map((g, idx) => (
            <g key={idx}>
              <line
                x1="40"
                y1={g.y}
                x2="340"
                y2={g.y}
                stroke="#e2e8f0"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text x="10" y={g.y + 4} className="text-[10px] fill-gray-400 font-medium">
                {g.label}
              </text>
            </g>
          ))}

          {points.length > 1 && (
            <path
              d={`${pathD} L ${points[points.length - 1].x} 150 L ${points[0].x} 150 Z`}
              fill="url(#chartGradient)"
              opacity="0.15"
            />
          )}

          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>

          {points.length > 1 && (
            <path
              d={pathD}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {points.map((p, idx) => (
            <g key={idx} className="group cursor-pointer">
              <circle
                cx={p.x}
                cy={p.y}
                r="5"
                fill="#3b82f6"
                stroke="#ffffff"
                strokeWidth="2"
                className="transition-all duration-200 hover:r-7"
              />
              <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                <rect
                  x={p.x - 50}
                  y={p.y - 35}
                  width="100"
                  height="26"
                  rx="4"
                  fill="#1e293b"
                />
                <text
                  x={p.x}
                  y={p.y - 18}
                  textAnchor="middle"
                  className="text-[9px] fill-white font-semibold"
                >
                  {p.score.toFixed(1)}%
                </text>
              </g>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
};

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [results, setResults] = useState<StudentResultSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [examData, resultData] = await Promise.all([
          examService.getStudentExams(),
          resultService.getStudentResults(),
        ]);
        setExams(examData);
        setResults(resultData);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return <Loader fullScreen text="Loading dashboard..." />;
  }

  const completedCount = results.length;
  const pendingCount = exams.length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
          Welcome, {user?.name}!
        </h1>
        <p className="text-gray-500 text-sm sm:text-base">
          Ready for your next exam?
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <p className="text-xs sm:text-sm text-gray-500">Available Exams</p>
          <p className="text-2xl sm:text-3xl font-bold text-blue-600">
            {exams.length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <p className="text-xs sm:text-sm text-gray-500">Completed</p>
          <p className="text-2xl sm:text-3xl font-bold text-green-600">
            {completedCount}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
          <p className="text-xs sm:text-sm text-gray-500">Pending</p>
          <p className="text-2xl sm:text-3xl font-bold text-yellow-600">
            {pendingCount}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Available Exams */}
        <div className="bg-white rounded-lg shadow lg:col-span-2">
          <div className="p-4 sm:p-6 border-b">
            <h2 className="text-base sm:text-lg font-semibold text-gray-800">
              Available Exams
            </h2>
          </div>
          <div className="divide-y max-h-[350px] overflow-y-auto">
            {exams.map((exam) => (
              <div
                key={exam.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <p className="font-medium text-gray-800 text-sm sm:text-base flex items-center gap-2">
                    {exam.title}
                    {exam.status === "scheduled" && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Scheduled</span>
                    )}
                    {exam.status === "expired" && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">Expired</span>
                    )}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    {exam.duration || 60} minutes • {exam.totalQuestions || 10} questions
                  </p>
                </div>
                {exam.status === "available" ? (
                  <Link
                    to={`/student/exam/${exam.id}/instructions`}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors text-center w-full sm:w-auto"
                  >
                    Start Exam
                  </Link>
                ) : exam.status === "completed" ? (
                  <Link
                    to={`/student/exam/${exam.id}/result`}
                    className="bg-gray-100 hover:bg-gray-200 text-blue-600 border border-blue-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors text-center w-full sm:w-auto"
                  >
                    View Result
                  </Link>
                ) : (
                  <button
                    disabled
                    className="bg-gray-100 text-gray-400 cursor-not-allowed px-4 py-2 rounded-lg text-sm font-medium text-center w-full sm:w-auto border border-gray-200"
                  >
                    {exam.status === "scheduled" ? "Not Started" : "Missed"}
                  </button>
                )}
              </div>
            ))}
            {exams.length === 0 && (
              <p className="p-4 sm:p-6 text-gray-500 text-center text-sm sm:text-base">
                No exams available at the moment
              </p>
            )}
          </div>
        </div>

        {/* Progress chart */}
        <StudentProgressChart results={results} />
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">
          Quick Links
        </h2>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Link
            to="/student/exams"
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition-colors text-center text-sm sm:text-base"
          >
            Browse All Exams
          </Link>
          <Link
            to="/student/results"
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition-colors text-center text-sm sm:text-base"
          >
            View My Results
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
