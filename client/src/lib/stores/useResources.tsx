import { create } from "zustand";
import { useAuth } from "./useAuth";
import { apiRequest } from "../queryClient";
import { Resource } from "../types";

interface ResourcesState {
  resources: Resource | null;
  isLoading: boolean;
  error: string | null;
  
  // Resource methods
  fetchResources: () => Promise<Resource | null>;
  updateResources: (plk: number, lor: number, gems: number) => Promise<Resource | null>;
  updatePassiveResources: () => Promise<Resource | null>;
  clearError: () => void;
}

export const useResources = create<ResourcesState>((set, get) => ({
  resources: null,
  isLoading: false,
  error: null,
  
  fetchResources: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const { token } = useAuth.getState();
      if (!token) {
        set({ 
          error: 'Non authentifié', 
          isLoading: false 
        });
        return null;
      }
      
      const response = await apiRequest('/api/resources', {
        method: 'GET',
        headers: {
          'x-auth-token': token
        }
      });
      
      if (response.success) {
        set({ 
          resources: response.resources,
          isLoading: false
        });
        return response.resources;
      } else {
        set({ 
          error: response.message || 'Erreur lors de la récupération des ressources',
          isLoading: false
        });
        return null;
      }
    } catch (error) {
      console.error('Fetch resources error:', error);
      set({ 
        error: 'Erreur lors de la récupération des ressources',
        isLoading: false
      });
      return null;
    }
  },
  
  updateResources: async (plk, lor, gems) => {
    try {
      set({ isLoading: true, error: null });
      
      const { token } = useAuth.getState();
      if (!token) {
        set({ 
          error: 'Non authentifié', 
          isLoading: false 
        });
        return null;
      }
      
      const response = await apiRequest('/api/resources', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ plk, lor, gems })
      });
      
      if (response.success) {
        set({ 
          resources: response.resources,
          isLoading: false
        });
        return response.resources;
      } else {
        set({ 
          error: response.message || 'Erreur lors de la mise à jour des ressources',
          isLoading: false
        });
        return null;
      }
    } catch (error) {
      console.error('Update resources error:', error);
      set({ 
        error: 'Erreur lors de la mise à jour des ressources',
        isLoading: false
      });
      return null;
    }
  },
  
  updatePassiveResources: async () => {
    try {
      const { token } = useAuth.getState();
      if (!token) {
        return null;
      }
      
      const response = await apiRequest('/api/resources/passive', {
        method: 'POST',
        headers: {
          'x-auth-token': token
        }
      });
      
      if (response.success) {
        set({ resources: response.resources });
        return response.resources;
      }
      return null;
    } catch (error) {
      console.error('Update passive resources error:', error);
      return null;
    }
  },
  
  clearError: () => {
    set({ error: null });
  }
}));