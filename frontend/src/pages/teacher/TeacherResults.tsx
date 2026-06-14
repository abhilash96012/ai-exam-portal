import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import resultService from "../../services/resultService";
import Loader from "../../components/common/Loader";

interface TeacherExamSummary {
  examId: string;
  title: string;
  branch: string;
  year: number;
  status: string;
  totalAttempts: number;
  completedAttempts: number;
  averageScore: number;
  passedCount: number;
  createdAt: string;
}

interface TeacherExamResultRow {
  attemptId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  registerNumber: string;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  submittedAt: string;
}

const TeacherResults: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();

  const [examSummaries, setExamSummaries] = useState<TeacherExamSummary[]>([]);
  const [examTitle, setExamTitle] = useState<string>("");
  const [statistics, setStatistics] = useState<any | null>(null);
  const [rows, setRows] = useState<TeacherExamResultRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (examId) {
          const data = await resultService.getTeacherExamResults(examId);
          setExamTitle(data.exam.title);
          setStatistics(data.statistics);
          setRows(data.results);
        } else {
          const exams = await resultService.getTeacherResultsSummary();
          setExamSummaries(exams);
        }
      } catch (error) {
        console.error("Failed to fetch teacher results:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [examId]);

  if (isLoading) {
    return <Loader fullScreen text="Loading results..." />;
  }

  // View: Summary of all exams for teacher
  if (!examId) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            Exam Performance Overview
          </h1>
          <p className="text-gray-500 text-sm sm:text-base">
            Overall statistics for all of your exams
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
                    Attempts
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Score
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Passed
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {examSummaries.map((exam) => (
                  <tr key={exam.examId} className="hover:bg-gray-50">
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <p className="text-sm font-medium text-gray-900">
                        {exam.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(exam.createdAt).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-gray-600">
                      {exam.branch} / {exam.year} year
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-gray-800">
                      {exam.completedAttempts}/{exam.totalAttempts}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-gray-800">
                      {exam.averageScore.toFixed(2)}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-gray-800">
                      {exam.passedCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // View: Detailed results for a single exam
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
          {examTitle || "Exam Results"}
        </h1>
        {statistics && (
          <p className="text-gray-500 text-sm sm:text-base">
            Completed attempts: {statistics.completedAttempts} /
            {statistics.totalAttempts}, average score{" "}
            {statistics.averageScore.toFixed(2)}, pass rate{" "}
            {statistics.passRate}%
          </p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Register No.
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rows.map((row) => (
                <tr key={row.attemptId} className="hover:bg-gray-50">
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <p className="text-sm font-medium text-gray-900">
                      {row.studentName}
                    </p>
                    <p className="text-xs text-gray-500">{row.studentEmail}</p>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-gray-700">
                    {row.registerNumber}
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-gray-800">
                    {row.score}/{row.totalMarks} ({row.percentage.toFixed(2)}%)
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <span
                      className={`inline-flex px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                        row.passed
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {row.passed ? "PASS" : "FAIL"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TeacherResults;
