import React, { createContext, useContext, useState } from "react";

interface ExamContextType {
  currentQuestion: number;
  answers: Record<number, any>; // questionIndex -> optionIndex OR text string
  setCurrentQuestion: (index: number) => void;
  selectAnswer: (questionIndex: number, value: any) => void;
  resetExam: () => void;
}

const ExamContext = createContext<ExamContextType | undefined>(undefined);

export const ExamProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});

  const selectAnswer = (questionIndex: number, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: value,
    }));
  };

  const resetExam = () => {
    setCurrentQuestion(0);
    setAnswers({});
  };

  return (
    <ExamContext.Provider
      value={{
        currentQuestion,
        answers,
        setCurrentQuestion,
        selectAnswer,
        resetExam,
      }}
    >
      {children}
    </ExamContext.Provider>
  );
};

export const useExam = () => {
  const context = useContext(ExamContext);
  if (!context) {
    throw new Error("useExam must be used inside ExamProvider");
  }
  return context;
};
