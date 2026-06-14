import { useExam as useExamContext } from "../context/ExamContext";

const useExam = () => {
  return useExamContext();
};

export default useExam;