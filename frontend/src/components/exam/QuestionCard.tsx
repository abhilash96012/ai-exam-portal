import React from "react";
import type { Question } from "../../types/question.types";
import Options from "./Options";

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  selectedOption?: any;
  onSelectOption: (value: any) => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  questionNumber,
  totalQuestions,
  selectedOption,
  onSelectOption,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-gray-500">
          Question {questionNumber} of {totalQuestions}
        </span>
        {question.questionType === 'SUBJECTIVE' && (
          <span className="text-xs font-semibold bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
            Subjective (Descriptive)
          </span>
        )}
      </div>

      <h2 className="text-lg font-medium text-gray-800 mb-6">
        {question.questionText}
      </h2>

      {question.questionType === 'SUBJECTIVE' ? (
        <textarea
          value={(selectedOption as string) || ""}
          onChange={(e) => onSelectOption(e.target.value)}
          placeholder="Type your detailed answer here..."
          className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
        />
      ) : (
        <Options
          options={question.options}
          selectedOption={selectedOption as number}
          onSelectOption={onSelectOption}
        />
      )}
    </div>
  );
};

export default QuestionCard;
