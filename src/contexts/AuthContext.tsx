// Authentication Context
import React, { createContext, useContext, useEffect, useState } from "react";
import { User, AuthState } from "../types";
import { onAuthChange } from "../services/authService";

interface AuthContextType extends AuthState {
  signUp: (email: string, password: string) => Promise<User>;
  signIn: (email: string, password: string) => Promise<User>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUp = async (email: string, password: string): Promise<User> => {
    setLoading(true);
    try {
      const { createUser } = await import("../services/authService");
      const newUser = await createUser(email, password);
      return newUser;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string): Promise<User> => {
    setLoading(true);
    try {
      const { signInUser } = await import("../services/authService");
      const user = await signInUser(email, password);
      return user;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    setLoading(true);
    try {
      const { logoutUser } = await import("../services/authService");
      await logoutUser();
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
