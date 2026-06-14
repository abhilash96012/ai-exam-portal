import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { Question } from "../../types/question.types";
import examService from "../../services/examService";
import questionService from "../../services/questionService";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import Modal from "../../components/common/Modal";

const ReviewQuestions: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statistics, setStatistics] = useState<any | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingText, setEditingText] = useState("");
  const [editingOptions, setEditingOptions] = useState<string[]>([
    "",
    "",
    "",
    "",
  ]);
  const [editingCorrectIndex, setEditingCorrectIndex] = useState(0);

  const normalizeOption = (value: unknown): string => (value ?? "").toString();

  const toCorrectAnswerIndex = (value: unknown): number => {
    const idx = ["A", "B", "C", "D"].indexOf(
      (value ?? "").toString().toUpperCase(),
    );
    return idx >= 0 ? idx : 0;
  };

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        if (!examId) {
          throw new Error("Missing exam id");
        }

        const rawQuestions = await questionService.getExamQuestions(examId);

        const mapped: Question[] = rawQuestions.map((q: any) => ({
          id: q.id,
          examId: q.exam_id ?? examId,
          questionText: q.question_text ?? q.questionText,
          options: [
            q.option_a ?? q.optionA,
            q.option_b ?? q.optionB,
            q.option_c ?? q.optionC,
            q.option_d ?? q.optionD,
          ].map(normalizeOption),
          correctAnswerIndex: toCorrectAnswerIndex(
            q.correct_option ?? q.correctOption,
          ),
        }));

        setQuestions(mapped);

        // Fetch basic statistics for this exam
        const statsResponse = await examService.getExamStatistics(examId);
        const stats =
          statsResponse.data?.statistics ?? statsResponse.statistics ?? null;
        setStatistics(stats);
      } catch (error) {
        console.error("Failed to fetch questions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, [examId]);

  const handleViewQuestion = (question: Question) => {
    setSelectedQuestion(question);
    setEditingText(question.questionText);
    setEditingOptions([
      question.options[0] || "",
      question.options[1] || "",
      question.options[2] || "",
      question.options[3] || "",
    ]);
    setEditingCorrectIndex(question.correctAnswerIndex ?? 0);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handlePublish = async () => {
    if (!examId) {
      return navigate("/teacher/exams");
    }

    try {
      await examService.publishExam(examId);
      navigate("/teacher/exams");
    } catch (error) {
      console.error("Failed to publish exam", error);
    }
  };

  const optionLabels = ["A", "B", "C", "D"];

  const handleDeleteQuestion = async (questionId: string) => {
    if (!window.confirm("Delete this question?")) return;

    try {
      await questionService.deleteQuestion(questionId);
      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
      if (selectedQuestion && selectedQuestion.id === questionId) {
        setIsModalOpen(false);
        setSelectedQuestion(null);
      }
    } catch (error) {
      console.error("Failed to delete question", error);
    }
  };

  const handleSaveQuestion = async () => {
    if (!selectedQuestion || !examId) return;

    const trimmedOptions = editingOptions.map((opt) => opt.trim());
    const payload = {
      examId,
      questionText: editingText.trim(),
      optionA: trimmedOptions[0],
      optionB: trimmedOptions[1],
      optionC: trimmedOptions[2],
      optionD: trimmedOptions[3],
      correctOption: optionLabels[editingCorrectIndex] as "A" | "B" | "C" | "D",
    };

    try {
      if (selectedQuestion.id) {
        const updated = await questionService.updateQuestion(
          selectedQuestion.id,
          payload,
        );

        const updatedMapped: Question = {
          id: updated.id,
          examId: updated.exam_id ?? examId,
          questionText: updated.question_text ?? payload.questionText,
          options: [
            updated.option_a ?? payload.optionA,
            updated.option_b ?? payload.optionB,
            updated.option_c ?? payload.optionC,
            updated.option_d ?? payload.optionD,
          ].map(normalizeOption),
          correctAnswerIndex: toCorrectAnswerIndex(
            updated.correct_option ?? payload.correctOption,
          ),
        };

        setQuestions((prev) =>
          prev.map((q) => (q.id === updatedMapped.id ? updatedMapped : q)),
        );
        setSelectedQuestion(updatedMapped);
      }

      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save question", error);
    }
  };

  const handleAddQuestion = async () => {
    if (!examId) return;

    const payload = {
      examId,
      questionText: "New question",
      optionA: "Option A",
      optionB: "Option B",
      optionC: "Option C",
      optionD: "Option D",
      correctOption: "A" as const,
    };

    try {
      const created = await questionService.createQuestion(payload);

      const newQuestion: Question = {
        id: created.id,
        examId: created.exam_id ?? examId,
        questionText: created.question_text ?? payload.questionText,
        options: [
          created.option_a ?? payload.optionA,
          created.option_b ?? payload.optionB,
          created.option_c ?? payload.optionC,
          created.option_d ?? payload.optionD,
        ].map(normalizeOption),
        correctAnswerIndex: toCorrectAnswerIndex(
          created.correct_option ?? payload.correctOption,
        ),
      };

      setQuestions((prev) => [...prev, newQuestion]);
    } catch (error) {
      console.error("Failed to add question", error);
    }
  };

  if (isLoading) {
    return <Loader fullScreen text="Loading questions..." />;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            Review Questions
          </h1>
          <p className="text-gray-500 text-sm sm:text-base">
            Review AI-generated questions before publishing
          </p>
        </div>
        <div className="flex gap-3 sm:gap-4">
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Back
          </Button>
          <Button variant="secondary" onClick={handleAddQuestion}>
            Add Question
          </Button>
          <Button onClick={handlePublish}>Publish Exam</Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-3 sm:p-4 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p className="text-xs sm:text-sm text-gray-600">
              Total Questions:{" "}
              <span className="font-semibold">{questions.length}</span>
            </p>
            {statistics && (
              <p className="text-xs sm:text-sm text-gray-600">
                Attempts: {statistics.completedAttempts ?? 0}/
                {statistics.totalAttempts ?? 0}, Avg. score:{" "}
                <span className="font-semibold">
                  {Number(statistics.averageScore ?? 0).toFixed(2)}
                </span>
              </p>
            )}
          </div>
        </div>

        <div className="divide-y">
          {questions.map((question, index) => (
            <div
              key={question.id}
              className="p-3 sm:p-4 hover:bg-gray-50 cursor-pointer"
              onClick={() => handleViewQuestion(question)}
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <span className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-medium text-sm">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-800 font-medium line-clamp-2 text-sm sm:text-base">
                    {question.questionText}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Correct Answer: {optionLabels[question.correctAnswerIndex]}
                  </p>
                </div>
                <button
                  className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewQuestion(question);
                  }}
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Question Detail Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? "Edit Question" : "Question Details"}
        size="lg"
      >
        {selectedQuestion && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Question</p>
              {isEditing ? (
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                />
              ) : (
                <p className="text-gray-800 font-medium">
                  {selectedQuestion.questionText}
                </p>
              )}
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-2">Options</p>
              <div className="space-y-2">
                {optionLabels.map((label, index) => (
                  <div
                    key={label}
                    className={`p-3 rounded-lg border ${
                      index ===
                      (isEditing
                        ? editingCorrectIndex
                        : selectedQuestion.correctAnswerIndex)
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200"
                    }`}
                  >
                    <span className="font-medium mr-2">{label}.</span>
                    {isEditing ? (
                      <input
                        className="w-full border-none focus:outline-none text-sm"
                        value={editingOptions[index] || ""}
                        onChange={(e) => {
                          const next = [...editingOptions];
                          next[index] = e.target.value;
                          setEditingOptions(next);
                        }}
                      />
                    ) : (
                      selectedQuestion.options[index] || ""
                    )}
                    {isEditing ? (
                      <button
                        type="button"
                        className="ml-3 text-xs text-blue-600 hover:underline"
                        onClick={() => setEditingCorrectIndex(index)}
                      >
                        {index === editingCorrectIndex
                          ? "Correct answer"
                          : "Mark as correct"}
                      </button>
                    ) : (
                      index === selectedQuestion.correctAnswerIndex && (
                        <span className="ml-2 text-green-600 text-sm">
                          (Correct)
                        </span>
                      )
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Close
              </Button>
              {selectedQuestion && !isEditing && (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleDeleteQuestion(selectedQuestion.id)}
                  >
                    Delete
                  </Button>
                </>
              )}
              {isEditing && <Button onClick={handleSaveQuestion}>Save</Button>}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ReviewQuestions;
