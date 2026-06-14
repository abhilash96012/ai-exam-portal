import React from "react";

interface OptionsProps {
  options: string[];
  selectedOption?: number;
  onSelectOption: (optionIndex: number) => void;
  disabled?: boolean;
}

const Options: React.FC<OptionsProps> = ({
  options,
  selectedOption,
  onSelectOption,
  disabled = false,
}) => {
  const optionLabels = ["A", "B", "C", "D", "E", "F"];

  return (
    <div className="space-y-3">
      {options.map((option, index) => {
        const isSelected = selectedOption === index;

        return (
          <button
            key={index}
            onClick={() => onSelectOption(index)}
            disabled={disabled}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
              isSelected
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
          >
            <div className="flex items-start gap-3">
              <span
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  isSelected
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {optionLabels[index]}
              </span>
              <span className="text-gray-700 pt-1">{option}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default Options;
