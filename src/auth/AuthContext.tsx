import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import * as SecureStore from "expo-secure-store";
import apiClient from "../api/client";

type User = {
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  [key: string]: any;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  async function restoreSession() {
    const token = await SecureStore.getItemAsync("authToken");
    if (token) {
      try {
        const res = await apiClient.get("/users/me");
        setUser(res.data);
      } catch {
        // Token expired or invalid — clear it
        await SecureStore.deleteItemAsync("authToken");
      }
    }
    setIsLoading(false);
  }

  async function login(email: string, password: string) {
    const form = new URLSearchParams();
    form.append("grant_type", "password");
    form.append("username", email);
    form.append("password", password);

    const res = await apiClient.post("/auth/login", form.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    await SecureStore.setItemAsync("authToken", res.data.access_token);

    // Fetch full profile now that we have a valid token
    const profileRes = await apiClient.get("/users/me");
    setUser(profileRes.data);
  }

  async function logout() {
    await SecureStore.deleteItemAsync("authToken");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}