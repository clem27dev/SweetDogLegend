import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { useAuth } from "./useAuth";
import { apiRequest } from "../queryClient";
import { toast } from "sonner";
import { Group, GroupRole, GroupMember, GroupMessage } from "../types";
import { useQuests } from "./useQuests";
import { QuestType } from "../types";

interface GroupsState {
  groups: Group[];
  currentGroupId: number | null;
  invites: { groupId: number; groupName: string; inviterId: number; inviterName: string }[];
  
  fetchGroups: () => Promise<void>;
  fetchGroupDetail: (groupId: number) => Promise<void>;
  fetchInvites: () => Promise<void>;
  createGroup: (name: string, description?: string) => Promise<void>;
  joinGroup: (groupId: number) => Promise<void>;
  leaveGroup: (groupId: number) => Promise<void>;
  setCurrentGroup: (groupId: number | null) => void;
  sendMessage: (content: string) => Promise<void>;
  inviteMember: (groupId: number, username: string) => Promise<void>;
  acceptInvite: (groupId: number) => Promise<void>;
  rejectInvite: (groupId: number) => Promise<void>;
  changeRole: (groupId: number, userId: number, role: GroupRole) => Promise<void>;
  kickMember: (groupId: number, userId: number) => Promise<void>;
  disbandGroup: (groupId: number) => Promise<void>;
}

