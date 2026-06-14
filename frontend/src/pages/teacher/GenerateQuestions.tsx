/**
 * Generate Questions from Uploaded Syllabus Page
 * Allows teachers to generate custom questions from uploaded syllabus
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Copy,
  Download,
  RotateCcw,
  Sparkles,
  Loader as LoaderIcon,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

interface GenerateFormState {
  department: string;
  year: string;
  subject: string;
  questionType: string;
  difficulty: string;
  numQuestions: string;
  prompt: string;
  additionalInstructions: string;
}

interface GeneratedQuestion {
  question: string;
  options?: string[];
}

interface GeneratedQuestionsData {
  department: string;
  year: string;
  subject: string;
  questionType: string;
  difficulty: string;
  questions: GeneratedQuestion[];
}

const GenerateQuestions: React.FC = () => {
  const { user } = useAuth();
  const [generateFormState, setGenerateFormState] = useState<GenerateFormState>(
    {
      department: "",
      year: "",
      subject: "",
      questionType: "",
      difficulty: "",
      numQuestions: "",
      prompt: "",
      additionalInstructions: "",
    },
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] =
    useState<GeneratedQuestionsData | null>(null);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [publishFormState, setPublishFormState] = useState({
    examName: "",
    description: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    duration: "60",
    totalMarks: "100",
  });
  const [isPublishing, setIsPublishing] = useState(false);

  // Fetch subjects when department and year change
  useEffect(() => {
    const fetchSubjects = async () => {
      if (generateFormState.department && generateFormState.year) {
        setLoadingSubjects(true);
        setError(null);
        try {
          const response = await api.get("/teacher/subjects", {
            params: {
              department: generateFormState.department,
              year: generateFormState.year,
            },
          });
          setSubjects(response.data);
          // Reset subject selection when department or year changes
          setGenerateFormState((prev) => ({
            ...prev,
            subject: "",
          }));
        } catch (err: any) {
          setError(
            err.response?.data?.message ||
              "Failed to load subjects. Please try again.",
          );
          setSubjects([]);
        } finally {
          setLoadingSubjects(false);
        }
      }
    };

    fetchSubjects();
  }, [generateFormState.department, generateFormState.year]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setError(null);
    setGenerateFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Validate form
  const isFormValid = useCallback(() => {
    return (
      generateFormState.department &&
      generateFormState.year &&
      generateFormState.subject &&
      generateFormState.questionType &&
      generateFormState.difficulty &&
      generateFormState.numQuestions &&
      parseInt(generateFormState.numQuestions) > 0 &&
      generateFormState.prompt
    );
  }, [generateFormState]);

  const handleGenerateQuestions = async () => {
    if (!isFormValid()) {
      setError("Please fill all required fields");
      return;
    }

    if (!user?.id) {
      setError("User information not found");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const payload = {
        type: "teacher",
        department: generateFormState.department,
        year: generateFormState.year,
        subject: generateFormState.subject,
        questionType: generateFormState.questionType,
        difficulty: generateFormState.difficulty,
        numberOfQuestions: parseInt(generateFormState.numQuestions),
        prompt: generateFormState.prompt,
        additionalInstructions: generateFormState.additionalInstructions,
      };

      const response = await api.post("/teacher/generate-questions", payload);

      if (response.data.success) {
        setGeneratedQuestions({
          department: generateFormState.department,
          year: generateFormState.year,
          subject: generateFormState.subject,
          questionType: generateFormState.questionType,
          difficulty: generateFormState.difficulty,
          questions: response.data.data.questions,
        });
        setSuccessMessage("Questions generated successfully!");
      } else {
        setError(response.data.message || "Failed to generate questions");
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to generate questions. Please try again.";
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = () => {
    setGeneratedQuestions(null);
    setSuccessMessage(null);
    setGenerateFormState((prev) => ({
      ...prev,
      prompt: "",
      additionalInstructions: "",
    }));
  };

  const copyToClipboard = () => {
    if (generatedQuestions) {
      const questionsText = generatedQuestions.questions
        .map(
          (q, idx) =>
            `${idx + 1}. ${q.question}${
              q.options
                ? "\n" +
                  q.options
                    .map(
                      (opt, i) => `   ${String.fromCharCode(65 + i)}) ${opt}`,
                    )
                    .join("\n")
                : ""
            }`,
        )
        .join("\n\n");

      navigator.clipboard.writeText(questionsText);
      setSuccessMessage("Questions copied to clipboard!");
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handlePublishExam = async () => {
    if (
      !publishFormState.examName ||
      !publishFormState.startDate ||
      !publishFormState.endDate
    ) {
      setError("Please fill exam name, start date, and end date");
      return;
    }

    if (!generatedQuestions) {
      setError("No questions to publish");
      return;
    }

    setIsPublishing(true);
    setError(null);

    try {
      const payload = {
        examName: publishFormState.examName,
        description: publishFormState.description,
        subject: generatedQuestions.subject,
        department: generatedQuestions.department,
        year: generatedQuestions.year,
        startDate: publishFormState.startDate,
        startTime: publishFormState.startTime,
        endDate: publishFormState.endDate,
        endTime: publishFormState.endTime,
        duration: parseInt(publishFormState.duration),
        totalMarks: parseInt(publishFormState.totalMarks),
        questions: generatedQuestions.questions,
      };

      const response = await api.post("/exams/publish", payload);

      if (response.data.success) {
        setSuccessMessage("Exam published successfully!");
        setGeneratedQuestions(null);
        setPublishFormState({
          examName: "",
          description: "",
          startDate: "",
          startTime: "",
          endDate: "",
          endTime: "",
          duration: "60",
          totalMarks: "100",
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to publish exam");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 sm:mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-blue-600" />
          Generate Questions from Uploaded Syllabus
        </h1>
        <p className="text-gray-600 mt-2 text-sm sm:text-base">
          Select subject details and generate custom questions using the
          uploaded syllabus
        </p>
      </div>

      {/* Features Grid */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100">
              <svg
                className="w-5 h-5 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5.36-5.364l.707-.707M5.36 18.364l.707-.707"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-sm text-slate-900">
              Quick Generation
            </h3>
          </div>
          <p className="text-xs text-slate-600">
            Generate questions instantly with AI-powered prompts
          </p>
        </div>

        <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100">
              <svg
                className="w-5 h-5 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-sm text-slate-900">
              Customizable
            </h3>
          </div>
          <p className="text-xs text-slate-600">
            Adjust difficulty, type, and quantity to your needs
          </p>
        </div>

        <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100">
              <svg
                className="w-5 h-5 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-sm text-slate-900">
              Varied Types
            </h3>
          </div>
          <p className="text-xs text-slate-600">
            MCQ, Descriptive, Long answers, and more
          </p>
        </div>

        <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100">
              <svg
                className="w-5 h-5 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-sm text-slate-900">
              Easy Export
            </h3>
          </div>
          <p className="text-xs text-slate-600">
            Download as PDF or copy to clipboard
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 rounded-lg border border-red-200 bg-red-50">
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 rounded-lg border border-green-200 bg-green-50">
          <p className="text-sm text-green-700 font-medium">{successMessage}</p>
        </div>
      )}

      {/* Main Content */}
      <div className="space-y-6">
        {/* Form & Results Section */}
        <div>
          <div className="relative overflow-hidden rounded-2xl border border-blue-100/80 bg-white/90 shadow-[0_20px_50px_-30px_rgba(30,64,175,0.45)] backdrop-blur-sm">
            <div className="pointer-events-none absolute -top-24 -right-20 h-56 w-56 rounded-full bg-blue-100/70 blur-3xl" />
            <div className="p-5 sm:p-7 space-y-6 relative">
              {/* Row 1: Department, Year, Subject */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100">
                    <svg
                      className="w-4 h-4 text-blue-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Subject Details
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="text-sm font-medium text-slate-700">
                    Department *
                    <select
                      name="department"
                      value={generateFormState.department}
                      onChange={handleInputChange}
                      className="mt-2 w-full rounded-lg border border-blue-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                    >
                      <option value="">Select department</option>
                      <option value="CSE">CSE</option>
                      <option value="CSD">CSD</option>
                      <option value="CSIT">CSIT</option>
                      <option value="AIML">AIML</option>
                      <option value="AIDS">AIDS</option>
                      <option value="IT">IT</option>
                      <option value="Mechanical">Mechanical</option>
                      <option value="Civil">Civil</option>
                    </select>
                  </label>

                  <label className="text-sm font-medium text-slate-700">
                    Year *
                    <select
                      name="year"
                      value={generateFormState.year}
                      onChange={handleInputChange}
                      className="mt-2 w-full rounded-lg border border-blue-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                    >
                      <option value="">Select year</option>
                      <option value="1-1">1-1</option>
                      <option value="1-2">1-2</option>
                      <option value="2-1">2-1</option>
                      <option value="2-2">2-2</option>
                      <option value="3-1">3-1</option>
                      <option value="3-2">3-2</option>
                      <option value="4-1">4-1</option>
                      <option value="4-2">4-2</option>
                    </select>
                  </label>

                  <label className="text-sm font-medium text-slate-700">
                    Subject Name *
                    <select
                      name="subject"
                      value={generateFormState.subject}
                      onChange={handleInputChange}
                      disabled={loadingSubjects || !subjects.length}
                      className="mt-2 w-full rounded-lg border border-blue-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {loadingSubjects
                          ? "Loading subjects..."
                          : "Select subject"}
                      </option>
                      {subjects.map((subj) => (
                        <option key={subj} value={subj}>
                          {subj}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              {/* Row 2: Question Type, Difficulty, Number of Questions */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100">
                    <svg
                      className="w-4 h-4 text-blue-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Question Configuration
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="text-sm font-medium text-slate-700">
                    Question Type *
                    <select
                      name="questionType"
                      value={generateFormState.questionType}
                      onChange={handleInputChange}
                      className="mt-2 w-full rounded-lg border border-blue-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                    >
                      <option value="">Select question type</option>
                      <option value="MCQ">MCQ</option>
                      <option value="Descriptive">Descriptive</option>
                      <option value="2 Marks">2 Marks</option>
                      <option value="5 Marks">5 Marks</option>
                      <option value="Long Answer">Long Answer</option>
                      <option value="Viva Questions">Viva Questions</option>
                    </select>
                  </label>

                  <label className="text-sm font-medium text-slate-700">
                    Difficulty Level *
                    <select
                      name="difficulty"
                      value={generateFormState.difficulty}
                      onChange={handleInputChange}
                      className="mt-2 w-full rounded-lg border border-blue-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                    >
                      <option value="">Select difficulty</option>
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </label>

                  <label className="text-sm font-medium text-slate-700">
                    Number of Questions *
                    <input
                      type="number"
                      name="numQuestions"
                      min="1"
                      max="50"
                      placeholder="Enter number of questions"
                      value={generateFormState.numQuestions}
                      onChange={handleInputChange}
                      className="mt-2 w-full rounded-lg border border-blue-200 bg-white px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                  </label>
                </div>
              </div>

              {/* Prompt Textarea */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100">
                    <svg
                      className="w-4 h-4 text-blue-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Generation Prompt
                  </h3>
                </div>
                <label className="text-sm font-medium text-slate-700 block">
                  Prompt *
                  <textarea
                    name="prompt"
                    placeholder="Example: Generate 5 difficult descriptive questions from Unit 1 focusing on CPU scheduling and synchronization."
                    value={generateFormState.prompt}
                    onChange={handleInputChange}
                    rows={4}
                    className="mt-2 w-full rounded-lg border border-blue-200 bg-white px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                  />
                </label>
              </div>

              {/* Generate Button */}
              <div className="flex justify-end pt-4 border-t-2 border-blue-100">
                <button
                  onClick={handleGenerateQuestions}
                  disabled={!isFormValid() || isGenerating}
                  className={`inline-flex items-center gap-2 px-8 py-3 rounded-lg text-white text-sm font-semibold transition-all shadow-lg ${
                    isFormValid() && !isGenerating
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl cursor-pointer"
                      : "bg-slate-400 cursor-not-allowed opacity-60"
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <LoaderIcon className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Questions
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Questions Section */}
        <div className="mt-8">
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="p-5 sm:p-7">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-slate-900">Questions</h2>
                {generatedQuestions && (
                  <button
                    onClick={() => alert("Add Question feature coming soon")}
                    className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Add Question
                  </button>
                )}
              </div>

              {/* Loading State */}
              {isGenerating && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <LoaderIcon className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                  <p className="text-lg text-slate-600 font-medium">
                    Generating questions from uploaded syllabus...
                  </p>
                </div>
              )}

              {/* Empty State */}
              {!generatedQuestions && !isGenerating && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <svg
                    className="w-16 h-16 text-slate-300 mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="text-lg font-semibold text-slate-600 mb-2">
                    No questions added yet
                  </p>
                  <p className="text-sm text-slate-500">
                    Click "Generate Questions" or "Add Question" to get started
                  </p>
                </div>
              )}

              {/* Questions List */}
              {generatedQuestions && !isGenerating && (
                <div className="space-y-6">
                  {/* Details Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pb-6 border-b border-slate-200">
                    <div className="text-sm">
                      <p className="text-slate-500 text-xs font-medium mb-1">
                        Department
                      </p>
                      <p className="text-slate-900 font-semibold">
                        {generatedQuestions.department}
                      </p>
                    </div>
                    <div className="text-sm">
                      <p className="text-slate-500 text-xs font-medium mb-1">
                        Year
                      </p>
                      <p className="text-slate-900 font-semibold">
                        {generatedQuestions.year}
                      </p>
                    </div>
                    <div className="text-sm">
                      <p className="text-slate-500 text-xs font-medium mb-1">
                        Subject
                      </p>
                      <p className="text-slate-900 font-semibold">
                        {generatedQuestions.subject}
                      </p>
                    </div>
                    <div className="text-sm">
                      <p className="text-slate-500 text-xs font-medium mb-1">
                        Type
                      </p>
                      <p className="text-slate-900 font-semibold">
                        {generatedQuestions.questionType}
                      </p>
                    </div>
                    <div className="text-sm">
                      <p className="text-slate-500 text-xs font-medium mb-1">
                        Difficulty
                      </p>
                      <p className="text-slate-900 font-semibold">
                        {generatedQuestions.difficulty}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 flex-wrap mb-6">
                    <button
                      onClick={copyToClipboard}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                      Copy
                    </button>
                    <button
                      onClick={() => alert("PDF download feature coming soon")}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download PDF
                    </button>
                    <button
                      onClick={handleRegenerate}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Regenerate
                    </button>
                  </div>

                  {/* Questions Display */}
                  <div className="space-y-6">
                    {generatedQuestions.questions.map((question, idx) => (
                      <div key={idx} className="space-y-3">
                        <p className="font-medium text-slate-900 text-base">
                          {idx + 1}. {question.question}
                        </p>
                        {question.options && (
                          <div className="ml-6 space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-100">
                            {question.options.map((option, optIdx) => (
                              <p
                                key={optIdx}
                                className="text-sm text-slate-700"
                              >
                                {String.fromCharCode(65 + optIdx)}) {option}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Publish Exam Section */}
        {generatedQuestions && (
          <div className="mt-8">
            <div className="relative overflow-hidden rounded-2xl border border-green-100 bg-gradient-to-br from-green-50 to-white shadow-sm">
              <div className="p-5 sm:p-7 space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-100">
                    <svg
                      className="w-4 h-4 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m7 0a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    Publish Exam
                  </h2>
                </div>

                {/* Exam Details */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-sm font-semibold text-slate-900">
                      Exam Information
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="text-sm font-medium text-slate-700">
                      Exam Name *
                      <input
                        type="text"
                        placeholder="e.g., Operating Systems Midterm"
                        value={publishFormState.examName}
                        onChange={(e) =>
                          setPublishFormState((prev) => ({
                            ...prev,
                            examName: e.target.value,
                          }))
                        }
                        className="mt-2 w-full rounded-lg border border-green-200 bg-white px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all"
                      />
                    </label>

                    <label className="text-sm font-medium text-slate-700">
                      Total Marks *
                      <input
                        type="number"
                        min="1"
                        value={publishFormState.totalMarks}
                        onChange={(e) =>
                          setPublishFormState((prev) => ({
                            ...prev,
                            totalMarks: e.target.value,
                          }))
                        }
                        className="mt-2 w-full rounded-lg border border-green-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all"
                      />
                    </label>
                  </div>

                  <label className="text-sm font-medium text-slate-700">
                    Description
                    <textarea
                      placeholder="Add exam instructions or description"
                      value={publishFormState.description}
                      onChange={(e) =>
                        setPublishFormState((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      rows={3}
                      className="mt-2 w-full rounded-lg border border-green-200 bg-white px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all resize-none"
                    />
                  </label>
                </div>

                {/* Date & Time */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-sm font-semibold text-slate-900">
                      Exam Schedule
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="text-sm font-medium text-slate-700">
                      Start Date *
                      <input
                        type="date"
                        value={publishFormState.startDate}
                        onChange={(e) =>
                          setPublishFormState((prev) => ({
                            ...prev,
                            startDate: e.target.value,
                          }))
                        }
                        className="mt-2 w-full rounded-lg border border-green-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all"
                      />
                    </label>

                    <label className="text-sm font-medium text-slate-700">
                      Start Time
                      <input
                        type="time"
                        value={publishFormState.startTime}
                        onChange={(e) =>
                          setPublishFormState((prev) => ({
                            ...prev,
                            startTime: e.target.value,
                          }))
                        }
                        className="mt-2 w-full rounded-lg border border-green-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all"
                      />
                    </label>

                    <label className="text-sm font-medium text-slate-700">
                      End Date *
                      <input
                        type="date"
                        value={publishFormState.endDate}
                        onChange={(e) =>
                          setPublishFormState((prev) => ({
                            ...prev,
                            endDate: e.target.value,
                          }))
                        }
                        className="mt-2 w-full rounded-lg border border-green-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all"
                      />
                    </label>

                    <label className="text-sm font-medium text-slate-700">
                      End Time
                      <input
                        type="time"
                        value={publishFormState.endTime}
                        onChange={(e) =>
                          setPublishFormState((prev) => ({
                            ...prev,
                            endTime: e.target.value,
                          }))
                        }
                        className="mt-2 w-full rounded-lg border border-green-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all"
                      />
                    </label>

                    <label className="text-sm font-medium text-slate-700">
                      Duration (minutes) *
                      <input
                        type="number"
                        min="15"
                        step="15"
                        value={publishFormState.duration}
                        onChange={(e) =>
                          setPublishFormState((prev) => ({
                            ...prev,
                            duration: e.target.value,
                          }))
                        }
                        className="mt-2 w-full rounded-lg border border-green-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all"
                      />
                    </label>
                  </div>
                </div>

                {/* Publish Button */}
                <div className="flex justify-end pt-4 border-t-2 border-green-100">
                  <button
                    onClick={handlePublishExam}
                    disabled={isPublishing}
                    className={`inline-flex items-center gap-2 px-8 py-3 rounded-lg text-white text-sm font-semibold transition-all shadow-lg ${
                      !isPublishing
                        ? "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 hover:shadow-xl cursor-pointer"
                        : "bg-slate-400 cursor-not-allowed opacity-60"
                    }`}
                  >
                    {isPublishing ? (
                      <>
                        <LoaderIcon className="w-4 h-4 animate-spin" />
                        Publishing...
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                          />
                        </svg>
                        Publish Exam
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerateQuestions;
