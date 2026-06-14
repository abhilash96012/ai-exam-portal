import React from "react";

interface QuestionNavigatorProps {
  totalQuestions: number;
  currentQuestion: number;
  answeredQuestions: number[];
  onSelectQuestion: (index: number) => void;
}

const QuestionNavigator: React.FC<QuestionNavigatorProps> = ({
  totalQuestions,
  currentQuestion,
  answeredQuestions,
  onSelectQuestion,
}) => {
  const getQuestionStatus = (index: number) => {
    if (index === currentQuestion) return "current";
    if (answeredQuestions.includes(index)) return "answered";
    return "unanswered";
  };

  const statusStyles = {
    current: "bg-blue-600 text-white border-blue-600",
    answered: "bg-green-500 text-white border-green-500",
    unanswered: "bg-white text-gray-600 border-gray-300 hover:border-gray-400",
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Questions</h3>

      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: totalQuestions }, (_, index) => {
          const status = getQuestionStatus(index);

          return (
            <button
              key={index}
              onClick={() => onSelectQuestion(index)}
              className={`w-10 h-10 rounded-lg border-2 font-medium text-sm transition-colors ${statusStyles[status]}`}
            >
              {index + 1}
            </button>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t space-y-2">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span className="w-4 h-4 rounded bg-blue-600"></span>
          <span>Current</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span className="w-4 h-4 rounded bg-green-500"></span>
          <span>Answered</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span className="w-4 h-4 rounded border-2 border-gray-300 bg-white"></span>
          <span>Unanswered</span>
        </div>
      </div>
    </div>
  );
};

export default QuestionNavigator;
