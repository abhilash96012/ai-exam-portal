import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";

interface RoleRouteProps {
  allowedRole: "ADMIN" | "TEACHER" | "STUDENT";
}

const RoleRoute: React.FC<RoleRouteProps> = ({ allowedRole }) => {
  const { user } = useAuth(); // ✅ INSIDE component

  if (!user || user.role !== allowedRole) {
    return <Navigate to="/login" />;
  }

  return <Outlet />;
};

export default RoleRoute;
