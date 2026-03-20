"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { type User, login as apiLogin, register as apiRegister, logout as apiLogout, getToken } from "./api";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for existing token
    const token = getToken();
    if (token) {
      // Decode basic user info from token payload
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUser({
          id: payload.sub || payload.user_id,
          email: payload.email || "",
          role: payload.role || "customer",
          reputation_score: 0,
          created_at: "",
        });
      } catch {
        apiLogout();
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    const result = await apiLogin(email, password);
    setUser(result.user);
  };

  const register = async (email: string, password: string) => {
    await apiRegister(email, password);
    // Auto-login after register
    const result = await apiLogin(email, password);
    setUser(result.user);
  };

  const logout = () => {
    apiLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
