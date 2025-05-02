import { create } from "zustand";
import { useAuth } from "./useAuth";
import { apiRequest } from "../queryClient";
import { Dog } from "../types";

interface DogsState {
  dogs: Dog[];
  selectedDogId: number | null;
  isLoading: boolean;
  error: string | null;
  
  // Dog methods
  fetchDogs: () => Promise<Dog[]>;
  selectDog: (dogId: number) => void;
  createDog: (name: string) => Promise<Dog | null>;
  feedDog: (dogId: number) => Promise<Dog | null>;
  petDog: (dogId: number) => Promise<Dog | null>;
  trainDog: (dogId: number, stat?: string) => Promise<Dog | null>;
  breedDogs: (dog1Id: number, dog2Id: number) => Promise<Dog | null>;
  clearError: () => void;
}

export const useDogs = create<DogsState>((set, get) => ({
  dogs: [],
  selectedDogId: null,
  isLoading: false,
  error: null,
  
  fetchDogs: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const { token } = useAuth.getState();
      if (!token) {
        set({ 
          error: 'Non authentifié', 
          isLoading: false 
        });
        return [];
      }
      
      const response = await apiRequest('/api/dogs', {
        method: 'GET',
        headers: {
          'x-auth-token': token
        }
      });
      
      if (response.success) {
        set({ 
          dogs: response.dogs,
          isLoading: false
        });
        return response.dogs;
      } else {
        set({ 
          error: response.message || 'Erreur lors de la récupération des chiens',
          isLoading: false
        });
        return [];
      }
    } catch (error) {
      console.error('Fetch dogs error:', error);
      set({ 
        error: 'Erreur lors de la récupération des chiens',
        isLoading: false
      });
      return [];
    }
  },
  
  selectDog: (dogId) => {
    set({ selectedDogId: dogId });
  },
  
  createDog: async (name) => {
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
      
      const response = await apiRequest('/api/dogs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ name })
      });
      
      if (response.success) {
        // Add new dog to the list
        const newDog = response.dog;
        set({ 
          dogs: [...get().dogs, newDog],
          isLoading: false
        });
        return newDog;
      } else {
        set({ 
          error: response.message || 'Erreur lors de la création du chien',
          isLoading: false
        });
        return null;
      }
    } catch (error) {
      console.error('Create dog error:', error);
      set({ 
        error: 'Erreur lors de la création du chien',
        isLoading: false
      });
      return null;
    }
  },
  
  feedDog: async (dogId) => {
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
      
      const response = await apiRequest(`/api/dogs/${dogId}/feed`, {
        method: 'POST',
        headers: {
          'x-auth-token': token
        }
      });
      
      if (response.success) {
        // Update dog in the list
        const updatedDog = response.dog;
        set({ 
          dogs: get().dogs.map(dog => dog.id === dogId ? updatedDog : dog),
          isLoading: false
        });
        return updatedDog;
      } else {
        set({ 
          error: response.message || 'Erreur lors du nourrissage du chien',
          isLoading: false
        });
        return null;
      }
    } catch (error) {
      console.error('Feed dog error:', error);
      set({ 
        error: 'Erreur lors du nourrissage du chien',
        isLoading: false
      });
      return null;
    }
  },
  
  petDog: async (dogId) => {
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
      
      const response = await apiRequest(`/api/dogs/${dogId}/pet`, {
        method: 'POST',
        headers: {
          'x-auth-token': token
        }
      });
      
      if (response.success) {
        // Update dog in the list
        const updatedDog = response.dog;
        set({ 
          dogs: get().dogs.map(dog => dog.id === dogId ? updatedDog : dog),
          isLoading: false
        });
        return updatedDog;
      } else {
        set({ 
          error: response.message || 'Erreur lors de la caresse du chien',
          isLoading: false
        });
        return null;
      }
    } catch (error) {
      console.error('Pet dog error:', error);
      set({ 
        error: 'Erreur lors de la caresse du chien',
        isLoading: false
      });
      return null;
    }
  },
  
  trainDog: async (dogId, stat) => {
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
      
      const response = await apiRequest(`/api/dogs/${dogId}/train`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ stat })
      });
      
      if (response.success) {
        // Update dog in the list
        const updatedDog = response.dog;
        set({ 
          dogs: get().dogs.map(dog => dog.id === dogId ? updatedDog : dog),
          isLoading: false
        });
        return updatedDog;
      } else {
        set({ 
          error: response.message || 'Erreur lors de l\'entraînement du chien',
          isLoading: false
        });
        return null;
      }
    } catch (error) {
      console.error('Train dog error:', error);
      set({ 
        error: 'Erreur lors de l\'entraînement du chien',
        isLoading: false
      });
      return null;
    }
  },
  
  breedDogs: async (dog1Id, dog2Id) => {
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
      
      const response = await apiRequest(`/api/dogs/breed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ dog1Id, dog2Id })
      });
      
      if (response.success) {
        // Add new puppy to the list and update the parent dogs
        const { puppy, parents } = response;
        const updatedDogs = get().dogs.map(dog => {
          const parent = parents.find(p => p.id === dog.id);
          return parent ? parent : dog;
        });
        
        set({ 
          dogs: [...updatedDogs, puppy],
          isLoading: false
        });
        return puppy;
      } else {
        set({ 
          error: response.message || 'Erreur lors de l\'élevage',
          isLoading: false
        });
        return null;
      }
    } catch (error) {
      console.error('Breed dogs error:', error);
      set({ 
        error: 'Erreur lors de l\'élevage',
        isLoading: false
      });
      return null;
    }
  },
  
  clearError: () => {
    set({ error: null });
  }
}));