import React, { useState, useRef } from "react";
import { useParams } from "react-router-dom";
import examService from "../../services/examService";

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

const CreateExam: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  // Refs
  const syllabusInputRef = useRef<HTMLInputElement>(null);

  // Exam Details State
  const [examTitle, setExamTitle] = useState("");
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [duration, setDuration] = useState(60);
  const [randomizeQuestions, setRandomizeQuestions] = useState(false);
  const [examStatus, setExamStatus] = useState<"DRAFT" | "PUBLISHED">("DRAFT");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // AI generation parameters
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [questionType] = useState<string>("MCQ");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium",
  );

  // Syllabus Upload State
  const [syllabusFile, setSyllabusFile] = useState<File | null>(null);
  const [isUploadingOnlySyllabus, setIsUploadingOnlySyllabus] = useState(false);

  // Questions State
  const [questions, setQuestions] = useState<Question[]>([]);

  // Edit Modal State
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    question: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
  });

  // Validation
  const [validationError, setValidationError] = useState("");
  const [savedExamId, setSavedExamId] = useState<string | null>(examId ?? null);

  const branches = [
    { value: "CSD", label: "CSD - Computer Science & Design" },
    { value: "CSE", label: "CSE - Computer Science & Engineering" },
    { value: "AIDS", label: "AIDS - AI & Data Science" },
    { value: "IT", label: "IT - Information Technology" },
    { value: "ECE", label: "ECE - Electronics & Communication" },
    { value: "EEE", label: "EEE - Electrical & Electronics" },
  ];

  const years = [
    { value: "1", label: "1st Year" },
    { value: "2", label: "2nd Year" },
    { value: "3", label: "3rd Year" },
    { value: "4", label: "4th Year" },
  ];

  // File handlers
  const handleSyllabusUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSyllabusFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSyllabusFile(file);
    }
  };

  const handleRemoveSyllabus = () => {
    setSyllabusFile(null);
    if (syllabusInputRef.current) {
      syllabusInputRef.current.value = "";
    }
  };

  // Ensure there is a draft exam in backend, creating it if needed
  const ensureExamExists = async (): Promise<string> => {
    if (savedExamId) {
      return savedExamId;
    }

    if (!examTitle.trim()) {
      throw new Error(
        "Please enter an exam title before generating questions.",
      );
    }
    if (!branch || !year) {
      throw new Error(
        "Please select branch and year before generating questions.",
      );
    }

    const createResponse = await examService.createExam({
      title: examTitle,
      description: null,
      branch,
      year: Number(year),
      durationMinutes: duration,
      passPercentage: 40,
      randomizeQuestions,
    });

    const newExamId = createResponse.data.exam.id;
    setSavedExamId(newExamId);
    setExamStatus("DRAFT");
    return newExamId;
  };

  // Shared helper to call backend for question generation
  const performQuestionGeneration = async () => {
    const activeExamId = await ensureExamExists();

    if (!syllabusFile) {
      throw new Error("Please upload a syllabus file before generating.");
    }

    const formData = new FormData();
    formData.append("syllabus", syllabusFile);
    formData.append("questionCount", String(questionCount));

    await examService.uploadSyllabus(activeExamId, formData);

    const generated = await examService.generateQuestions(activeExamId, {
      count: questionCount,
      questionType,
      difficulty,
    });

    const backendQuestions = Array.isArray(generated?.questions)
      ? generated.questions
      : [];

    const optionIndexMap: Record<string, number> = {
      A: 0,
      B: 1,
      C: 2,
      D: 3,
    };

    const mappedQuestions: Question[] = backendQuestions
      .map((q: any, index: number): Question | null => {
        const questionText = (q.question_text || q.questionText || "")
          .toString()
          .trim();
        const options = [
          q.option_a || q.optionA || "",
          q.option_b || q.optionB || "",
          q.option_c || q.optionC || "",
          q.option_d || q.optionD || "",
        ].map((opt) => opt.toString().trim());
        const correctLetter = (q.correct_option || q.correctOption || "")
          .toString()
          .toUpperCase();
        const correctAnswerIndex = optionIndexMap[correctLetter];

        if (!questionText) return null;
        if (options.length !== 4 || options.some((opt) => !opt)) return null;
        if (correctAnswerIndex === undefined) return null;

        return {
          id: q.id || index + 1,
          question: questionText,
          options,
          correctAnswer: correctAnswerIndex,
        };
      })
      .filter((q: Question | null): q is Question => q !== null);

    if (mappedQuestions.length === 0) {
      throw new Error("No valid questions were generated. Please try again.");
    }

    setQuestions(mappedQuestions);

    const requested = Number(generated?.requested ?? questionCount);
    const generatedCount = Number(
      generated?.generated ?? mappedQuestions.length,
    );

    if (
      Number.isFinite(requested) &&
      Number.isFinite(generatedCount) &&
      generatedCount < requested
    ) {
      setSuccessMessage(
        `Generated ${generatedCount} valid questions out of ${requested} requested. Some were skipped due to validation.`,
      );
      return;
    }

    setSuccessMessage(
      `Generated ${mappedQuestions.length} questions successfully.`,
    );
  };

  const handleGenerateFromSyllabus = async () => {
    setValidationError("");
    setSuccessMessage("");
    setIsUploadingOnlySyllabus(true);
    try {
      await performQuestionGeneration();
    } catch (error: any) {
      setValidationError(error?.message || "Failed to generate questions.");
    } finally {
      setIsUploadingOnlySyllabus(false);
    }
  };

  const handleGenerateQuestions = async () => {
    setValidationError("");
    setSuccessMessage("");
    setIsGenerating(true);
    try {
      await performQuestionGeneration();
    } catch (error: any) {
      setValidationError(error?.message || "Failed to generate questions.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublish = async () => {
    setValidationError("");
    setSuccessMessage("");

    if (!examTitle.trim()) {
      setValidationError("Please enter an exam title");
      return;
    }
    if (!branch) {
      setValidationError("Please select a branch");
      return;
    }
    if (!year) {
      setValidationError("Please select a year");
      return;
    }
    if (questions.length === 0) {
      setValidationError("Please add at least one question");
      return;
    }

    try {
      setIsPublishing(true);
      let targetExamId = savedExamId;

      if (!targetExamId) {
        const createResponse = await examService.createExam({
          title: examTitle,
          description: null,
          branch,
          year: Number(year),
          durationMinutes: duration,
          passPercentage: 40,
          randomizeQuestions,
        });

        targetExamId = createResponse.data.exam.id;
        setSavedExamId(targetExamId);
      }

      if (!targetExamId) {
        throw new Error("Unable to determine exam id for publishing.");
      }

      const finalExamId: string = targetExamId;

      const mappedQuestions = questions.map((q) => ({
        questionText: q.question,
        optionA: q.options[0],
        optionB: q.options[1],
        optionC: q.options[2],
        optionD: q.options[3],
        correctOption: ["A", "B", "C", "D"][q.correctAnswer],
        marks: 1,
      }));

      await examService.createQuestionsBulk(finalExamId, mappedQuestions);
      await examService.publishExam(finalExamId);

      setExamStatus("PUBLISHED");
      setSuccessMessage("Exam published successfully");
    } catch (error: any) {
      setValidationError(
        error?.message || "Failed to publish exam. Please try again.",
      );
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDeleteQuestion = (id: number) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion({ ...question });
  };

  const handleSaveEdit = () => {
    if (!editingQuestion) return;
    setQuestions(
      questions.map((q) => (q.id === editingQuestion.id ? editingQuestion : q)),
    );
    setEditingQuestion(null);
  };

  const handleAddQuestion = () => {
    if (!newQuestion.question.trim()) return;

    const question: Question = {
      id: questions.length + 1,
      question: newQuestion.question,
      options: newQuestion.options,
      correctAnswer: newQuestion.correctAnswer,
    };
    setQuestions([...questions, question]);
    setNewQuestion({
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
    });
    setShowAddModal(false);
  };

  const canPublish = examTitle.trim() && branch && year && questions.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Page Header */}
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">
            Exam Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Create and manage exams for your students
          </p>
        </div>

        {/* Exam Creation Card */}
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Create New Exam
          </h2>

          <div className="space-y-5">
            {/* Exam Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Exam Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={examTitle}
                onChange={(e) => setExamTitle(e.target.value)}
                placeholder="e.g., Mid Semester Examination - Operating Systems"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Branch and Year - Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Branch <span className="text-red-500">*</span>
                </label>
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                >
                  <option value="">Select Branch</option>
                  {branches.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Year <span className="text-red-500">*</span>
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                >
                  <option value="">Select Year</option>
                  {years.map((y) => (
                    <option key={y.value} value={y.value}>
                      {y.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Duration (minutes)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                min={10}
                max={180}
                className="w-full sm:w-48 px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            {/* AI Generation Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Count
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={questionCount}
                  onChange={(e) =>
                    setQuestionCount(
                      Math.min(30, Math.max(1, Number(e.target.value) || 1)),
                    )
                  }
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Question Type
                </label>
                <input
                  type="text"
                  value={questionType}
                  disabled
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={(e) =>
                    setDifficulty(e.target.value as "easy" | "medium" | "hard")
                  }
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            {/* Randomize Toggle */}
            <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Randomize Questions
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Shuffle question order for each student
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRandomizeQuestions(!randomizeQuestions)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  randomizeQuestions ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    randomizeQuestions ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Validation Error */}
            {validationError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {validationError}
              </div>
            )}
            {successMessage && !validationError && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                {successMessage}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-2">
              <button
                type="button"
                onClick={handleGenerateQuestions}
                disabled={isGenerating}
                className="px-5 py-2.5 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    Generate Questions (AI)
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handlePublish}
                disabled={
                  !canPublish || examStatus === "PUBLISHED" || isPublishing
                }
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {examStatus === "PUBLISHED"
                  ? "Published"
                  : isPublishing
                    ? "Publishing..."
                    : "Publish Exam"}
              </button>
            </div>
          </div>
        </div>

        {/* Upload Syllabus Card */}
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Upload Syllabus
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Upload your syllabus as PDF or text file. AI will generate questions
            based on the content.
          </p>

          {/* Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 sm:p-8 text-center hover:border-blue-400 transition-colors bg-gray-50"
          >
            {syllabusFile ? (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-800">
                  {syllabusFile.name}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {(syllabusFile.size / 1024).toFixed(1)} KB
                </p>
                <button
                  type="button"
                  onClick={handleRemoveSyllabus}
                  className="mt-3 text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-700">
                  Drag & drop your syllabus here
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  or{" "}
                  <button
                    type="button"
                    onClick={() => syllabusInputRef.current?.click()}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    browse files
                  </button>
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Supports PDF, DOC, TXT (max 10 MB)
                </p>
              </div>
            )}
            <input
              ref={syllabusInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleSyllabusUpload}
              className="hidden"
            />
          </div>

          {/* Generate from Syllabus Button */}
          <button
            type="button"
            onClick={handleGenerateFromSyllabus}
            disabled={!syllabusFile || isUploadingOnlySyllabus}
            className="mt-4 w-full sm:w-auto px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isUploadingOnlySyllabus ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Generating from Syllabus...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Generate Questions from Syllabus
              </>
            )}
          </button>
        </div>

        {/* Exam Preview Card */}
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Exam Preview
          </h2>

          <div className="flex flex-wrap gap-3 items-center">
            {/* Branch Badge */}
            {branch ? (
              <span className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                <svg
                  className="w-4 h-4 mr-1.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                {branch}
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-500 rounded-full text-sm">
                No Branch Selected
              </span>
            )}

            {/* Year Badge */}
            {year ? (
              <span className="inline-flex items-center px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                <svg
                  className="w-4 h-4 mr-1.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
                {years.find((y) => y.value === year)?.label}
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-500 rounded-full text-sm">
                No Year Selected
              </span>
            )}

            {/* Status Badge */}
            <span
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                examStatus === "PUBLISHED"
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full mr-2 ${
                  examStatus === "PUBLISHED" ? "bg-green-500" : "bg-yellow-500"
                }`}
              />
              {examStatus}
            </span>

            {/* Questions Count */}
            <span className="inline-flex items-center px-3 py-1.5 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
              <svg
                className="w-4 h-4 mr-1.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {questions.length} Questions
            </span>

            {/* Duration */}
            <span className="inline-flex items-center px-3 py-1.5 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
              <svg
                className="w-4 h-4 mr-1.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {duration} mins
            </span>
          </div>
        </div>

        {/* Questions Section */}
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Questions</h2>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Add Question
            </button>
          </div>

          {questions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <svg
                className="w-12 h-12 mx-auto mb-3 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p>No questions added yet</p>
              <p className="text-sm mt-1">
                Click "Add Question" or "Generate Questions (AI)" to get started
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((q, index) => (
                <div
                  key={q.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-200 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 text-sm sm:text-base">
                        <span className="text-blue-600 mr-2">
                          Q{index + 1}.
                        </span>
                        {q.question}
                      </p>
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((option, optIndex) => (
                          <div
                            key={optIndex}
                            className={`flex items-center gap-2 px-3 py-2 rounded text-sm ${
                              optIndex === q.correctAnswer
                                ? "bg-green-50 text-green-800 border border-green-200"
                                : "bg-gray-50 text-gray-700"
                            }`}
                          >
                            <span className="font-medium">
                              {String.fromCharCode(65 + optIndex)}.
                            </span>
                            <span>{option}</span>
                            {optIndex === q.correctAnswer && (
                              <svg
                                className="w-4 h-4 ml-auto text-green-600"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 sm:flex-col">
                      <button
                        type="button"
                        onClick={() => handleEditQuestion(q)}
                        className="flex-1 sm:flex-none px-3 py-1.5 text-blue-600 border border-blue-200 rounded hover:bg-blue-50 transition-colors text-sm"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="flex-1 sm:flex-none px-3 py-1.5 text-red-600 border border-red-200 rounded hover:bg-red-50 transition-colors text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Question Modal */}
      {editingQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Edit Question
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingQuestion(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Question
                  </label>
                  <textarea
                    value={editingQuestion.question}
                    onChange={(e) =>
                      setEditingQuestion({
                        ...editingQuestion,
                        question: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Options
                  </label>
                  <div className="space-y-2">
                    {editingQuestion.options.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={editingQuestion.correctAnswer === index}
                          onChange={() =>
                            setEditingQuestion({
                              ...editingQuestion,
                              correctAnswer: index,
                            })
                          }
                          className="text-blue-600"
                        />
                        <span className="text-sm font-medium text-gray-600 w-6">
                          {String.fromCharCode(65 + index)}.
                        </span>
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...editingQuestion.options];
                            newOptions[index] = e.target.value;
                            setEditingQuestion({
                              ...editingQuestion,
                              options: newOptions,
                            });
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Select the radio button to mark the correct answer
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingQuestion(null)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Question Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Add New Question
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Question
                  </label>
                  <textarea
                    value={newQuestion.question}
                    onChange={(e) =>
                      setNewQuestion({
                        ...newQuestion,
                        question: e.target.value,
                      })
                    }
                    rows={3}
                    placeholder="Enter your question here..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Options
                  </label>
                  <div className="space-y-2">
                    {newQuestion.options.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="newCorrectAnswer"
                          checked={newQuestion.correctAnswer === index}
                          onChange={() =>
                            setNewQuestion({
                              ...newQuestion,
                              correctAnswer: index,
                            })
                          }
                          className="text-blue-600"
                        />
                        <span className="text-sm font-medium text-gray-600 w-6">
                          {String.fromCharCode(65 + index)}.
                        </span>
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...newQuestion.options];
                            newOptions[index] = e.target.value;
                            setNewQuestion({
                              ...newQuestion,
                              options: newOptions,
                            });
                          }}
                          placeholder={`Option ${String.fromCharCode(65 + index)}`}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Select the radio button to mark the correct answer
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    disabled={!newQuestion.question.trim()}
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Question
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateExam;
