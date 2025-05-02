import { create } from "zustand";
import { apiRequest } from "../queryClient";
import { Dog } from "../types";

interface DogsState {
  dogs: Dog[];
  selectedDogId: number | null;
  isLoading: boolean;
  error: string | null;
  
  fetchDogs: () => Promise<Dog[]>;
  getDogById: (id: number) => Promise<Dog | undefined>;
  createDog: (name: string, isAdult?: boolean, parent1Id?: number, parent2Id?: number) => Promise<Dog>;
  feedDog: (id: number) => Promise<void>;
  petDog: (id: number) => Promise<void>;
  trainDog: (id: number, stat?: string) => Promise<void>;
  breedDogs: (parentId1: number, parentId2: number, name: string) => Promise<Dog>;
  
  selectDog: (id: number) => void;
}

export const useDogs = create<DogsState>((set, get) => ({
  dogs: [],
  selectedDogId: null,
  isLoading: false,
  error: null,
  
  fetchDogs: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiRequest("/api/dogs", {
        method: "GET",
      });
      
      set({ 
        dogs: response.dogs, 
        isLoading: false 
      });
      
      return response.dogs;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : "Failed to fetch dogs", 
        isLoading: false 
      });
      return [];
    }
  },
  
  getDogById: async (id: number) => {
    const { dogs } = get();
    
    // Try to find the dog in the existing state first
    let dog = dogs.find((d) => d.id === id);
    
    if (dog) {
      return dog;
    }
    
    // If not found, fetch from the API
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiRequest(`/api/dogs/${id}`, {
        method: "GET",
      });
      
      // Update the dog in the state
      const updatedDogs = [...dogs, response.dog];
      set({ 
        dogs: updatedDogs, 
        isLoading: false 
      });
      
      return response.dog;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : `Failed to fetch dog ${id}`, 
        isLoading: false 
      });
      return undefined;
    }
  },
  
  createDog: async (name: string, isAdult = false, parent1Id, parent2Id) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiRequest("/api/dogs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          name, 
          isAdult,
          parent1Id,
          parent2Id 
        }),
      });
      
      // Add the new dog to the state
      const { dogs } = get();
      const updatedDogs = [...dogs, response.dog];
      
      set({ 
        dogs: updatedDogs, 
        isLoading: false 
      });
      
      return response.dog;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : "Failed to create dog", 
        isLoading: false 
      });
      throw error;
    }
  },
  
  feedDog: async (id: number) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiRequest(`/api/dogs/${id}/feed`, {
        method: "POST",
      });
      
      // Update the dog in the state
      const { dogs } = get();
      const updatedDogs = dogs.map((dog) => 
        dog.id === id ? response.dog : dog
      );
      
      set({ 
        dogs: updatedDogs, 
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : `Failed to feed dog ${id}`, 
        isLoading: false 
      });
      throw error;
    }
  },
  
  petDog: async (id: number) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiRequest(`/api/dogs/${id}/pet`, {
        method: "POST",
      });
      
      // Update the dog in the state
      const { dogs } = get();
      const updatedDogs = dogs.map((dog) => 
        dog.id === id ? response.dog : dog
      );
      
      set({ 
        dogs: updatedDogs, 
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : `Failed to pet dog ${id}`, 
        isLoading: false 
      });
      throw error;
    }
  },
  
  trainDog: async (id: number, stat) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiRequest(`/api/dogs/${id}/train`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ stat }),
      });
      
      // Update the dog in the state
      const { dogs } = get();
      const updatedDogs = dogs.map((dog) => 
        dog.id === id ? response.dog : dog
      );
      
      set({ 
        dogs: updatedDogs, 
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : `Failed to train dog ${id}`, 
        isLoading: false 
      });
      throw error;
    }
  },
  
  breedDogs: async (parentId1: number, parentId2: number, name: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiRequest("/api/dogs/breed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ parentId1, parentId2, name }),
      });
      
      // Add the new dog to the state
      const { dogs } = get();
      const updatedDogs = [...dogs, response.dog];
      
      // Update the parent dogs with new breeding cooldown
      const updatedParentDogs = updatedDogs.map((dog) => {
        if (dog.id === parentId1 || dog.id === parentId2) {
          return {
            ...dog,
            breedingCooldown: response.breedingCooldown,
          };
        }
        return dog;
      });
      
      set({ 
        dogs: updatedParentDogs, 
        isLoading: false 
      });
      
      return response.dog;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : "Failed to breed dogs", 
        isLoading: false 
      });
      throw error;
    }
  },
  
  selectDog: (id: number) => {
    set({ selectedDogId: id });
  },
}));