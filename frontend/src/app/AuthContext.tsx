import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, csrf } from "../api/client";
import type { User, AuthSession } from "../types/auth";

const AuthContext = createContext<AuthSession | null>(null);

export interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  async function refresh(): Promise<void> {
    try {
      const response = await api.get("/api/v1/me");
      setUser(response.data.data as User);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();

    const handleSessionExpired = () => {
      setUser(null);
    };

    window.addEventListener("sop-session-expired", handleSessionExpired);
    return () => {
      window.removeEventListener("sop-session-expired", handleSessionExpired);
    };
  }, []);

  async function login(email: string, password: string): Promise<boolean> {
    await csrf();
    const response = await api.post("/api/login", { email, password });

    // Status 202 indicates two-factor authentication challenge is required
    if (response.status === 202) {
      return true;
    }

    setUser(response.data.data as User);
    return false;
  }

  async function verifyTwoFactor(code: string): Promise<void> {
    const response = await api.post("/api/two-factor-challenge", { code });
    setUser(response.data.data as User);
  }

  async function logout(): Promise<void> {
    try {
      await api.post("/api/logout");
    } finally {
      setUser(null);
    }
  }

  const sessionValue = useMemo<AuthSession>(
    () => ({
      user,
      loading,
      login,
      verifyTwoFactor,
      logout,
      refresh,
    }),
    [user, loading],
  );

  return (
    <AuthContext.Provider value={sessionValue}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthSession {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
