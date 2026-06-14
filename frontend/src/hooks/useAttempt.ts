import { useState } from "react";

const useAttempt = () => {
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const selectAnswer = (questionIndex: number, optionIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: optionIndex,
    }));
  };

  const isAnswered = (questionIndex: number) => {
    return answers[questionIndex] !== undefined;
  };

  const resetAttempt = () => {
    setAnswers({});
  };

  return {
    answers,
    selectAnswer,
    isAnswered,
    resetAttempt,
  };
};

export default useAttempt;