export const useGroups = create<GroupsState>()(
  subscribeWithSelector((set, get) => ({
    groups: [],
    currentGroupId: null,
    invites: [],
    
    fetchGroups: async () => {
      try {
        const { isAuthenticated } = useAuth.getState();
        if (!isAuthenticated) return;
        
        const response = await apiRequest("GET", "/api/groups");
        const data = await response.json();
        
        set({ groups: data });
      } catch (error) {
        console.error("Error fetching groups:", error);
      }
    },
    
    fetchGroupDetail: async (groupId: number) => {
      try {
        const { isAuthenticated } = useAuth.getState();
        if (!isAuthenticated) return;
        
        const response = await apiRequest("GET", `/api/groups/${groupId}`);
        const data = await response.json();
        
        set(state => ({
          groups: state.groups.map(g => 
            g.id === groupId
              ? {
                  ...g,
                  members: data.members,
                  messages: data.messages
                }
              : g
          )
        }));
      } catch (error) {
        console.error("Error fetching group details:", error);
      }
    },
    
    fetchInvites: async () => {
      try {
        const { isAuthenticated } = useAuth.getState();
        if (!isAuthenticated) return;
        
        const response = await apiRequest("GET", "/api/groups/invites");
        const data = await response.json();
        
        set({ invites: data });
      } catch (error) {
        console.error("Error fetching group invites:", error);
      }
    },
    
    createGroup: async (name: string, description?: string) => {
      try {
        const { isAuthenticated, userId } = useAuth.getState();
        if (!isAuthenticated || !userId) return;
        
        const response = await apiRequest("POST", "/api/groups", { name, description });
        const data = await response.json();
        
        set(state => ({
          groups: [...state.groups, {
            ...data,
            members: [{
              userId,
              username: useAuth.getState().username || "You",
              role: GroupRole.OWNER,
              joinedAt: new Date()
            }],
            messages: []
          }],
          currentGroupId: data.id
        }));
        
        toast.success(`Group "${name}" created successfully!`);
        
        // Progress join group quest
        useQuests.getState().trackQuestProgress(QuestType.JOIN_GROUP);
      } catch (error) {
        console.error("Error creating group:", error);
        toast.error("Failed to create group. Name might be taken.");
      }
    },
    
    joinGroup: async (groupId: number) => {
      try {
        const { isAuthenticated, userId, username } = useAuth.getState();
        if (!isAuthenticated || !userId || !username) return;
        
        await apiRequest("POST", `/api/groups/${groupId}/join`);
        
        set(state => ({
          groups: [...state.groups, {
            id: groupId,
            name: state.invites.find(i => i.groupId === groupId)?.groupName || "Unknown Group",
            ownerId: state.invites.find(i => i.groupId === groupId)?.inviterId || 0,
            memberCount: 0,
            members: [{
              userId,
              username,
              role: GroupRole.MEMBER,
              joinedAt: new Date()
            }],
            messages: []
          }],
          invites: state.invites.filter(i => i.groupId !== groupId),
          currentGroupId: groupId
        }));
        
        toast.success(`You've joined the group!`);
        
        // Fetch group details
        get().fetchGroupDetail(groupId);
        
        // Progress join group quest
        useQuests.getState().trackQuestProgress(QuestType.JOIN_GROUP);
      } catch (error) {
        console.error("Error joining group:", error);
        toast.error("Failed to join group");
      }
    },
    
    leaveGroup: async (groupId: number) => {
      try {
        const { isAuthenticated, userId } = useAuth.getState();
        if (!isAuthenticated || !userId) return;
        
        await apiRequest("POST", `/api/groups/${groupId}/leave`);
        
        set(state => ({
          groups: state.groups.filter(g => g.id !== groupId),
          currentGroupId: state.currentGroupId === groupId ? null : state.currentGroupId
        }));
        
        toast.info(`You've left the group`);
      } catch (error) {
        console.error("Error leaving group:", error);
        toast.error("Failed to leave group");
      }
    },
    
    setCurrentGroup: (groupId: number | null) => {
      set({ currentGroupId: groupId });
      
      if (groupId !== null) {
        get().fetchGroupDetail(groupId);
      }
    },
    
    sendMessage: async (content: string) => {
      try {
        const { isAuthenticated, userId, username } = useAuth.getState();
        const { currentGroupId } = get();
        
        if (!isAuthenticated || !userId || !username || !currentGroupId) return;
        
        const response = await apiRequest("POST", `/api/groups/${currentGroupId}/message`, { content });
        const data = await response.json();
        
        set(state => ({
          groups: state.groups.map(g => 
            g.id === currentGroupId
              ? {
                  ...g,
                  messages: [
                    ...(g.messages || []),
                    {
                      id: data.id,
                      userId,
                      username,
                      content,
                      sentAt: new Date()
                    }
                  ]
                }
              : g
          )
        }));
        
        // Progress send message quest
        useQuests.getState().trackQuestProgress(QuestType.SEND_MESSAGE);
      } catch (error) {
        console.error("Error sending message:", error);
        toast.error("Failed to send message");
      }
    },
    
    inviteMember: async (groupId: number, username: string) => {
      try {
        const { isAuthenticated } = useAuth.getState();
        if (!isAuthenticated) return;
        
        await apiRequest("POST", `/api/groups/${groupId}/invite`, { username });
        
        toast.success(`Invitation sent to ${username}`);
      } catch (error) {
        console.error("Error inviting member:", error);
        toast.error("Failed to invite member");
      }
    },
    
    acceptInvite: async (groupId: number) => {
      try {
        const { isAuthenticated } = useAuth.getState();
        if (!isAuthenticated) return;
        
        await apiRequest("POST", `/api/groups/invites/${groupId}/accept`);
        
        // Join the group after accepting invite
        await get().joinGroup(groupId);
      } catch (error) {
        console.error("Error accepting invite:", error);
        toast.error("Failed to accept invite");
      }
    },
    
    rejectInvite: async (groupId: number) => {
      try {
        const { isAuthenticated } = useAuth.getState();
        if (!isAuthenticated) return;
        
        await apiRequest("POST", `/api/groups/invites/${groupId}/reject`);
        
        set(state => ({
          invites: state.invites.filter(i => i.groupId !== groupId)
        }));
        
        toast.info("Invitation rejected");
      } catch (error) {
        console.error("Error rejecting invite:", error);
        toast.error("Failed to reject invite");
      }
    },
    
    changeRole: async (groupId: number, userId: number, role: GroupRole) => {
      try {
        const { isAuthenticated } = useAuth.getState();
        if (!isAuthenticated) return;
        
        await apiRequest("PUT", `/api/groups/${groupId}/member/${userId}/role`, { role });
        
        set(state => ({
          groups: state.groups.map(g => 
            g.id === groupId
              ? {
                  ...g,
                  members: g.members?.map(m => 
                    m.userId === userId
                      ? { ...m, role }
                      : m
                  )
                }
              : g
          )
        }));
        
        toast.success(`Member role updated to ${role}`);
      } catch (error) {
        console.error("Error changing role:", error);
        toast.error("Failed to change member role");
      }
    },
    
    kickMember: async (groupId: number, userId: number) => {
      try {
        const { isAuthenticated } = useAuth.getState();
        if (!isAuthenticated) return;
        
        await apiRequest("DELETE", `/api/groups/${groupId}/member/${userId}`);
        
        set(state => ({
          groups: state.groups.map(g => 
            g.id === groupId
              ? {
                  ...g,
                  memberCount: g.memberCount - 1,
                  members: g.members?.filter(m => m.userId !== userId)
                }
              : g
          )
        }));
        
        toast.success("Member has been removed from the group");
      } catch (error) {
        console.error("Error kicking member:", error);
        toast.error("Failed to remove member");
      }
    },
    
    disbandGroup: async (groupId: number) => {
      try {
        const { isAuthenticated } = useAuth.getState();
        if (!isAuthenticated) return;
        
        await apiRequest("DELETE", `/api/groups/${groupId}`);
        
        set(state => ({
          groups: state.groups.filter(g => g.id !== groupId),
          currentGroupId: state.currentGroupId === groupId ? null : state.currentGroupId
        }));
        
        toast.info("Group has been disbanded");
      } catch (error) {
        console.error("Error disbanding group:", error);
        toast.error("Failed to disband group");
      }
    }
  }))
);

// Initialize groups data
setTimeout(() => {
  const { isAuthenticated } = useAuth.getState();
  if (isAuthenticated) {
    useGroups.getState().fetchGroups();
    useGroups.getState().fetchInvites();
  }
}, 0);
