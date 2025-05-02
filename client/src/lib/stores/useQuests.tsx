import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { useAuth } from "./useAuth";
import { useResources } from "./useResources";
import { apiRequest } from "../queryClient";
import { toast } from "sonner";
import { Quest, QuestType } from "../types";

interface QuestsState {
  quests: Quest[];
  
  fetchQuests: () => Promise<void>;
  completeQuest: (questId: number) => Promise<void>;
  trackQuestProgress: (type: QuestType, amount?: number) => Promise<void>;
}

export const useQuests = create<QuestsState>()(
  subscribeWithSelector((set, get) => ({
    quests: [],
    
    fetchQuests: async () => {
      try {
        const { isAuthenticated } = useAuth.getState();
        if (!isAuthenticated) return;
        
        const response = await apiRequest("GET", "/api/quests");
        const data = await response.json();
        
        set({ 
          quests: data.map((quest: any) => ({
            id: quest.id,
            type: quest.type,
            target: quest.target,
            progress: quest.progress,
            rewards: {
              plk: quest.plkReward,
              lor: quest.lorReward,
              gems: quest.gemsReward,
              exp: quest.expReward
            },
            completed: quest.completed
          }))
        });
      } catch (error) {
        console.error("Error fetching quests:", error);
      }
    },
    
    completeQuest: async (questId: number) => {
      try {
        const { isAuthenticated } = useAuth.getState();
        if (!isAuthenticated) return;
        
        const quest = get().quests.find(q => q.id === questId);
        if (!quest || quest.completed || quest.progress < quest.target) {
          toast.error("This quest cannot be completed yet");
          return;
        }
        
        const response = await apiRequest("POST", `/api/quests/${questId}/complete`);
        const data = await response.json();
        
        // Update quests list
        set(state => ({
          quests: state.quests.map(q => 
            q.id === questId
              ? { ...q, completed: true }
              : q
          )
        }));
        
        // Award rewards
        useResources.getState().updateResources({
          plk: useResources.getState().plk + quest.rewards.plk,
          lor: useResources.getState().lor + quest.rewards.lor,
          gems: useResources.getState().gems + quest.rewards.gems
        });
        
        useResources.getState().addExperience(quest.rewards.exp);
        
        toast.success(`Quest completed! You've earned ${quest.rewards.plk} PLK, ${quest.rewards.lor} Lor, ${quest.rewards.gems} Gems, and ${quest.rewards.exp} XP!`);
        
        // Auto-refresh quests after a short delay
        setTimeout(() => {
          get().fetchQuests();
        }, 2000);
      } catch (error) {
        console.error("Error completing quest:", error);
        toast.error("Failed to complete quest");
      }
    },
    
    trackQuestProgress: async (type: QuestType, amount = 1) => {
      try {
        const { isAuthenticated } = useAuth.getState();
        if (!isAuthenticated) return;
        
        // Update local progress first for immediate feedback
        set(state => ({
          quests: state.quests.map(quest => {
            if (quest.type === type && !quest.completed) {
              const newProgress = Math.min(quest.progress + amount, quest.target);
              return { ...quest, progress: newProgress };
            }
            return quest;
          })
        }));
        
        // Check if any quests are completed
        const completedQuests = get().quests.filter(q => 
          q.type === type && !q.completed && q.progress >= q.target
        );
        
        // Notify server about progress
        await apiRequest("POST", "/api/quests/progress", { type, amount });
        
        // Show toast for quests that reached completion
        completedQuests.forEach(quest => {
          toast.info(`Quest "${getQuestDescription(quest.type)}" is ready to be completed!`);
        });
      } catch (error) {
        console.error("Error tracking quest progress:", error);
      }
    }
  }))
);

// Helper function to get readable quest descriptions
function getQuestDescription(type: QuestType): string {
  switch (type) {
    case QuestType.FEED_DOG:
      return "Feed your dogs";
    case QuestType.PET_DOG:
      return "Pet your dogs";
    case QuestType.TRAIN_DOG:
      return "Train your dogs";
    case QuestType.WIN_COMBAT:
      return "Win combat encounters";
    case QuestType.JOIN_GROUP:
      return "Join a group";
    case QuestType.SEND_MESSAGE:
      return "Send messages in group chat";
    default:
      return "Unknown quest";
  }
}

// Initialize quests
setTimeout(() => {
  const { isAuthenticated } = useAuth.getState();
  if (isAuthenticated) {
    useQuests.getState().fetchQuests();
  }
}, 0);
