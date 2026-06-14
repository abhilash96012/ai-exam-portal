// src/utils/validators.ts

export const validateExamTitle = (title: string) => {
  if (!title.trim()) {
    return "Exam title is required";
  }

  if (title.length < 3) {
    return "Title must be at least 3 characters";
  }

  return null;
};

export const validateDuration = (duration: number) => {
  if (duration <= 0) {
    return "Duration must be greater than 0";
  }

  if (duration > 180) {
    return "Duration cannot exceed 180 minutes";
  }

  return null;
};