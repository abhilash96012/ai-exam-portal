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
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const handleSubmitWithCheat = async (forcedCount: number) => {
    if (!attemptId) return;
    setIsSubmitting(true);
    try {
      const optionMap = ["A", "B", "C", "D"];
      const payloadAnswers = questions
        .map((q, index) => {
          const selected = answers[index];
          if (selected === undefined || selected === "") return null;
          
          if (q.questionType === 'SUBJECTIVE') {
            return {
              questionId: q.id,
              textAnswer: selected as string,
            };
          }

          return {
            questionId: q.id,
            selectedOption: optionMap[selected as number],
          };
        })
        .filter(Boolean) as { questionId: string; selectedOption?: string; textAnswer?: string }[];

      const submitData = await attemptService.submitAttempt(
        attemptId,
        payloadAnswers,
        forcedCount
      );

      const attemptResultId = submitData?.attemptId || submitData?.result?.attemptId || attemptId;

      if (document.exitFullscreen && document.fullscreenElement) {
        await document.exitFullscreen().catch(err => console.log(err));
      }

      navigate(`/student/exam/${examId}/result`, {
        state: { attemptId: attemptResultId },
      });
    } catch (error) {
      console.error("Failed to submit exam:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        if (!examId) return;

        const data = await attemptService.startExam(examId);

        const mappedQuestions: Question[] = data.questions.map(
          (q: any): Question => ({
            id: q.id,
            examId: q.exam_id,
            questionText: q.question_text,
            questionType: q.question_type || 'MCQ',
            options: [q.option_a, q.option_b, q.option_c, q.option_d],
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
      } catch (error: any) {
        console.error("Failed to fetch questions:", error);
        setFetchError(error?.message || "Failed to load exam questions. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, [examId]);

  useEffect(() => {
    if (!attemptId || isSubmitting || isLoading) return;

    const startTime = Date.now();
    const GRACE_PERIOD_MS = 3000;

    const handleCheatDetection = () => {
      if (Date.now() - startTime < GRACE_PERIOD_MS) return;

      if (document.visibilityState === "hidden") {
        setTabSwitchCount((prev) => {
          const nextCount = prev + 1;
          if (nextCount >= 3) {
            handleSubmitWithCheat(nextCount);
            return nextCount;
          } else {
            setShowWarningModal(true);
            return nextCount;
          }
        });
      }
    };

    const handleFullscreenChange = () => {
      if (Date.now() - startTime < GRACE_PERIOD_MS) return;

      const isCurrentlyFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isCurrentlyFullscreen);

      if (!isCurrentlyFullscreen && !isSubmitting) {
        setTabSwitchCount((prev) => {
          const nextCount = prev + 1;
          if (nextCount >= 3) {
            handleSubmitWithCheat(nextCount);
            return nextCount;
          } else {
            setShowWarningModal(true);
            return nextCount;
          }
        });
      }
    };

    document.addEventListener("visibilitychange", handleCheatDetection);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("visibilitychange", handleCheatDetection);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [attemptId, questions, answers, isSubmitting, isLoading]);

  const handleTimeUp = () => {
    handleSubmit();
  };

  const handleSelectOption = async (value: any) => {
    const current = questions[currentQuestion];
    selectAnswer(currentQuestion, value);

    if (!attemptId || !current) {
      return;
    }

    try {
      if (current.questionType === 'SUBJECTIVE') {
        await attemptService.saveAnswer(attemptId, {
          questionId: current.id,
          textAnswer: value,
        });
      } else {
        const optionMap = ["A", "B", "C", "D"];
        await attemptService.saveAnswer(attemptId, {
          questionId: current.id,
          selectedOption: optionMap[value as number],
        });
      }
    } catch (error) {
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
          if (selected === undefined || selected === "") return null;
          
          if (q.questionType === 'SUBJECTIVE') {
            return {
              questionId: q.id,
              textAnswer: selected as string,
            };
          }

          return {
            questionId: q.id,
            selectedOption: optionMap[selected as number],
          };
        })
        .filter(Boolean) as { questionId: string; selectedOption?: string; textAnswer?: string }[];

      const submitData = await attemptService.submitAttempt(
        attemptId,
        payloadAnswers,
        tabSwitchCount
      );

      const attemptResultId = submitData?.attemptId || submitData?.result?.attemptId || attemptId;

      if (document.exitFullscreen && document.fullscreenElement) {
        await document.exitFullscreen().catch(err => console.log(err));
      }

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

  if (fetchError) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-sm border w-full max-w-md p-6 text-center space-y-4">
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
            <span className="text-2xl">⚠️</span>
          </div>
          <h1 className="text-lg font-semibold text-gray-900 font-bold">Exam Access Blocked</h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            {fetchError}
          </p>
          <Button onClick={() => navigate("/student/dashboard")} fullWidth>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <Loader fullScreen text="Loading exam..." />;
  }

  if (!isFullscreen) {
    const isInitialStart = tabSwitchCount === 0;

    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-white">
        <div className="max-w-md w-full text-center space-y-6 bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl">
          <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mx-auto border border-blue-500/20">
            <span className="text-2xl">{isInitialStart ? "📝" : "🔒"}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold">
            {isInitialStart ? "Start Proctored Exam" : "Exam Interface Locked"}
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            {isInitialStart
              ? "To start writing this exam, please enter fullscreen mode. Your camera and tab activity will be monitored."
              : "Leaving fullscreen mode is not allowed during this proctored exam. A violation alert has been recorded."}
          </p>
          {!isInitialStart && (
            <div className="bg-slate-700/50 rounded-lg p-4 text-sm border border-slate-600">
              Anti-Cheat Violations: <span className="text-red-500 font-bold">{tabSwitchCount} / 3</span>
            </div>
          )}
          <button
            onClick={async () => {
              try {
                if (document.documentElement.requestFullscreen) {
                  await document.documentElement.requestFullscreen();
                  setIsFullscreen(true);
                }
              } catch (err) {
                console.error("Failed to request fullscreen:", err);
              }
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-lg text-sm"
          >
            {isInitialStart ? "Enter Fullscreen & Start Exam" : "Re-enter Fullscreen Mode"}
          </button>
        </div>
      </div>
    );
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
      {/* Anti-Cheat Warning Modal */}
      <Modal
        isOpen={showWarningModal}
        onClose={() => setShowWarningModal(false)}
        title="⚠️ Anti-Cheat Warning"
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 leading-relaxed">
            <span className="font-bold">Warning:</span> Tab-switching, window minimization, or leaving full screen has been detected!
          </div>
          <p className="text-gray-700 text-sm">
            Please focus on the exam screen. You have switched screens <span className="font-bold text-red-600">{tabSwitchCount} / 3</span> times.
          </p>
          <p className="text-sm font-semibold text-gray-800">
            If you switch screens 3 times, your exam will be automatically submitted immediately!
          </p>
          <div className="flex pt-2">
            <Button onClick={() => setShowWarningModal(false)} fullWidth>
              I Understand, Continue Exam
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Exam;
