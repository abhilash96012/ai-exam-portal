import React from "react";
import type { Question } from "../../types/question.types";
import Options from "./Options";

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  selectedOption?: number;
  onSelectOption: (optionIndex: number) => void;
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
      <div className="mb-4">
        <span className="text-sm text-gray-500">
          Question {questionNumber} of {totalQuestions}
        </span>
      </div>

      <h2 className="text-lg font-medium text-gray-800 mb-6">
        {question.questionText}
      </h2>

      <Options
        options={question.options}
        selectedOption={selectedOption}
        onSelectOption={onSelectOption}
      />
    </div>
  );
};

export default QuestionCard;
