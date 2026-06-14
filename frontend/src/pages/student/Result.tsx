import React, { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import resultService from "../../services/resultService";

interface ResultData {
  score: number;
  total: number;
  percentage: number;
  timeTaken?: string;
  status: "PASS" | "FAIL";
}

const Result: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [result, setResult] = useState<ResultData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const state = location.state as { attemptId?: string } | undefined;
  const attemptId = state?.attemptId;

  useEffect(() => {
    const fetchResult = async () => {
      if (!attemptId) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await resultService.getStudentResultByAttempt(attemptId);
        const r = data.result;
        setResult({
          score: r.score,
          total: r.totalMarks,
          percentage: r.percentage,
          status: r.passed ? "PASS" : "FAIL",
          timeTaken: undefined,
        });
      } catch (error) {
        console.error("Failed to fetch result details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResult();
  }, [attemptId]);

  const getStatusColor = (status: "PASS" | "FAIL") => {
    return status === "PASS"
      ? "bg-green-100 text-green-700"
      : "bg-red-100 text-red-700";
  };

  if (isLoading) {
    return <Loader fullScreen text="Loading result..." />;
  }

  return !result ? (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-sm border w-full max-w-md p-6 text-center space-y-4">
        <h1 className="text-lg font-semibold text-gray-900">No result data</h1>
        <p className="text-sm text-gray-500">
          Your exam result could not be found. Please go back to the dashboard
          and open the result again.
        </p>
        <Button onClick={() => navigate("/student/dashboard")}>
          Back to Dashboard
        </Button>
      </div>
    </div>
  ) : (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-sm border w-full max-w-xl">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Exam Result</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Summary of your performance in this exam
            </p>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
              result.status,
            )}`}
          >
            {result.status === "PASS" ? "Passed" : "Failed"}
          </span>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-gray-900">
              {result.percentage}%
            </span>
            <span className="text-xs uppercase tracking-wide text-gray-500">
              Overall Score
            </span>
          </div>

          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div className="bg-gray-50 rounded-md px-3 py-2">
              <dt className="text-xs text-gray-500">Correct</dt>
              <dd className="mt-1 font-medium text-gray-900">{result.score}</dd>
            </div>
            <div className="bg-gray-50 rounded-md px-3 py-2">
              <dt className="text-xs text-gray-500">Wrong</dt>
              <dd className="mt-1 font-medium text-gray-900">
                {result.total - result.score}
              </dd>
            </div>
            <div className="bg-gray-50 rounded-md px-3 py-2">
              <dt className="text-xs text-gray-500">Total Questions</dt>
              <dd className="mt-1 font-medium text-gray-900">{result.total}</dd>
            </div>
            <div className="bg-gray-50 rounded-md px-3 py-2">
              <dt className="text-xs text-gray-500">Time Taken</dt>
              <dd className="mt-1 font-medium text-gray-900">
                {result.timeTaken ?? "-"}
              </dd>
            </div>
          </dl>

          <div className="pt-2 border-t mt-2 flex flex-col sm:flex-row gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => navigate("/student/dashboard")}
            >
              Back to Dashboard
            </Button>
            <Link to="/student/results">
              <Button>View All Results</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Result;
