import { create } from "zustand";
import { useAuth } from "./useAuth";
import { apiRequest } from "../queryClient";
import { CombatAction, CombatEncounter } from "../types";

interface ActionResult {
  success: boolean;
  damage?: number;
  action?: CombatAction;
}

interface CombatState {
  encounter: CombatEncounter | null;
  isLoading: boolean;
  error: string | null;
  
  // Combat methods
  fetchActiveCombat: () => Promise<boolean>;
  getCombatById: (id: number) => Promise<CombatEncounter | null>;
  startCombat: (difficulty: number, dogIds?: number[]) => Promise<CombatEncounter | null>;
  executeAction: (combatId: number, action: CombatAction) => Promise<ActionResult | null>;
  executeEnemyAction: (combatId: number) => Promise<ActionResult | null>;
  distributeCombatRewards: (combatId: number) => Promise<boolean>;
  clearError: () => void;
}

export const useCombat = create<CombatState>((set, get) => ({
  encounter: null,
  isLoading: false,
  error: null,
  
  fetchActiveCombat: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const { token } = useAuth.getState();
      if (!token) {
        set({ 
          error: 'Non authentifié', 
          isLoading: false 
        });
        return false;
      }
      
      const response = await apiRequest('/api/combat/active', {
        method: 'GET',
        headers: {
          'x-auth-token': token
        }
      });
      
      if (response.success) {
        set({ 
          encounter: response.encounter || null,
          isLoading: false
        });
        return !!response.encounter;
      } else {
        set({ 
          encounter: null,
          error: response.message || 'Erreur lors de la récupération du combat',
          isLoading: false
        });
        return false;
      }
    } catch (error) {
      console.error('Fetch active combat error:', error);
      set({ 
        encounter: null,
        error: 'Erreur lors de la récupération du combat',
        isLoading: false
      });
      return false;
    }
  },
  
  getCombatById: async (id) => {
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
      
      const response = await apiRequest(`/api/combat/${id}`, {
        method: 'GET',
        headers: {
          'x-auth-token': token
        }
      });
      
      if (response.success) {
        set({ 
          encounter: response.encounter,
          isLoading: false
        });
        return response.encounter;
      } else {
        set({ 
          error: response.message || 'Erreur lors de la récupération du combat',
          isLoading: false
        });
        return null;
      }
    } catch (error) {
      console.error('Get combat error:', error);
      set({ 
        error: 'Erreur lors de la récupération du combat',
        isLoading: false
      });
      return null;
    }
  },
  
  startCombat: async (difficulty, dogIds = []) => {
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
      
      const response = await apiRequest('/api/combat/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ difficulty, dogIds })
      });
      
      if (response.success) {
        set({ 
          encounter: response.encounter,
          isLoading: false
        });
        return response.encounter;
      } else {
        set({ 
          error: response.message || 'Erreur lors du démarrage du combat',
          isLoading: false
        });
        return null;
      }
    } catch (error) {
      console.error('Start combat error:', error);
      set({ 
        error: 'Erreur lors du démarrage du combat',
        isLoading: false
      });
      return null;
    }
  },
  
  executeAction: async (combatId, action) => {
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
      
      const response = await apiRequest(`/api/combat/${combatId}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ action })
      });
      
      if (response.success) {
        set({ 
          encounter: response.encounter,
          isLoading: false
        });
        return response.result;
      } else {
        set({ 
          error: response.message || 'Erreur lors de l\'exécution de l\'action',
          isLoading: false
        });
        return null;
      }
    } catch (error) {
      console.error('Execute action error:', error);
      set({ 
        error: 'Erreur lors de l\'exécution de l\'action',
        isLoading: false
      });
      return null;
    }
  },
  
  executeEnemyAction: async (combatId) => {
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
      
      const response = await apiRequest(`/api/combat/${combatId}/enemy-action`, {
        method: 'POST',
        headers: {
          'x-auth-token': token
        }
      });
      
      if (response.success) {
        set({ 
          encounter: response.encounter,
          isLoading: false
        });
        return response.result;
      } else {
        set({ 
          error: response.message || 'Erreur lors de l\'action ennemie',
          isLoading: false
        });
        return null;
      }
    } catch (error) {
      console.error('Execute enemy action error:', error);
      set({ 
        error: 'Erreur lors de l\'action ennemie',
        isLoading: false
      });
      return null;
    }
  },
  
  distributeCombatRewards: async (combatId) => {
    try {
      set({ isLoading: true, error: null });
      
      const { token } = useAuth.getState();
      if (!token) {
        set({ 
          error: 'Non authentifié', 
          isLoading: false 
        });
        return false;
      }
      
      const response = await apiRequest(`/api/combat/${combatId}/rewards`, {
        method: 'POST',
        headers: {
          'x-auth-token': token
        }
      });
      
      if (response.success) {
        set({ 
          encounter: null, // Clear the encounter after rewards are distributed
          isLoading: false
        });
        return true;
      } else {
        set({ 
          error: response.message || 'Erreur lors de la distribution des récompenses',
          isLoading: false
        });
        return false;
      }
    } catch (error) {
      console.error('Distribute rewards error:', error);
      set({ 
        error: 'Erreur lors de la distribution des récompenses',
        isLoading: false
      });
      return false;
    }
  },
  
  clearError: () => {
    set({ error: null });
  }
}));