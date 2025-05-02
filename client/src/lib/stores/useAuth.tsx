import { create } from "zustand";
import { apiRequest } from "../queryClient";

interface User {
  id: number;
  username: string;
  level: number;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, email: string) => Promise<void>;
  logout: () => void;
  verifyToken: () => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  
  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiRequest("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });
      
      set({ 
        user: response.user, 
        isAuthenticated: true, 
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : "Login failed", 
        isLoading: false 
      });
      throw error;
    }
  },
  
  register: async (username: string, password: string, email: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiRequest("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password, email }),
      });
      
      set({ 
        user: response.user, 
        isAuthenticated: true, 
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : "Registration failed", 
        isLoading: false 
      });
      throw error;
    }
  },
  
  logout: () => {
    // Clear user data from state
    set({ 
      user: null, 
      isAuthenticated: false 
    });
    
    // Optional: make a call to the server to invalidate the session
    fetch("/api/auth/logout", { method: "POST" }).catch(err => {
      console.error("Logout request failed:", err);
    });
  },
  
  verifyToken: async () => {
    set({ isLoading: true });
    
    try {
      const response = await apiRequest("/api/auth/verify", {
        method: "GET",
      });
      
      if (response.user) {
        set({ 
          user: response.user, 
          isAuthenticated: true, 
          isLoading: false 
        });
      } else {
        set({ 
          user: null, 
          isAuthenticated: false, 
          isLoading: false 
        });
      }
    } catch (error) {
      set({ 
        user: null, 
        isAuthenticated: false, 
        isLoading: false 
      });
    }
  },
}));