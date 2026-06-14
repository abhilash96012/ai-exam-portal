import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import examService from "../../services/examService";

interface ExamData {
  id: string;
  title: string;
  subject: string;
  branch: string;
  semester: string;
  duration: number;
  totalQuestions: number;
  difficulty: string;
  status: string;
}

const EditExam: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<ExamData>({
    id: "",
    title: "",
    subject: "",
    branch: "",
    semester: "",
    duration: 60,
    totalQuestions: 10,
    difficulty: "MEDIUM",
    status: "DRAFT",
  });

  useEffect(() => {
    const fetchExam = async () => {
      try {
        if (!examId) {
          throw new Error("Missing exam id");
        }

        const response = await examService.getExamById(examId);
        const exam = response.data?.exam ?? response.exam ?? response;

        setFormData({
          id: exam.id,
          title: exam.title ?? "",
          subject: exam.description ?? "",
          branch: exam.branch ?? "",
          semester: String(exam.year ?? ""),
          duration: exam.duration_minutes ?? exam.durationMinutes ?? 60,
          totalQuestions: exam.total_questions ?? exam.totalQuestions ?? 10,
          difficulty: "MEDIUM",
          status: exam.status ?? "DRAFT",
        });
      } catch (err) {
        setError("Failed to load exam details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchExam();
  }, [examId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "duration" || name === "totalQuestions"
          ? Number(value)
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      if (!examId) {
        throw new Error("Missing exam id");
      }

      await examService.updateExam(examId, {
        title: formData.title,
        description: formData.subject,
        branch: formData.branch,
        year: Number(formData.semester) || undefined,
        durationMinutes: formData.duration,
      });
      navigate(`/teacher/exams/${examId}`);
    } catch (err) {
      setError("Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <Loader fullScreen text="Loading exam..." />;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            Edit Exam
          </h1>
          <p className="text-gray-500 text-sm sm:text-base">
            Update exam details
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow p-4 sm:p-6 space-y-4 sm:space-y-6"
        >
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Exam Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Branch
              </label>
              <select
                name="branch"
                value={formData.branch}
                onChange={handleChange}
                required
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              >
                <option value="">Select Branch</option>
                <option value="CSE">Computer Science</option>
                <option value="IT">Information Technology</option>
                <option value="ECE">Electronics</option>
                <option value="ME">Mechanical</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Semester
              </label>
              <select
                name="semester"
                value={formData.semester}
                onChange={handleChange}
                required
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              >
                <option value="">Select Semester</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <option key={sem} value={sem}>
                    Semester {sem}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Difficulty
              </label>
              <select
                name="difficulty"
                value={formData.difficulty}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (minutes)
              </label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                min={10}
                max={180}
                required
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Questions
              </label>
              <input
                type="number"
                name="totalQuestions"
                value={formData.totalQuestions}
                onChange={handleChange}
                min={5}
                max={100}
                required
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 sm:pt-4">
            <Button type="submit" isLoading={isSaving} fullWidth>
              Save Changes
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(-1)}
              fullWidth
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditExam;
