import React, { useState, createContext, useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Loader from "../common/Loader";

// Sidebar context for mobile toggle
interface SidebarContextType {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
  isOpen: false,
  toggle: () => {},
  close: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

interface ProtectedLayoutProps {
  requireAuth?: boolean;
  requireProfileComplete?: boolean;
}

const ProtectedLayout: React.FC<ProtectedLayoutProps> = ({
  requireAuth = true,
  requireProfileComplete = false,
}) => {
  const { isAuthenticated, profileCompleted, isInitializing } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Show loader while checking auth state
  if (requireAuth && isInitializing) {
    return <Loader fullScreen text="Loading..." />;
  }

  // Redirect to login if not authenticated
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to profile completion if required
  if (requireProfileComplete && !profileCompleted) {
    return <Navigate to="/student/complete-profile" replace />;
  }

  const sidebarContextValue: SidebarContextType = {
    isOpen: sidebarOpen,
    toggle: () => setSidebarOpen(!sidebarOpen),
    close: () => setSidebarOpen(false),
  };

  return (
    <SidebarContext.Provider value={sidebarContextValue}>
      <div className="min-h-screen bg-gray-100">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar - hidden on mobile by default, visible on md+ */}
        <Sidebar />

        {/* Main content area */}
        <div className="flex flex-col min-h-screen md:ml-60">
          <Navbar />
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
};

export default ProtectedLayout;
