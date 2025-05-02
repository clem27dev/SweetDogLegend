import { Request, Response } from "express";
import { db } from "../db";
import { quests, Quest, users } from "../../shared/schema";
import { eq, and } from "drizzle-orm";

// Quest types
const QUEST_TYPES = ['feed_dog', 'pet_dog', 'train_dog', 'win_combat', 'join_group', 'send_message'];

// Get quests for user
export const getQuests = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const userQuests = await db.query.quests.findMany({
      where: eq(quests.userId, userId)
    });
    
    // If no quests, generate some
    if (userQuests.length === 0) {
      await generateQuestsForUser(userId);
      
      const newQuests = await db.query.quests.findMany({
        where: eq(quests.userId, userId)
      });
      
      return res.json(newQuests);
    }
    
    res.json(userQuests);
  } catch (error) {
    console.error("Get quests error:", error);
    res.status(500).json({ message: "Failed to get quests", error });
  }
};

// Update quest progress
export const updateQuestProgress = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { type, amount = 1 } = req.body;
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    if (!type || !QUEST_TYPES.includes(type)) {
      return res.status(400).json({ message: "Invalid quest type" });
    }
    
    // Find user's quests of this type
    const userQuests = await db.query.quests.findMany({
      where: and(
        eq(quests.userId, userId),
        eq(quests.type, type),
        eq(quests.completed, false)
      )
    });
    
    // Update progress for each quest
    for (const quest of userQuests) {
      const newProgress = Math.min(quest.target, quest.progress + amount);
      
      await db.update(quests)
        .set({ progress: newProgress })
        .where(eq(quests.id, quest.id));
    }
    
    // Generate new quests if needed
    if (userQuests.length === 0) {
      await generateQuestOfType(userId, type);
    }
    
    // Get updated quests
    const updatedQuests = await db.query.quests.findMany({
      where: eq(quests.userId, userId)
    });
    
    res.json(updatedQuests);
  } catch (error) {
    console.error("Update quest progress error:", error);
    res.status(500).json({ message: "Failed to update quest progress", error });
  }
};

// Complete quest
export const completeQuest = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const questId = parseInt(req.params.id);
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Find quest and verify ownership
    const quest = await db.query.quests.findFirst({
      where: and(
        eq(quests.id, questId),
        eq(quests.userId, userId)
      )
    });
    
    if (!quest) {
      return res.status(404).json({ message: "Quest not found" });
    }
    
    if (quest.completed) {
      return res.status(400).json({ message: "Quest already completed" });
    }
    
    if (quest.progress < quest.target) {
      return res.status(400).json({ message: "Quest not ready to complete" });
    }
    
    // Complete quest
    await db.update(quests)
      .set({ completed: true })
      .where(eq(quests.id, questId));
    
    // Award rewards
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        plk: true,
        lor: true,
        gems: true,
        experience: true,
        level: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Calculate new experience and check for level up
    let newExperience = user.experience + quest.expReward;
    let newLevel = user.level;
    
    // Calculate experience required for current level
    const calculateExpRequired = (level: number) => 100 + (level - 1) * 50;
    let expRequired = calculateExpRequired(newLevel);
    
    // Check for level ups
    while (newExperience >= expRequired) {
      newExperience -= expRequired;
      newLevel++;
      expRequired = calculateExpRequired(newLevel);
    }
    
    // Update user
    await db.update(users)
      .set({
        plk: user.plk + quest.plkReward,
        lor: user.lor + quest.lorReward,
        gems: user.gems + quest.gemsReward,
        experience: newExperience,
        level: newLevel
      })
      .where(eq(users.id, userId));
    
    // Generate new quest of the same type
    await generateQuestOfType(userId, quest.type);
    
    res.json({ 
      message: "Quest completed and rewards claimed",
      rewards: {
        plk: quest.plkReward,
        lor: quest.lorReward,
        gems: quest.gemsReward,
        exp: quest.expReward
      }
    });
  } catch (error) {
    console.error("Complete quest error:", error);
    res.status(500).json({ message: "Failed to complete quest", error });
  }
};

// Generate new quests for user
export const generateNewQuests = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    await generateQuestsForUser(userId);
    
    const newQuests = await db.query.quests.findMany({
      where: eq(quests.userId, userId)
    });
    
    res.json(newQuests);
  } catch (error) {
    console.error("Generate quests error:", error);
    res.status(500).json({ message: "Failed to generate quests", error });
  }
};

// Helper function to generate quests for a user
async function generateQuestsForUser(userId: number) {
  try {
    // Get user level for scaling
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { level: true }
    });
    
    const userLevel = user?.level || 1;
    
    // Generate a quest for each type
    for (const type of QUEST_TYPES) {
      await generateQuestOfType(userId, type);
    }
  } catch (error) {
    console.error("Error generating quests for user:", error);
    throw error;
  }
}

// Helper function to generate a quest of a specific type
async function generateQuestOfType(userId: number, type: string) {
  try {
    // Get user level for scaling
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { level: true }
    });
    
    const userLevel = user?.level || 1;
    
    // Check if user already has active quest of this type
    const existingQuests = await db.query.quests.findMany({
      where: and(
        eq(quests.userId, userId),
        eq(quests.type, type),
        eq(quests.completed, false)
      )
    });
    
    if (existingQuests.length > 0) {
      return; // User already has an active quest of this type
    }
    
    // Define quest parameters based on type and user level
    let target: number;
    let plkReward: number;
    let lorReward: number;
    let gemsReward: number;
    let expReward: number;
    
    const levelMultiplier = Math.max(1, Math.floor(userLevel / 5)); // Increase every 5 levels
    
    switch (type) {
      case 'feed_dog':
        target = 3 + levelMultiplier;
        plkReward = 15 + (5 * levelMultiplier);
        lorReward = 10 + (3 * levelMultiplier);
        gemsReward = 1;
        expReward = 20 + (5 * levelMultiplier);
        break;
      case 'pet_dog':
        target = 5 + levelMultiplier;
        plkReward = 10 + (3 * levelMultiplier);
        lorReward = 15 + (5 * levelMultiplier);
        gemsReward = 1;
        expReward = 20 + (5 * levelMultiplier);
        break;
      case 'train_dog':
        target = 2 + levelMultiplier;
        plkReward = 20 + (5 * levelMultiplier);
        lorReward = 20 + (5 * levelMultiplier);
        gemsReward = 1;
        expReward = 30 + (8 * levelMultiplier);
        break;
      case 'win_combat':
        target = 1 + Math.floor(levelMultiplier / 2);
        plkReward = 25 + (8 * levelMultiplier);
        lorReward = 25 + (8 * levelMultiplier);
        gemsReward = 2;
        expReward = 40 + (10 * levelMultiplier);
        break;
      case 'join_group':
        target = 1;
        plkReward = 30;
        lorReward = 30;
        gemsReward = 3;
        expReward = 50;
        break;
      case 'send_message':
        target = 3 + levelMultiplier;
        plkReward = 15 + (3 * levelMultiplier);
        lorReward = 15 + (3 * levelMultiplier);
        gemsReward = 1;
        expReward = 25 + (5 * levelMultiplier);
        break;
      default:
        target = 1;
        plkReward = 10;
        lorReward = 10;
        gemsReward = 1;
        expReward = 20;
    }
    
    // Create quest
    await db.insert(quests).values({
      userId,
      type,
      target,
      progress: 0,
      plkReward,
      lorReward,
      gemsReward,
      expReward,
      completed: false
    });
  } catch (error) {
    console.error(`Error generating quest of type ${type}:`, error);
    throw error;
  }
}
