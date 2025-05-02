import { Request, Response } from "express";
import { db } from "../db";
import {
  groups,
  groupMembers,
  groupMessages,
  groupInvites,
  users
} from "../../shared/schema";
import { eq, and, or } from "drizzle-orm";
import { emitGroupMessage } from "../services/websocket";

// Get groups for user
export const getUserGroups = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Find all groups where user is a member
    const memberships = await db.query.groupMembers.findMany({
      where: eq(groupMembers.userId, userId)
    });
    
    const groupIds = memberships.map(m => m.groupId);
    
    if (groupIds.length === 0) {
      return res.json([]);
    }
    
    // Get group details
    const userGroups = await db.query.groups.findMany({
      where: (groups, { inArray }) => inArray(groups.id, groupIds)
    });
    
    res.json(userGroups);
  } catch (error) {
    console.error("Get user groups error:", error);
    res.status(500).json({ message: "Failed to get user groups", error });
  }
};

// Get group details
export const getGroupById = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const groupId = parseInt(req.params.id);
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Verify user is a member of the group
    const membership = await db.query.groupMembers.findFirst({
      where: and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, userId)
      )
    });
    
    if (!membership) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }
    
    // Get group details
    const group = await db.query.groups.findFirst({
      where: eq(groups.id, groupId)
    });
    
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    
    // Get members with usernames
    const members = await db.select({
      userId: groupMembers.userId,
      username: users.username,
      role: groupMembers.role,
      joinedAt: groupMembers.joinedAt
    })
    .from(groupMembers)
    .innerJoin(users, eq(groupMembers.userId, users.id))
    .where(eq(groupMembers.groupId, groupId));
    
    // Get messages with usernames
    const messages = await db.select({
      id: groupMessages.id,
      userId: groupMessages.userId,
      username: users.username,
      content: groupMessages.content,
      sentAt: groupMessages.sentAt
    })
    .from(groupMessages)
    .innerJoin(users, eq(groupMessages.userId, users.id))
    .where(eq(groupMessages.groupId, groupId))
    .orderBy(groupMessages.sentAt);
    
    res.json({
      ...group,
      members,
      messages
    });
  } catch (error) {
    console.error("Get group by ID error:", error);
    res.status(500).json({ message: "Failed to get group details", error });
  }
};

// Create a new group
export const createGroup = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { name, description } = req.body;
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    if (!name) {
      return res.status(400).json({ message: "Group name is required" });
    }
    
    // Check if group name is already taken
    const existingGroup = await db.query.groups.findFirst({
      where: eq(groups.name, name)
    });
    
    if (existingGroup) {
      return res.status(400).json({ message: "Group name is already taken" });
    }
    
    // Create group
    const [newGroup] = await db.insert(groups).values({
      name,
      description,
      ownerId: userId,
      memberCount: 1
    }).returning();
    
    // Add creator as member with owner role
    await db.insert(groupMembers).values({
      groupId: newGroup.id,
      userId,
      role: "owner"
    });
    
    res.status(201).json(newGroup);
  } catch (error) {
    console.error("Create group error:", error);
    res.status(500).json({ message: "Failed to create group", error });
  }
};

// Join a group
export const joinGroup = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const groupId = parseInt(req.params.id);
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Check if user is already a member
    const membership = await db.query.groupMembers.findFirst({
      where: and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, userId)
      )
    });
    
    if (membership) {
      return res.status(400).json({ message: "You are already a member of this group" });
    }
    
    // Check if group exists
    const group = await db.query.groups.findFirst({
      where: eq(groups.id, groupId)
    });
    
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    
    // Check if group is full (500 members max)
    if (group.memberCount >= 500) {
      return res.status(400).json({ message: "Group is at maximum capacity" });
    }
    
    // Add user as member
    await db.insert(groupMembers).values({
      groupId,
      userId,
      role: "member"
    });
    
    // Update member count
    await db.update(groups)
      .set({ memberCount: group.memberCount + 1 })
      .where(eq(groups.id, groupId));
    
    // Remove invites for this user to this group
    await db.delete(groupInvites)
      .where(and(
        eq(groupInvites.groupId, groupId),
        eq(groupInvites.userId, userId)
      ));
    
    res.json({ message: "Successfully joined group" });
  } catch (error) {
    console.error("Join group error:", error);
    res.status(500).json({ message: "Failed to join group", error });
  }
};

