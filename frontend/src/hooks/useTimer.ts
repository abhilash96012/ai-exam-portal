import { useEffect, useState } from "react";

const useTimer = (durationInMinutes: number, onTimeUp?: () => void) => {
  const [timeLeft, setTimeLeft] = useState(durationInMinutes * 60);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp?.();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, onTimeUp]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return {
    minutes,
    seconds,
    timeLeft,
  };
};

export default useTimer;