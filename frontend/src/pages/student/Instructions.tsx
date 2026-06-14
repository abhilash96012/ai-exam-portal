import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";

const Instructions: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();

  const instructions = [
    "This exam has a time limit. Once started, the timer cannot be paused.",
    "You can navigate between questions using the question navigator on the right.",
    "You can change your answers before submitting the exam.",
    "The exam will auto-submit when the timer reaches zero.",
    "Make sure you have a stable internet connection throughout the exam.",
    "Do not refresh the page or navigate away during the exam.",
    "Each correct answer carries equal marks. There is no negative marking.",
    "Review all your answers before final submission.",
  ];

  const handleStartExam = () => {
    navigate(`/student/exam/${examId}`);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow overflow-hidden">
        <div className="bg-blue-600 p-4 sm:p-6 text-white">
          <h1 className="text-xl sm:text-2xl font-bold">Exam Instructions</h1>
          <p className="mt-1 opacity-90 text-sm sm:text-base">
            Please read carefully before starting
          </p>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Exam Info */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <div className="bg-gray-50 rounded-lg p-2 sm:p-4 text-center">
              <p className="text-xs sm:text-sm text-gray-500">Duration</p>
              <p className="text-lg sm:text-xl font-bold text-gray-800">
                60 min
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2 sm:p-4 text-center">
              <p className="text-xs sm:text-sm text-gray-500">Questions</p>
              <p className="text-lg sm:text-xl font-bold text-gray-800">10</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2 sm:p-4 text-center">
              <p className="text-xs sm:text-sm text-gray-500">Total Marks</p>
              <p className="text-lg sm:text-xl font-bold text-gray-800">10</p>
            </div>
          </div>

          {/* Instructions List */}
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3">
              Important Instructions
            </h2>
            <ul className="space-y-2 sm:space-y-3">
              {instructions.map((instruction, index) => (
                <li key={index} className="flex items-start gap-2 sm:gap-3">
                  <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium">
                    {index + 1}
                  </span>
                  <span className="text-gray-700 text-sm sm:text-base">
                    {instruction}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Agreement */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-yellow-800">
              <strong>Note:</strong> By clicking "Start Exam", you agree to
              follow all the instructions mentioned above and understand that
              any violation may result in disqualification.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 sm:pt-4">
            <Button onClick={handleStartExam} fullWidth>
              Start Exam
            </Button>
            <Button variant="secondary" onClick={() => navigate(-1)} fullWidth>
              Go Back
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Instructions;