// Leave a group
export const leaveGroup = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const groupId = parseInt(req.params.id);
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Check if user is a member
    const membership = await db.query.groupMembers.findFirst({
      where: and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, userId)
      )
    });
    
    if (!membership) {
      return res.status(400).json({ message: "You are not a member of this group" });
    }
    
    // Check if user is the owner
    const group = await db.query.groups.findFirst({
      where: eq(groups.id, groupId)
    });
    
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    
    if (group.ownerId === userId) {
      // If owner, need to transfer ownership or disband
      const otherAdmins = await db.query.groupMembers.findMany({
        where: and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.role, "admin"),
          eq(groupMembers.userId, userId).not()
        )
      });
      
      if (otherAdmins.length > 0) {
        // Transfer ownership to first admin
        const newOwnerId = otherAdmins[0].userId;
        
        await db.update(groups)
          .set({ ownerId: newOwnerId })
          .where(eq(groups.id, groupId));
        
        await db.update(groupMembers)
          .set({ role: "owner" })
          .where(and(
            eq(groupMembers.groupId, groupId),
            eq(groupMembers.userId, newOwnerId)
          ));
      } else {
        // No admins to transfer to, disband group
        return await disbandGroup(req, res);
      }
    }
    
    // Remove user from group
    await db.delete(groupMembers)
      .where(and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, userId)
      ));
    
    // Update member count
    await db.update(groups)
      .set({ memberCount: group.memberCount - 1 })
      .where(eq(groups.id, groupId));
    
    res.json({ message: "Successfully left group" });
  } catch (error) {
    console.error("Leave group error:", error);
    res.status(500).json({ message: "Failed to leave group", error });
  }
};

// Send a message in group chat
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const username = req.user?.username;
    const groupId = parseInt(req.params.id);
    const { content } = req.body;
    
    if (!userId || !username) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    if (!content) {
      return res.status(400).json({ message: "Message content is required" });
    }
    
    // Check if user is a member of the group
    const membership = await db.query.groupMembers.findFirst({
      where: and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, userId)
      )
    });
    
    if (!membership) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }
    
    // Create message
    const [message] = await db.insert(groupMessages).values({
      groupId,
      userId,
      content
    }).returning();
    
    // Emit message to all group members via WebSocket
    emitGroupMessage(groupId, {
      id: message.id,
      userId,
      username,
      content: message.content,
      sentAt: message.sentAt
    });
    
    res.status(201).json(message);
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ message: "Failed to send message", error });
  }
};

// Invite a user to a group
export const inviteMember = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const username = req.user?.username;
    const groupId = parseInt(req.params.id);
    const { username: targetUsername } = req.body;
    
    if (!userId || !username) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    if (!targetUsername) {
      return res.status(400).json({ message: "Target username is required" });
    }
    
    // Check if user can invite members (owner, admin, recruiter)
    const membership = await db.query.groupMembers.findFirst({
      where: and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, userId)
      )
    });
    
    if (!membership) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }
    
    if (!["owner", "admin", "recruiter"].includes(membership.role)) {
      return res.status(403).json({ message: "You don't have permission to invite members" });
    }
    
    // Find target user
    const targetUser = await db.query.users.findFirst({
      where: eq(users.username, targetUsername)
    });
    
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Check if target user is already a member
    const targetMembership = await db.query.groupMembers.findFirst({
      where: and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, targetUser.id)
      )
    });
    
    if (targetMembership) {
      return res.status(400).json({ message: "User is already a member of this group" });
    }
    
    // Check if invite already exists
    const existingInvite = await db.query.groupInvites.findFirst({
      where: and(
        eq(groupInvites.groupId, groupId),
        eq(groupInvites.userId, targetUser.id),
        eq(groupInvites.status, "pending")
      )
    });
    
    if (existingInvite) {
      return res.status(400).json({ message: "User already has a pending invite to this group" });
    }
    
    // Create invite
    await db.insert(groupInvites).values({
      groupId,
      userId: targetUser.id,
      invitedById: userId,
      status: "pending"
    });
    
    res.status(201).json({ message: "Invitation sent successfully" });
  } catch (error) {
    console.error("Invite member error:", error);
    res.status(500).json({ message: "Failed to invite member", error });
  }
};

