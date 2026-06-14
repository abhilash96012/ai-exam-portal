// src/utils/helpers.ts

export const formatTime = (minutes: number, seconds: number) => {
  const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;
  return `${minutes}:${formattedSeconds}`;
};

export const calculateScore = (
  correctAnswers: Record<number, number>,
  studentAnswers: Record<number, number>
) => {
  let score = 0;

  Object.keys(correctAnswers).forEach((key) => {
    const index = Number(key);
    if (correctAnswers[index] === studentAnswers[index]) {
      score++;
    }
  });

  return score;
};

export const isExamExpired = (
  startTime: string,
  durationInMinutes: number
) => {
  const start = new Date(startTime).getTime();
  const now = new Date().getTime();
  const duration = durationInMinutes * 60 * 1000;

  return now > start + duration;
};