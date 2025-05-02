import { create } from "zustand";
import { apiRequest } from "../queryClient";
import { Resource } from "../types";

interface ResourceState {
  resources: Resource | null;
  isLoading: boolean;
  error: string | null;
  
  fetchResources: () => Promise<void>;
  updateResources: (plk: number, lor: number, gems: number) => Promise<void>;
}

export const useResources = create<ResourceState>((set, get) => ({
  resources: null,
  isLoading: false,
  error: null,
  
  fetchResources: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiRequest("/api/auth/resources", {
        method: "GET",
      });
      
      set({ 
        resources: response.resources, 
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : "Failed to fetch resources", 
        isLoading: false 
      });
    }
  },
  
  updateResources: async (plk: number, lor: number, gems: number) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiRequest("/api/auth/resources", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plk, lor, gems }),
      });
      
      set({ 
        resources: response.resources, 
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : "Failed to update resources", 
        isLoading: false 
      });
      throw error;
    }
  },
}));