// Get invites for user
export const getInvites = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Get pending invites with group and inviter details
    const invites = await db.select({
      groupId: groupInvites.groupId,
      groupName: groups.name,
      inviterId: groupInvites.invitedById,
      inviterName: users.username
    })
    .from(groupInvites)
    .innerJoin(groups, eq(groupInvites.groupId, groups.id))
    .innerJoin(users, eq(groupInvites.invitedById, users.id))
    .where(and(
      eq(groupInvites.userId, userId),
      eq(groupInvites.status, "pending")
    ));
    
    res.json(invites);
  } catch (error) {
    console.error("Get invites error:", error);
    res.status(500).json({ message: "Failed to get invites", error });
  }
};

// Accept group invite
export const acceptInvite = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const groupId = parseInt(req.params.groupId);
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Find invite
    const invite = await db.query.groupInvites.findFirst({
      where: and(
        eq(groupInvites.groupId, groupId),
        eq(groupInvites.userId, userId),
        eq(groupInvites.status, "pending")
      )
    });
    
    if (!invite) {
      return res.status(404).json({ message: "Invite not found or already processed" });
    }
    
    // Update invite status
    await db.update(groupInvites)
      .set({ 
        status: "accepted",
        respondedAt: new Date()
      })
      .where(eq(groupInvites.id, invite.id));
    
    res.json({ message: "Invite accepted" });
  } catch (error) {
    console.error("Accept invite error:", error);
    res.status(500).json({ message: "Failed to accept invite", error });
  }
};

// Reject group invite
export const rejectInvite = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const groupId = parseInt(req.params.groupId);
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Find invite
    const invite = await db.query.groupInvites.findFirst({
      where: and(
        eq(groupInvites.groupId, groupId),
        eq(groupInvites.userId, userId),
        eq(groupInvites.status, "pending")
      )
    });
    
    if (!invite) {
      return res.status(404).json({ message: "Invite not found or already processed" });
    }
    
    // Update invite status
    await db.update(groupInvites)
      .set({ 
        status: "rejected",
        respondedAt: new Date()
      })
      .where(eq(groupInvites.id, invite.id));
    
    res.json({ message: "Invite rejected" });
  } catch (error) {
    console.error("Reject invite error:", error);
    res.status(500).json({ message: "Failed to reject invite", error });
  }
};

