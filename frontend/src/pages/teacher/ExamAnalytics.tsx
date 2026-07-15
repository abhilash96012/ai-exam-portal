import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import examService from "../../services/examService";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";

interface HardestQuestion {
  questionId: number;
  questionText: string;
  failureRate: number;
}

interface AnalyticsData {
  totalAttempts: number;
  completedAttempts: number;
  averageScore: string;
  highestScore: string;
  lowestScore: string;
  hardestQuestions: HardestQuestion[];
  scoreDistribution: {
    "0-25": number;
    "26-50": number;
    "51-75": number;
    "76-100": number;
  };
}

const ScoreDistributionChart: React.FC<{ distribution: AnalyticsData["scoreDistribution"] }> = ({ distribution }) => {
  const maxCount = Math.max(...Object.values(distribution), 1);
  const labels = ["0-25%", "26-50%", "51-75%", "76-100%"];
  const values = [
    distribution["0-25"],
    distribution["26-50"],
    distribution["51-75"],
    distribution["76-100"],
  ];

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6 mt-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Score Distribution</h2>
      <div className="flex items-end gap-2 sm:gap-4 h-48 pt-4 pb-8">
        {values.map((val, idx) => {
          const height = (val / maxCount) * 100;
          return (
            <div key={idx} className="flex-1 flex flex-col items-center justify-end relative group">
              <div 
                className="w-full bg-blue-500 rounded-t-sm transition-all duration-300 relative"
                style={{ height: `${height}%`, minHeight: val > 0 ? "4px" : "0px" }}
              >
                <div className="absolute -top-6 w-full text-center text-xs font-semibold text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  {val}
                </div>
              </div>
              <span className="absolute -bottom-6 text-xs text-gray-500">{labels[idx]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ExamAnalytics: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!examId) return;
      try {
        const response = await examService.getExamStatistics(examId);
        setData(response.data);
      } catch (error) {
        console.error("Failed to fetch analytics", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, [examId]);

  const handleExport = async () => {
    if (!examId) return;
    setIsExporting(true);
    try {
      const blob = await examService.exportResultsCsv(examId);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `exam_${examId}_results.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error) {
      console.error("Failed to export results", error);
      alert("Failed to export results. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return <Loader fullScreen text="Loading analytics..." />;
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-gray-500">
        Failed to load analytics or no data available.
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Exam Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">Deep insights into student performance</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => navigate(-1)}>Back</Button>
          <Button onClick={handleExport} disabled={isExporting || data.completedAttempts === 0}>
            {isExporting ? "Exporting..." : "Export CSV"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Average Score</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{data.averageScore}%</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Highest Score</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{data.highestScore}%</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Lowest Score</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{data.lowestScore}%</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Completion Rate</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {data.totalAttempts > 0 
              ? Math.round((data.completedAttempts / data.totalAttempts) * 100) 
              : 0}%
          </p>
          <p className="text-xs text-gray-400 mt-1">{data.completedAttempts} / {data.totalAttempts} attempts</p>
        </div>
      </div>

      <ScoreDistributionChart distribution={data.scoreDistribution} />

      {data.hardestQuestions && data.hardestQuestions.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Hardest Questions</h2>
          <p className="text-sm text-gray-500 mb-4">Questions with the highest failure rates across all students.</p>
          
          <div className="space-y-4">
            {data.hardestQuestions.map((q, idx) => (
              <div key={q.questionId} className="flex gap-4 p-4 border rounded-lg bg-gray-50 items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-red-600 mb-1 block">#{idx + 1} Hardest</span>
                  <p className="text-sm font-medium text-gray-800 line-clamp-2">{q.questionText}</p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold text-red-600 block">{Math.round(q.failureRate)}%</span>
                  <span className="text-xs text-gray-500">Failure Rate</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamAnalytics;
