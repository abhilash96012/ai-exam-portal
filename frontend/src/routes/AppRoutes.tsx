import { Routes, Route, Navigate } from "react-router-dom";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import StudentRegister from "../pages/auth/StudentRegister";
import StudentOTPVerification from "../pages/auth/StudentOTPVerification";
import StudentForgotPassword from "../pages/auth/StudentForgotPassword";

import TeacherDashboard from "../pages/teacher/TeacherDashboard";
import CreateExam from "../pages/teacher/CreateExam";
import EditExam from "../pages/teacher/EditExam";
import ReviewQuestions from "../pages/teacher/ReviewQuestions";
import TeacherResults from "../pages/teacher/TeacherResults";
import TeacherSetupPassword from "../pages/teacher/TeacherSetupPassword";
import GenerateQuestions from "../pages/teacher/GenerateQuestions";

import AdminDashboard from "../pages/admin/AdminDashboard";
import StudentManagement from "../pages/admin/StudentManagement";
import TeacherManagement from "../pages/admin/TeacherManagement";
import Analytics from "../pages/admin/Analytics";

import StudentDashboard from "../pages/student/StudentDashboard";
import AvailableExams from "../pages/student/AvailableExams";
import CompleteProfile from "../pages/student/CompleteProfile";
import Instructions from "../pages/student/Instructions";
import Exam from "../pages/student/Exam";
import Result from "../pages/student/Result";
import StudentResults from "../pages/student/StudentResults";

import PrivateRoute from "./PrivateRoute";
import RoleRoute from "./RoleRoute";
import ProfileRoute from "./ProfileRoute";
import ProtectedLayout from "../components/layout/ProtectedLayout";
import useAuth from "../hooks/useAuth";

const AppRoutes = () => {
  const { isAuthenticated, user, profileCompleted, isInitializing } = useAuth();

  const getRootElement = () => {
    if (isInitializing) {
      return null; // or a small loader
    }

    if (!isAuthenticated || !user) {
      return <Navigate to="/login" replace />;
    }

    if (user.role === "TEACHER") {
      return <Navigate to="/teacher/dashboard" replace />;
    }

    if (user.role === "ADMIN") {
      return <Navigate to="/admin/dashboard" replace />;
    }

    if (profileCompleted) {
      return <Navigate to="/student/dashboard" replace />;
    }

    return <Navigate to="/student/complete-profile" replace />;
  };

  return (
    <Routes>
      {/* Default Redirect */}
      <Route path="/" element={getRootElement()} />

      {/* Public Route */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/student/register" element={<StudentRegister />} />
      <Route path="/student/forgot-password" element={<StudentForgotPassword />} />
      <Route
        path="/student/verify-otp"
        element={<StudentOTPVerification />}
      />
      <Route
        path="/teacher/setup-password"
        element={<TeacherSetupPassword />}
      />

      {/* Protected Routes */}
      <Route element={<PrivateRoute />}>
        {/* Student profile completion (no sidebar/navbar) */}
        <Route element={<RoleRoute allowedRole="STUDENT" />}>
          <Route
            path="/student/complete-profile"
            element={<CompleteProfile />}
          />
        </Route>

        <Route element={<ProtectedLayout />}>
          {/* Teacher Routes */}
          <Route element={<RoleRoute allowedRole="TEACHER" />}>
            <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
            <Route path="/teacher/exams/create" element={<CreateExam />} />
            <Route path="/teacher/exams/:examId" element={<CreateExam />} />
            <Route path="/teacher/exams/:examId/edit" element={<EditExam />} />
            <Route
              path="/teacher/exams/:examId/review"
              element={<ReviewQuestions />}
            />
            <Route path="/teacher/results" element={<TeacherResults />} />
            <Route
              path="/teacher/results/:examId"
              element={<TeacherResults />}
            />
            <Route
              path="/teacher/generate-questions"
              element={<GenerateQuestions />}
            />
          </Route>

          {/* Admin Routes */}
          <Route element={<RoleRoute allowedRole="ADMIN" />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/syllabus" element={<AdminDashboard />} />
            <Route path="/admin/students" element={<StudentManagement />} />
            <Route path="/admin/teachers" element={<TeacherManagement />} />
            <Route path="/admin/analytics" element={<Analytics />} />
          </Route>

          {/* Student Routes (profile must be completed) */}
          <Route element={<RoleRoute allowedRole="STUDENT" />}>
            <Route element={<ProfileRoute />}>
              <Route path="/student/dashboard" element={<StudentDashboard />} />
              <Route path="/student/exams" element={<AvailableExams />} />
              <Route path="/student/results" element={<StudentResults />} />
              <Route
                path="/student/exam/:examId/instructions"
                element={<Instructions />}
              />
              <Route path="/student/exam/:examId" element={<Exam />} />
              <Route path="/student/exam/:examId/result" element={<Result />} />
            </Route>
          </Route>
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
