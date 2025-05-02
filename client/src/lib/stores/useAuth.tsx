import { create } from "zustand";
import { getQueryFn, apiRequest } from "../queryClient";

interface User {
  id: number;
  username: string;
  level: number;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  
  // Auth methods
  register: (username: string, email: string, password: string) => Promise<boolean>;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuthState: () => Promise<boolean>;
  clearError: () => void;
}

export const useAuth = create<AuthState>((set, get) => ({
  token: localStorage.getItem('sweetDogToken'),
  user: null,
  isLoading: false,
  error: null,
  
  register: async (username, email, password) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await apiRequest('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password })
      });
      
      if (response.success) {
        localStorage.setItem('sweetDogToken', response.token);
        set({ 
          token: response.token,
          user: response.user,
          isLoading: false
        });
        return true;
      } else {
        set({ 
          error: response.message || 'Erreur lors de l\'inscription',
          isLoading: false
        });
        return false;
      }
    } catch (error) {
      console.error('Registration error:', error);
      set({ 
        error: 'Erreur lors de l\'inscription',
        isLoading: false
      });
      return false;
    }
  },
  
  login: async (username, password) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await apiRequest('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      
      if (response.success) {
        localStorage.setItem('sweetDogToken', response.token);
        set({ 
          token: response.token,
          user: response.user,
          isLoading: false
        });
        return true;
      } else {
        set({ 
          error: response.message || 'Identifiants invalides',
          isLoading: false
        });
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      set({ 
        error: 'Erreur lors de la connexion',
        isLoading: false
      });
      return false;
    }
  },
  
  logout: () => {
    localStorage.removeItem('sweetDogToken');
    set({
      token: null,
      user: null
    });
  },
  
  checkAuthState: async () => {
    const { token } = get();
    
    if (!token) {
      return false;
    }
    
    try {
      set({ isLoading: true });
      
      const response = await apiRequest('/api/auth/verify', {
        method: 'GET',
        headers: {
          'x-auth-token': token
        }
      });
      
      if (response.success) {
        set({ 
          user: response.user,
          isLoading: false
        });
        return true;
      } else {
        // Token is invalid, so remove it
        localStorage.removeItem('sweetDogToken');
        set({ 
          token: null,
          user: null,
          isLoading: false
        });
        return false;
      }
    } catch (error) {
      console.error('Token verification error:', error);
      // Token verification failed, so remove it
      localStorage.removeItem('sweetDogToken');
      set({ 
        token: null,
        user: null,
        isLoading: false,
        error: 'Session expirée. Veuillez vous reconnecter.'
      });
      return false;
    }
  },
  
  clearError: () => {
    set({ error: null });
  }
}));