// Change member role
export const changeRole = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const groupId = parseInt(req.params.id);
    const targetUserId = parseInt(req.params.userId);
    const { role } = req.body;
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    if (!role || !["owner", "admin", "recruiter", "member"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    
    // Check user's permissions
    const group = await db.query.groups.findFirst({
      where: eq(groups.id, groupId)
    });
    
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    
    const userMembership = await db.query.groupMembers.findFirst({
      where: and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, userId)
      )
    });
    
    if (!userMembership) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }
    
    // Check user authority
    const isOwner = group.ownerId === userId;
    const isAdmin = userMembership.role === "admin";
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "You don't have permission to change roles" });
    }
    
    // Owner role can only be assigned by transferring ownership
    if (role === "owner" && !isOwner) {
      return res.status(403).json({ message: "Only the owner can transfer ownership" });
    }
    
    // Admin role can only be assigned by owner
    if (role === "admin" && !isOwner) {
      return res.status(403).json({ message: "Only the owner can assign admin role" });
    }
    
    // Find target member
    const targetMembership = await db.query.groupMembers.findFirst({
      where: and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, targetUserId)
      )
    });
    
    if (!targetMembership) {
      return res.status(404).json({ message: "Target user is not a member of this group" });
    }
    
    // Admins can't modify other admins or the owner
    if (isAdmin && !isOwner && (targetMembership.role === "admin" || targetMembership.role === "owner")) {
      return res.status(403).json({ message: "You don't have permission to modify this user's role" });
    }
    
    // If transferring ownership
    if (role === "owner") {
      // Update group owner
      await db.update(groups)
        .set({ ownerId: targetUserId })
        .where(eq(groups.id, groupId));
      
      // Demote current owner to admin
      await db.update(groupMembers)
        .set({ role: "admin" })
        .where(and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.userId, userId)
        ));
    }
    
    // Update member role
    await db.update(groupMembers)
      .set({ role })
      .where(and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, targetUserId)
      ));
    
    res.json({ message: "Role updated successfully" });
  } catch (error) {
    console.error("Change role error:", error);
    res.status(500).json({ message: "Failed to change role", error });
  }
};

// Kick member from group
export const kickMember = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const groupId = parseInt(req.params.id);
    const targetUserId = parseInt(req.params.userId);
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Can't kick yourself, use leave group instead
    if (userId === targetUserId) {
      return res.status(400).json({ message: "Cannot kick yourself, use leave group instead" });
    }
    
    // Check user's permissions
    const group = await db.query.groups.findFirst({
      where: eq(groups.id, groupId)
    });
    
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    
    const userMembership = await db.query.groupMembers.findFirst({
      where: and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, userId)
      )
    });
    
    if (!userMembership) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }
    
    // Check user authority
    const isOwner = group.ownerId === userId;
    const isAdmin = userMembership.role === "admin";
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "You don't have permission to kick members" });
    }
    
    // Find target member
    const targetMembership = await db.query.groupMembers.findFirst({
      where: and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, targetUserId)
      )
    });
    
    if (!targetMembership) {
      return res.status(404).json({ message: "Target user is not a member of this group" });
    }
    
    // Can't kick owner
    if (targetUserId === group.ownerId) {
      return res.status(403).json({ message: "Cannot kick the group owner" });
    }
    
    // Admins can't kick other admins
    if (isAdmin && !isOwner && targetMembership.role === "admin") {
      return res.status(403).json({ message: "Admins cannot kick other admins" });
    }
    
    // Remove member
    await db.delete(groupMembers)
      .where(and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, targetUserId)
      ));
    
    // Update member count
    await db.update(groups)
      .set({ memberCount: group.memberCount - 1 })
      .where(eq(groups.id, groupId));
    
    res.json({ message: "Member kicked successfully" });
  } catch (error) {
    console.error("Kick member error:", error);
    res.status(500).json({ message: "Failed to kick member", error });
  }
};

// Disband group
export const disbandGroup = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const groupId = parseInt(req.params.id);
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Check if user is the owner
    const group = await db.query.groups.findFirst({
      where: eq(groups.id, groupId)
    });
    
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    
    if (group.ownerId !== userId) {
      return res.status(403).json({ message: "Only the group owner can disband the group" });
    }
    
    // Delete all related records
    await db.transaction(async (tx) => {
      // Delete messages
      await tx.delete(groupMessages)
        .where(eq(groupMessages.groupId, groupId));
      
      // Delete invites
      await tx.delete(groupInvites)
        .where(eq(groupInvites.groupId, groupId));
      
      // Delete members
      await tx.delete(groupMembers)
        .where(eq(groupMembers.groupId, groupId));
      
      // Delete group
      await tx.delete(groups)
        .where(eq(groups.id, groupId));
    });
    
    res.json({ message: "Group disbanded successfully" });
  } catch (error) {
    console.error("Disband group error:", error);
    res.status(500).json({ message: "Failed to disband group", error });
  }
};
