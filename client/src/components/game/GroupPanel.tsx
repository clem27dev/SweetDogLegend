import { useState, useEffect, useRef } from "react";
import { useGroups } from "@/lib/stores/useGroups";
import { useAuth } from "@/lib/stores/useAuth";
import { GroupRole } from "@/lib/types";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const GroupPanel = () => {
  const { userId } = useAuth();
  const { 
    groups, 
    invites, 
    currentGroupId, 
    fetchGroups,
    fetchGroupDetail,
    fetchInvites,
    createGroup,
    joinGroup,
    leaveGroup,
    setCurrentGroup,
    sendMessage,
    inviteMember,
    acceptInvite,
    rejectInvite,
    changeRole,
    kickMember,
    disbandGroup
  } = useGroups();
  
  const [messageInput, setMessageInput] = useState("");
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [inviteMemberOpen, setInviteMemberOpen] = useState(false);
  const [inviteMemberUsername, setInviteMemberUsername] = useState("");
  const [changeRoleOpen, setChangeRoleOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<{ id: number, username: string, role: GroupRole } | null>(null);
  const [newRole, setNewRole] = useState<GroupRole>(GroupRole.MEMBER);
  
  const currentGroup = groups.find(g => g.id === currentGroupId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom of messages when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [currentGroup?.messages]);
  
  // Fetch groups and invites when component mounts
  useEffect(() => {
    fetchGroups();
    fetchInvites();
  }, []);
  
  const handleCreateGroup = () => {
    if (!newGroupName.trim()) {
      toast.error("Please enter a group name");
      return;
    }
    
    createGroup(newGroupName, newGroupDescription || undefined);
    setCreateGroupOpen(false);
    setNewGroupName("");
    setNewGroupDescription("");
  };
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageInput.trim() || !currentGroupId) return;
    
    sendMessage(messageInput);
    setMessageInput("");
  };
  
  const handleInviteMember = () => {
    if (!inviteMemberUsername.trim() || !currentGroupId) {
      toast.error("Please enter a username");
      return;
    }
    
    inviteMember(currentGroupId, inviteMemberUsername);
    setInviteMemberOpen(false);
    setInviteMemberUsername("");
  };
  
  const handleChangeRole = () => {
    if (!selectedMember || !currentGroupId) return;
    
    changeRole(currentGroupId, selectedMember.id, newRole);
    setChangeRoleOpen(false);
    setSelectedMember(null);
  };
  
  const openChangeRoleDialog = (member: { userId: number, username: string, role: GroupRole }) => {
    setSelectedMember({ id: member.userId, username: member.username, role: member.role });
    setNewRole(member.role);
    setChangeRoleOpen(true);
  };
  
  const isGroupOwner = currentGroup?.ownerId === userId;
  const currentUserRole = currentGroup?.members?.find(m => m.userId === userId)?.role || GroupRole.MEMBER;
  const canInviteMembers = currentUserRole === GroupRole.OWNER || currentUserRole === GroupRole.ADMIN || currentUserRole === GroupRole.RECRUITER;
  const canManageRoles = currentUserRole === GroupRole.OWNER || currentUserRole === GroupRole.ADMIN;
  
  return (
    <div className="group-panel">
      <Tabs defaultValue={currentGroupId ? "group" : "list"}>
        <TabsList className="mb-4">
          <TabsTrigger value="list">My Groups</TabsTrigger>
          {currentGroupId && <TabsTrigger value="group">Current Group</TabsTrigger>}
          <TabsTrigger value="invites">Invites ({invites.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list">
          <div className="groups-list">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">My Groups</h3>
              <Button onClick={() => setCreateGroupOpen(true)}>
                <i className="fas fa-plus mr-2"></i> Create Group
              </Button>
            </div>
            
            {groups.length === 0 ? (
              <Card>
                <CardContent className="py-6 text-center">
                  <i className="fas fa-users text-4xl text-muted-foreground mb-3"></i>
                  <h3 className="mb-2">No Groups Yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create a new group or join one through invitations.
                  </p>
                  <Button onClick={() => setCreateGroupOpen(true)}>
                    Create Your First Group
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groups.map((group) => (
                  <Card key={group.id} className="group-card">
                    <CardHeader className="pb-2">
                      <CardTitle>{group.name}</CardTitle>
                      <CardDescription>
                        Members: {group.memberCount} • Owner: {group.ownerId === userId ? 'You' : 'Other'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      {group.description && <p className="text-sm mb-2">{group.description}</p>}
                    </CardContent>
                    <CardFooter className="pt-2 flex justify-between">
                      <Button variant="outline" onClick={() => leaveGroup(group.id)}>
                        Leave
                      </Button>
                      <Button onClick={() => setCurrentGroup(group.id)}>
                        Enter
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
        
        {currentGroupId && (
          <TabsContent value="group">
            {currentGroup && (
              <div className="current-group">
                <div className="group-header mb-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-bold">{currentGroup.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Members: {currentGroup.memberCount} • 
                        Created: {new Date(currentGroup.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {canInviteMembers && (
                        <Button variant="outline" size="sm" onClick={() => setInviteMemberOpen(true)}>
                          <i className="fas fa-user-plus mr-2"></i> Invite
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => setCurrentGroup(null)}>
                        Back
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="group-content flex flex-col md:flex-row gap-4">
                  <div className="chat-container flex-grow md:w-2/3">
                    <Card className="h-full flex flex-col">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Group Chat</CardTitle>
                      </CardHeader>
                      <CardContent className="flex-grow overflow-hidden">
                        <ScrollArea className="h-[280px] chat-messages">
                          {!currentGroup.messages || currentGroup.messages.length === 0 ? (
                            <div className="text-center py-4 text-muted-foreground">
                              No messages yet. Be the first to say something!
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {currentGroup.messages.map((message) => (
                                <div 
                                  key={message.id} 
                                  className={`message ${message.userId === userId ? 'my-message' : 'other-message'}`}
                                >
                                  <div className="message-header">
                                    <span className="message-sender">{message.username}</span>
                                    <span className="message-time">
                                      {new Date(message.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <div className="message-content">
                                    {message.content}
                                  </div>
                                </div>
                              ))}
                              <div ref={messagesEndRef} />
                            </div>
                          )}
                        </ScrollArea>
                      </CardContent>
                      <CardFooter>
                        <form onSubmit={handleSendMessage} className="w-full flex gap-2">
                          <Input 
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-grow"
                          />
                          <Button type="submit" disabled={!messageInput.trim()}>
                            <i className="fas fa-paper-plane"></i>
                          </Button>
                        </form>
                      </CardFooter>
                    </Card>
                  </div>
                  
                  <div className="members-container md:w-1/3">
                    <Card className="h-full">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Members</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[300px]">
                          <div className="space-y-2">
                            {currentGroup.members?.map((member) => (
                              <div 
                                key={member.userId} 
                                className="member-item flex justify-between items-center p-2 rounded hover:bg-muted"
                              >
                                <div>
                                  <div className="member-name font-medium">{member.username}</div>
                                  <div className="member-role text-xs text-muted-foreground">
                                    {member.role}
                                  </div>
                                </div>
                                
                                {member.userId !== userId && (canManageRoles || isGroupOwner) && (
                                  <div className="member-actions">
                                    {canManageRoles && (
                                      <Button 
                                        variant="ghost" 
                                        size="icon"
                                        onClick={() => openChangeRoleDialog(member)}
                                      >
                                        <i className="fas fa-user-cog"></i>
                                      </Button>
                                    )}
                                    
                                    {((isGroupOwner && member.role !== GroupRole.OWNER) || 
                                      (currentUserRole === GroupRole.ADMIN && 
                                       member.role !== GroupRole.OWNER && 
                                       member.role !== GroupRole.ADMIN)) && (
                                      <Button 
                                        variant="ghost" 
                                        size="icon"
                                        onClick={() => kickMember(currentGroupId, member.userId)}
                                      >
                                        <i className="fas fa-user-times text-destructive"></i>
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                      
                      {isGroupOwner && (
                        <CardFooter>
                          <Button 
                            variant="destructive" 
                            className="w-full"
                            onClick={() => {
                              if (window.confirm('Are you sure you want to disband this group? This action cannot be undone.')) {
                                disbandGroup(currentGroupId);
                              }
                            }}
                          >
                            <i className="fas fa-trash-alt mr-2"></i> Disband Group
                          </Button>
                        </CardFooter>
                      )}
                    </Card>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        )}
        
        <TabsContent value="invites">
          <div className="invites-list">
            <h3 className="text-lg font-bold mb-4">Group Invitations</h3>
            
            {invites.length === 0 ? (
              <Card>
                <CardContent className="py-6 text-center">
                  <i className="fas fa-envelope-open text-4xl text-muted-foreground mb-3"></i>
                  <h3 className="mb-2">No Invitations</h3>
                  <p className="text-sm text-muted-foreground">
                    You don't have any group invitations at the moment.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {invites.map((invite) => (
                  <Card key={invite.groupId} className="invite-card">
                    <CardContent className="py-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-bold">{invite.groupName}</h4>
                          <p className="text-sm text-muted-foreground">
                            Invited by: {invite.inviterName}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => rejectInvite(invite.groupId)}
                          >
                            Decline
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => acceptInvite(invite.groupId)}
                          >
                            Accept
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Create Group Dialog */}
      <Dialog open={createGroupOpen} onOpenChange={setCreateGroupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
            <DialogDescription>
              Create your own group to invite friends and chat together.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="group-name">Group Name</label>
              <Input
                id="group-name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Enter group name"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="group-description">Description (Optional)</label>
              <Input
                id="group-description"
                value={newGroupDescription}
                onChange={(e) => setNewGroupDescription(e.target.value)}
                placeholder="Describe your group"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateGroupOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateGroup}>
              Create Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Invite Member Dialog */}
      <Dialog open={inviteMemberOpen} onOpenChange={setInviteMemberOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Member</DialogTitle>
            <DialogDescription>
              Enter the username of the person you want to invite.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="member-username">Username</label>
              <Input
                id="member-username"
                value={inviteMemberUsername}
                onChange={(e) => setInviteMemberUsername(e.target.value)}
                placeholder="Enter username"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteMemberOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInviteMember}>
              Send Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Change Role Dialog */}
      <Dialog open={changeRoleOpen} onOpenChange={setChangeRoleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Member Role</DialogTitle>
            <DialogDescription>
              Change the role for {selectedMember?.username}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="member-role">Role</label>
              <Select value={newRole} onValueChange={(value) => setNewRole(value as GroupRole)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {!isGroupOwner && <SelectItem value={GroupRole.OWNER} disabled>Owner</SelectItem>}
                  {isGroupOwner && <SelectItem value={GroupRole.OWNER}>Owner</SelectItem>}
                  <SelectItem value={GroupRole.ADMIN}>Admin</SelectItem>
                  <SelectItem value={GroupRole.RECRUITER}>Recruiter</SelectItem>
                  <SelectItem value={GroupRole.MEMBER}>Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangeRoleOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangeRole}>
              Change Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GroupPanel;
