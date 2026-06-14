import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import resultService from "../../services/resultService";
import Loader from "../../components/common/Loader";

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

const StudentResults: React.FC = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState<StudentResultSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const data = await resultService.getStudentResults();
        setResults(data);
      } catch (error) {
        console.error("Failed to fetch student results:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, []);

  const handleViewDetails = (attemptId: string) => {
    navigate(`/student/exam/result`, { state: { attemptId } });
  };

  if (isLoading) {
    return <Loader fullScreen text="Loading results..." />;
  }

  if (results.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-sm border w-full max-w-md p-6 text-center space-y-4">
          <h1 className="text-lg font-semibold text-gray-900">
            No results yet
          </h1>
          <p className="text-sm text-gray-500">
            You haven't submitted any exams yet. Once you complete an exam, your
            results will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            My Results
          </h1>
          <p className="text-gray-500 text-sm sm:text-base">
            Review your performance across all submitted exams
          </p>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Exam
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Branch / Year
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 sm:px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {results.map((result) => (
                  <tr key={result.attemptId} className="hover:bg-gray-50">
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <p className="text-sm font-medium text-gray-900">
                        {result.examTitle}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(result.submittedAt).toLocaleString()}
                      </p>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-gray-600">
                      {result.branch} / {result.year} year
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-gray-800">
                      {result.score}/{result.totalMarks} (
                      {result.percentage.toFixed(2)}%)
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <span
                        className={`inline-flex px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                          result.passed
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {result.passed ? "PASS" : "FAIL"}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                      <button
                        onClick={() => handleViewDetails(result.attemptId)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentResults;
