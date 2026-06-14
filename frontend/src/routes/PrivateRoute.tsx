import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const PrivateRoute = () => {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return null; // or a small loader if you prefer
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoute;
