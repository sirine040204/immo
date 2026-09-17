"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { User, JWTPayload, AuthResponse } from "@/features/accounts/types/auth";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: AuthResponse) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      try {
        const decoded = jwtDecode<JWTPayload>(token);
        // Basic check if token is expired
        if (decoded.exp * 1000 > Date.now()) {
          setUser({ id: decoded.user_id });
          setIsAuthenticated(true);
        } else {
          logout();
        }
      } catch (error) {
        logout();
      }
    }
    setIsLoading(false);

    // Listen to custom logout event emitted by Axios interceptor
    const handleLogoutEvent = () => logout();
    window.addEventListener("auth:logout", handleLogoutEvent);
    
    return () => window.removeEventListener("auth:logout", handleLogoutEvent);
  }, []);

  const login = (data: AuthResponse) => {
    localStorage.setItem("access_token", data.access);
    localStorage.setItem("refresh_token", data.refresh);

    try {
      const decoded = jwtDecode<JWTPayload>(data.access);
      setUser({ id: decoded.user_id });
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Failed to decode token on login");
    }
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
