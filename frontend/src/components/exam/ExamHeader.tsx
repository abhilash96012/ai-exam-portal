import React from "react";
import Timer from "../common/Timer";

interface ExamHeaderProps {
  examTitle: string;
  durationInMinutes: number;
  onTimeUp: () => void;
  onSubmit: () => void;
  answeredCount: number;
  totalQuestions: number;
}

const ExamHeader: React.FC<ExamHeaderProps> = ({
  examTitle,
  durationInMinutes,
  onTimeUp,
  onSubmit,
  answeredCount,
  totalQuestions,
}) => {
  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-800">{examTitle}</h1>
            <p className="text-sm text-gray-500">
              {answeredCount} of {totalQuestions} answered
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Timer
              durationInMinutes={durationInMinutes}
              onTimeUp={onTimeUp}
              warningThresholdMinutes={5}
            />

            <button
              onClick={onSubmit}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
            >
              Submit Exam
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default ExamHeader;
