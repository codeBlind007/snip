"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User } from "@/lib/types";
import { apiClient } from "@/lib/api-client";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authModalTab: "login" | "signup";
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, name: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  openAuthModal: (tab?: "login" | "signup") => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<"login" | "signup">("login");

  // Load cached user and verify session
  useEffect(() => {
    const cachedUser = typeof window !== "undefined" ? localStorage.getItem("snip_user") : null;
    if (cachedUser) {
      try {
        setUser(JSON.parse(cachedUser));
      } catch {
        // invalid cached user
      }
    }

    // Verify session with server
    apiClient
      .getMe()
      .then((res) => {
        if (!res.user) {
          setUser(null);
          localStorage.removeItem("snip_user");
        }
      })
      .catch(() => {
        // If server is unreachable or not authenticated, keep cached user or reset if needed
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = useCallback(async (email_id: string, password: string) => {
    const res = await apiClient.login({ email_id, password });
    setUser(res.user);
    if (typeof window !== "undefined") {
      localStorage.setItem("snip_user", JSON.stringify(res.user));
    }
    setIsAuthModalOpen(false);
  }, []);

  const signup = useCallback(async (email_id: string, fullname: string, password: string) => {
    const res = await apiClient.signup({ email_id, fullname, password });
    setUser(res.user);
    if (typeof window !== "undefined") {
      localStorage.setItem("snip_user", JSON.stringify(res.user));
    }
    setIsAuthModalOpen(false);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.logout();
    } finally {
      setUser(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("snip_user");
      }
    }
  }, []);

  const openAuthModal = useCallback((tab: "login" | "signup" = "login") => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthModalOpen,
        authModalTab,
        login,
        signup,
        logout,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

