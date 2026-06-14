import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import examService from "../../services/examService";
import Loader from "../../components/common/Loader";

interface ExamSummary {
  id: string;
  title: string;
  status: string;
}

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const data = await examService.getStudentExams();
        setExams(data);
      } catch (error) {
        console.error("Failed to fetch exams:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExams();
  }, []);

  if (isLoading) {
    return <Loader fullScreen text="Loading dashboard..." />;
  }

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
          <p className="text-2xl sm:text-3xl font-bold text-green-600">0</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
          <p className="text-xs sm:text-sm text-gray-500">Pending</p>
          <p className="text-2xl sm:text-3xl font-bold text-yellow-600">
            {exams.length}
          </p>
        </div>
      </div>

      {/* Available Exams */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 sm:p-6 border-b">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800">
            Available Exams
          </h2>
        </div>
        <div className="divide-y">
          {exams.map((exam) => (
            <div
              key={exam.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <p className="font-medium text-gray-800 text-sm sm:text-base">
                  {exam.title}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">
                  60 minutes • 10 questions
                </p>
              </div>
              <Link
                to={`/student/exam/${exam.id}/instructions`}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors text-center w-full sm:w-auto"
              >
                Start Exam
              </Link>
            </div>
          ))}
          {exams.length === 0 && (
            <p className="p-4 sm:p-6 text-gray-500 text-center text-sm sm:text-base">
              No exams available at the moment
            </p>
          )}
        </div>
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
