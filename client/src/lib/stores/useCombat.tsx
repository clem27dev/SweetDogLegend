import { create } from "zustand";
import { apiRequest } from "../queryClient";
import { CombatAction, CombatEncounter } from "../types";

interface CombatActionResult {
  action: CombatAction;
  success: boolean;
  damage?: number;
  message?: string;
}

interface CombatState {
  encounter: CombatEncounter | null;
  isLoading: boolean;
  error: string | null;
  
  fetchActiveCombat: () => Promise<boolean>;
  getCombatById: (id: number) => Promise<CombatEncounter | null>;
  startCombat: (difficulty: number) => Promise<CombatEncounter>;
  executeAction: (encounterId: number, action: CombatAction) => Promise<CombatActionResult | null>;
  executeEnemyAction: (encounterId: number) => Promise<CombatActionResult | null>;
  distributeCombatRewards: (encounterId: number) => Promise<void>;
}

export const useCombat = create<CombatState>((set, get) => ({
  encounter: null,
  isLoading: false,
  error: null,
  
  fetchActiveCombat: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiRequest("/api/combat/active", {
        method: "GET",
      });
      
      if (response.encounter) {
        set({ 
          encounter: response.encounter,
          isLoading: false 
        });
        return true;
      } else {
        set({ 
          encounter: null,
          isLoading: false 
        });
        return false;
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : "Failed to fetch active combat", 
        isLoading: false,
        encounter: null
      });
      return false;
    }
  },
  
  getCombatById: async (id: number) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiRequest(`/api/combat/${id}`, {
        method: "GET",
      });
      
      set({ 
        encounter: response.encounter, 
        isLoading: false 
      });
      
      return response.encounter;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : `Failed to fetch combat ${id}`, 
        isLoading: false 
      });
      return null;
    }
  },
  
  startCombat: async (difficulty: number) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiRequest("/api/combat/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ difficulty }),
      });
      
      set({ 
        encounter: response.encounter, 
        isLoading: false 
      });
      
      return response.encounter;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : "Failed to start combat", 
        isLoading: false 
      });
      throw error;
    }
  },
  
  executeAction: async (encounterId: number, action: CombatAction) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiRequest(`/api/combat/${encounterId}/action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });
      
      set({ 
        encounter: response.encounter, 
        isLoading: false 
      });
      
      return response.result;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : "Failed to execute action", 
        isLoading: false 
      });
      return null;
    }
  },
  
  executeEnemyAction: async (encounterId: number) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiRequest(`/api/combat/${encounterId}/enemy-action`, {
        method: "POST",
      });
      
      set({ 
        encounter: response.encounter, 
        isLoading: false 
      });
      
      return response.result;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : "Failed to execute enemy action", 
        isLoading: false 
      });
      return null;
    }
  },
  
  distributeCombatRewards: async (encounterId: number) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiRequest(`/api/combat/${encounterId}/rewards`, {
        method: "POST",
      });
      
      set({ 
        encounter: null, // Clear the encounter after distributing rewards
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : "Failed to distribute rewards", 
        isLoading: false 
      });
      throw error;
    }
  },
}));