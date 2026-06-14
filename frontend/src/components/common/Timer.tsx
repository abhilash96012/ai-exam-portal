import React from "react";
import useTimer from "../../hooks/useTimer";

interface TimerProps {
  durationInMinutes: number;
  onTimeUp?: () => void;
  showIcon?: boolean;
  warningThresholdMinutes?: number;
}

const Timer: React.FC<TimerProps> = ({
  durationInMinutes,
  onTimeUp,
  showIcon = true,
  warningThresholdMinutes = 5,
}) => {
  const { minutes, seconds, timeLeft } = useTimer(durationInMinutes, onTimeUp);

  const isWarning = timeLeft <= warningThresholdMinutes * 60;
  const isCritical = timeLeft <= 60;

  const formatTime = (value: number) => value.toString().padStart(2, "0");

  return (
    <div
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-semibold transition-colors ${
        isCritical
          ? "bg-red-100 text-red-700 animate-pulse"
          : isWarning
            ? "bg-yellow-100 text-yellow-700"
            : "bg-gray-100 text-gray-700"
      }`}
    >
      {showIcon && (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      )}
      <span>
        {formatTime(minutes)}:{formatTime(seconds)}
      </span>
    </div>
  );
};

export default Timer;
