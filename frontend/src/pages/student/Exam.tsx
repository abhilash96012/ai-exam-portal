import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { Question } from "../../types/question.types";
import { useExam } from "../../context/ExamContext";
import ExamHeader from "../../components/exam/ExamHeader";
import QuestionCard from "../../components/exam/QuestionCard";
import QuestionNavigator from "../../components/exam/QuestionNavigator";
import Modal from "../../components/common/Modal";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import attemptService from "../../services/attemptService";

const Exam: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const {
    currentQuestion,
    answers,
    setCurrentQuestion,
    selectAnswer,
    resetExam,
  } = useExam();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [examMeta, setExamMeta] = useState<{
    title: string;
    durationMinutes: number;
    totalQuestions: number;
  } | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        if (!examId) return;

        const data = await attemptService.startExam(examId);

        // Map backend questions to frontend Question shape
        const mappedQuestions: Question[] = data.questions.map(
          (q: any): Question => ({
            id: q.id,
            examId: q.exam_id,
            questionText: q.question_text,
            options: [q.option_a, q.option_b, q.option_c, q.option_d],
            // Students don't see the correct answer; keep a placeholder index
            correctAnswerIndex: 0,
          }),
        );

        setQuestions(mappedQuestions);
        setAttemptId(data.attempt.id);
        setExamMeta({
          title: data.exam.title,
          durationMinutes: data.exam.durationMinutes,
          totalQuestions: data.exam.totalQuestions,
        });
        resetExam();
      } catch (error) {
        console.error("Failed to fetch questions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, [examId, resetExam]);

  const handleTimeUp = () => {
    handleSubmit();
  };

  const handleSelectOption = async (optionIndex: number) => {
    const current = questions[currentQuestion];

    // Update local selection immediately for responsive UI
    selectAnswer(currentQuestion, optionIndex);

    if (!attemptId || !current) {
      return;
    }

    try {
      const optionMap = ["A", "B", "C", "D"];
      await attemptService.saveAnswer(attemptId, {
        questionId: current.id,
        selectedOption: optionMap[optionIndex],
      });
    } catch (error) {
      // Don't block the UI on save failure; log for debugging
      console.error("Failed to save answer:", error);
    }
  };

  const handleSubmit = async () => {
    if (!attemptId) return;

    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const optionMap = ["A", "B", "C", "D"];

      const payloadAnswers = questions
        .map((q, index) => {
          const selected = answers[index];
          if (selected === undefined) return null;
          return {
            questionId: q.id,
            selectedOption: optionMap[selected],
          };
        })
        .filter(Boolean) as { questionId: string; selectedOption: string }[];

      const submitData = await attemptService.submitAttempt(
        attemptId,
        payloadAnswers,
      );

      const attemptResultId = submitData?.result?.attemptId;

      navigate(`/student/exam/${examId}/result`, {
        state: { attemptId: attemptResultId },
      });
    } catch (error) {
      console.error("Failed to submit exam:", error);
      const message =
        (error as any)?.message || "Failed to submit exam. Please try again.";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
      if (!submitError) {
        setShowSubmitModal(false);
      }
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const answeredQuestions = Object.keys(answers).map(Number);

  if (isLoading) {
    return <Loader fullScreen text="Loading exam..." />;
  }

  const currentQ = questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gray-100">
      <ExamHeader
        examTitle={examMeta?.title || "Exam"}
        durationInMinutes={examMeta?.durationMinutes || 60}
        onTimeUp={handleTimeUp}
        onSubmit={() => setShowSubmitModal(true)}
        answeredCount={answeredQuestions.length}
        totalQuestions={examMeta?.totalQuestions || questions.length}
      />

      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          {/* Question Navigator - Mobile: Top, Desktop: Right */}
          <div className="lg:hidden">
            <QuestionNavigator
              totalQuestions={questions.length}
              currentQuestion={currentQuestion}
              answeredQuestions={answeredQuestions}
              onSelectQuestion={setCurrentQuestion}
            />
          </div>

          {/* Question Area */}
          <div className="flex-1 space-y-4">
            {currentQ && (
              <QuestionCard
                question={currentQ}
                questionNumber={currentQuestion + 1}
                totalQuestions={questions.length}
                selectedOption={answers[currentQuestion]}
                onSelectOption={handleSelectOption}
              />
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between gap-3">
              <Button
                variant="secondary"
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
              >
                Previous
              </Button>
              <Button
                onClick={handleNext}
                disabled={currentQuestion === questions.length - 1}
              >
                Next
              </Button>
            </div>
          </div>

          {/* Question Navigator - Desktop */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <QuestionNavigator
              totalQuestions={questions.length}
              currentQuestion={currentQuestion}
              answeredQuestions={answeredQuestions}
              onSelectQuestion={setCurrentQuestion}
            />
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="Submit Exam"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to submit the exam?
          </p>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">
              Questions answered:{" "}
              <span className="font-semibold">
                {answeredQuestions.length} / {questions.length}
              </span>
            </p>
            {answeredQuestions.length < questions.length && (
              <p className="text-sm text-yellow-600 mt-1">
                You have {questions.length - answeredQuestions.length}{" "}
                unanswered questions.
              </p>
            )}
          </div>
          {submitError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
              {submitError}
            </div>
          )}
          <div className="flex gap-3">
            <Button onClick={handleSubmit} isLoading={isSubmitting} fullWidth>
              Confirm Submit
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowSubmitModal(false)}
              fullWidth
            >
              Continue Exam
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Exam;
