import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const ProfileRoute = () => {
  const { profileCompleted } = useAuth();

  if (!profileCompleted) {
    return <Navigate to="/student/complete-profile" replace />;
  }

  return <Outlet />;
};

export default ProfileRoute;
