import React, { useEffect, useState } from "react";
import { useNavigate, Link, useLocation, useParams } from "react-router-dom";
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
  const { examId } = useParams<{ examId: string }>();
  const [result, setResult] = useState<ResultData | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const state = location.state as { attemptId?: string } | undefined;
  const attemptId = state?.attemptId;

  useEffect(() => {
    const fetchResult = async () => {
      try {
        let currentAttemptId = attemptId;

        // If attemptId is missing from router state, resolve it using the examId from URL
        if (!currentAttemptId && examId) {
          const resolved = await resultService.getStudentResultByExam(examId);
          currentAttemptId = resolved?.attemptId;
        }

        if (!currentAttemptId) {
          setIsLoading(false);
          return;
        }

        const data = await resultService.getStudentResultByAttempt(currentAttemptId);
        const r = data.result;
        setResult({
          score: r.score,
          total: r.totalMarks,
          percentage: r.percentage,
          status: r.passed ? "PASS" : "FAIL",
          timeTaken: undefined,
        });
        setQuestions(data.questions || []);
      } catch (error) {
        console.error("Failed to fetch result details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResult();
  }, [attemptId, examId]);

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

          {questions && questions.length > 0 && (
            <div className="border-t pt-4 mt-4">
              <h2 className="text-sm font-semibold text-gray-800 mb-3 text-left">Question Review</h2>
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                {questions.map((q, idx) => (
                  <div key={q.id || idx} className={`p-3 rounded-lg border text-left ${q.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="text-xs font-semibold text-gray-900">
                        Q{idx + 1}. {q.questionText}
                      </h3>
                      {q.questionType === 'SUBJECTIVE' ? (
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap bg-purple-100 text-purple-800`}>
                          {q.studentScore} / {q.marks || 5} Marks
                        </span>
                      ) : (
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap ${q.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {q.isCorrect ? 'Correct' : 'Incorrect'}
                        </span>
                      )}
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-2 text-xs">
                      {q.questionType === 'SUBJECTIVE' ? (
                        <div className="space-y-3">
                          <div className="bg-white p-3 rounded border border-gray-200">
                            <h4 className="font-semibold text-gray-700 mb-1">Your Answer:</h4>
                            <p className="text-gray-800 whitespace-pre-wrap">{q.textAnswer || <span className="text-gray-400 italic">No answer provided.</span>}</p>
                          </div>
                          
                          <div className="bg-blue-50 p-3 rounded border border-blue-200">
                            <h4 className="font-semibold text-blue-800 mb-1">Model Answer / Expected Points:</h4>
                            <p className="text-blue-900 whitespace-pre-wrap">{q.modelAnswer || 'Not available.'}</p>
                          </div>

                          <div className="bg-purple-50 p-3 rounded border border-purple-200">
                            <div className="flex justify-between items-center mb-1">
                              <h4 className="font-semibold text-purple-800">AI Evaluation Feedback:</h4>
                              <span className="font-bold text-purple-700 bg-purple-200 px-2 py-0.5 rounded text-[10px]">
                                Score: {q.studentScore} / {q.marks || 5}
                              </span>
                            </div>
                            <p className="text-purple-900 whitespace-pre-wrap">{q.feedback || 'No feedback provided.'}</p>
                          </div>
                        </div>
                      ) : (
                        q.options.map((opt: string, optIdx: number) => {
                          const letter = ["A", "B", "C", "D"][optIdx];
                          const isSelected = q.selectedOption === letter;
                          const isCorrectOpt = q.correctOption === letter;
                          
                          let optStyle = "bg-white border-gray-200 text-gray-700";
                          if (isSelected) {
                            optStyle = q.isCorrect 
                              ? "bg-green-200 border-green-400 text-green-900 font-semibold" 
                              : "bg-red-200 border-red-400 text-red-900 font-semibold";
                          } else if (isCorrectOpt) {
                            optStyle = "bg-green-100 border-green-300 text-green-800 font-semibold";
                          }
                          
                          return (
                            <div key={optIdx} className={`p-2 rounded border ${optStyle}`}>
                              <span className="font-bold">{letter}.</span> {opt} {isCorrectOpt && <span className="text-[9px] text-green-800 ml-1 font-semibold">(Correct Answer)</span>} {isSelected && !q.isCorrect && <span className="text-[9px] text-red-800 ml-1 font-semibold">(Your Answer)</span>}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
