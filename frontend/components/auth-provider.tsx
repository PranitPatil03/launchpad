"use client";

import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";

interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProviderWrapper({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const sessionData = await authClient.getSession();
        setUser(sessionData?.data?.user || null);
      } catch (error) {
        console.error("Error checking session:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProviderWrapper');
  }
  return context;
}