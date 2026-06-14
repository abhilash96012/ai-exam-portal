import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";
import authService from "../services/authService";

export type UserRole = "ADMIN" | "TEACHER" | "STUDENT";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  branch?: string | null;
  year?: number | null;
  registerNumber?: string | null;
  profileCompleted?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  profileCompleted: boolean;
  isInitializing: boolean;
  login: (userData: User) => void;
  logout: () => void;
  completeProfile: (updates?: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = "authUserState";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [profileCompleted, setProfileCompleted] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  // Hydrate auth state from localStorage and backend once on app start
  useEffect(() => {
    const hydrate = async () => {
      try {
        let hydratedUser: User | null = null;
        let hydratedProfileCompleted = false;
        const token =
          localStorage.getItem("authToken") ||
          localStorage.getItem("token") ||
          localStorage.getItem("accessToken");

        // 1) Trust local snapshot only when a token exists
        if (token) {
          try {
            const raw = localStorage.getItem(AUTH_STORAGE_KEY);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed?.user) {
                hydratedUser = parsed.user;
              }
              hydratedProfileCompleted = Boolean(parsed?.profileCompleted);
            }
          } catch {
            // ignore storage errors
          }
        } else {
          try {
            localStorage.removeItem(AUTH_STORAGE_KEY);
          } catch {
            // ignore storage errors
          }
        }

        // 2) If no hydrated user but we have a token, ask backend
        if (!hydratedUser) {
          if (token) {
            try {
              const response = await api.get("/auth/me");
              const me = response.data?.data?.user;

              if (me) {
                hydratedUser = {
                  id: me.id,
                  name: me.name,
                  email: me.email,
                  role: me.role,
                  branch: me.branch ?? null,
                  year: me.year ?? null,
                  registerNumber: me.registerNumber ?? null,
                };
                hydratedProfileCompleted = Boolean(me.profileCompleted);

                try {
                  localStorage.setItem(
                    AUTH_STORAGE_KEY,
                    JSON.stringify({
                      user: hydratedUser,
                      profileCompleted: hydratedProfileCompleted,
                    }),
                  );
                } catch {
                  // ignore storage errors
                }
              }
            } catch {
              // Token is likely invalid; clear all auth state to avoid loops
              try {
                localStorage.removeItem(AUTH_STORAGE_KEY);
                localStorage.removeItem("authToken");
                localStorage.removeItem("token");
                localStorage.removeItem("accessToken");
              } catch {
                // ignore storage errors
              }
            }
          }
        }

        if (hydratedUser) {
          setUser(hydratedUser);
          setProfileCompleted(hydratedProfileCompleted);
        }
      } finally {
        setIsInitializing(false);
      }
    };

    hydrate();
  }, []);

  const login = (userData: User) => {
    setUser(userData);

    const nextProfileCompleted =
      userData.role !== "STUDENT" || Boolean(userData.profileCompleted);
    setProfileCompleted(nextProfileCompleted);

    try {
      localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({
          user: userData,
          profileCompleted: nextProfileCompleted,
        }),
      );
    } catch {
      // ignore storage errors
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // ignore API errors on logout
    }

    setUser(null);
    setProfileCompleted(false);

    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem("authToken");
      localStorage.removeItem("token");
      localStorage.removeItem("accessToken");
    } catch {
      // ignore storage errors
    }
  };

  const completeProfile = (updates?: Partial<User>) => {
    const nextUser = user ? { ...user, ...(updates || {}) } : user;
    setUser(nextUser);
    setProfileCompleted(true);

    try {
      localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({ user: nextUser, profileCompleted: true }),
      );
    } catch {
      // ignore storage errors
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        profileCompleted,
        isInitializing,
        login,
        logout,
        completeProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};
