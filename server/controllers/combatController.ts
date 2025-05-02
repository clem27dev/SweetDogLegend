import { Request, Response } from "express";
import { db } from "../db";
import { 
  combatEncounters, 
  combatParticipants, 
  dogs, 
  users 
} from "../../shared/schema";
import { eq, and, isNull } from "drizzle-orm";

// Get active combat for user
export const getActiveCombat = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Find active combat encounter
    const encounter = await db.query.combatEncounters.findFirst({
      where: and(
        eq(combatEncounters.userId, userId),
        eq(combatEncounters.status, "ongoing")
      )
    });
    
    if (!encounter) {
      return res.status(204).end(); // No active combat
    }
    
    // Get combat participants
    const participants = await db.query.combatParticipants.findMany({
      where: eq(combatParticipants.encounterId, encounter.id)
    });
    
    res.json({
      ...encounter,
      participants
    });
  } catch (error) {
    console.error("Get active combat error:", error);
    res.status(500).json({ message: "Failed to get active combat", error });
  }
};

// Get combat by ID
export const getCombatById = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const encounterId = parseInt(req.params.id);
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Find combat encounter and verify ownership
    const encounter = await db.query.combatEncounters.findFirst({
      where: and(
        eq(combatEncounters.id, encounterId),
        eq(combatEncounters.userId, userId)
      )
    });
    
    if (!encounter) {
      return res.status(404).json({ message: "Combat encounter not found" });
    }
    
    // Get combat participants
    const participants = await db.query.combatParticipants.findMany({
      where: eq(combatParticipants.encounterId, encounterId)
    });
    
    res.json({
      ...encounter,
      participants
    });
  } catch (error) {
    console.error("Get combat by ID error:", error);
    res.status(500).json({ message: "Failed to get combat encounter", error });
  }
};

// Start new combat
export const startCombat = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { difficulty = 1, team } = req.body;
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    if (!team || !Array.isArray(team) || team.length === 0) {
      return res.status(400).json({ message: "Team is required" });
    }
    
    // Verify user doesn't already have an active combat
    const activeCombat = await db.query.combatEncounters.findFirst({
      where: and(
        eq(combatEncounters.userId, userId),
        eq(combatEncounters.status, "ongoing")
      )
    });
    
    if (activeCombat) {
      return res.status(400).json({ 
        message: "You already have an active combat encounter",
        encounterId: activeCombat.id
      });
    }
    
    // Calculate rewards based on difficulty
    const difficultyMultiplier = difficulty;
    const plkReward = 10 * difficultyMultiplier;
    const lorReward = 15 * difficultyMultiplier;
    const gemsReward = 1 * difficultyMultiplier;
    const expReward = 20 * difficultyMultiplier;
    
    // Create combat encounter
    const [encounter] = await db.insert(combatEncounters).values({
      userId,
      status: "ongoing",
      difficulty,
      plkReward,
      lorReward,
      gemsReward,
      expReward,
      currentTurn: 1
    }).returning();
    
    // Verify dogs in team and add to participants
    for (const member of team) {
      const dog = await db.query.dogs.findFirst({
        where: and(
          eq(dogs.id, member.dogId),
          eq(dogs.userId, userId)
        )
      });
      
      if (!dog) {
        continue; // Skip if dog not found
      }
      
      // Add dog to combat participants
      await db.insert(combatParticipants).values({
        encounterId: encounter.id,
        dogId: dog.id,
        isEnemy: false,
        name: dog.name,
        currentHp: 50 + (dog.level * 5),
        maxHp: 50 + (dog.level * 5),
        strength: dog.strength,
        agility: dog.agility,
        defense: dog.defense,
        position: member.position,
        defeated: false
      });
    }
    
    // Generate enemy cats based on difficulty
    const enemyCount = Math.min(3, difficulty + 1);
    const baseEnemyStats = {
      strength: 5 + difficulty,
      agility: 5 + difficulty,
      defense: 5 + difficulty
    };
    
    const enemyNames = [
      "Evil Mittens",
      "Dark Whiskers",
      "Shadow Claw",
      "Malice Paws",
      "Viking Meowster"
    ];
    
    for (let i = 0; i < enemyCount; i++) {
      const enemyLevel = difficulty + Math.floor(Math.random() * 2);
      const hp = 40 + (enemyLevel * 5);
      
      // Randomize stats slightly
      const statVariance = Math.floor(Math.random() * 3) - 1; // -1 to +1
      
      await db.insert(combatParticipants).values({
        encounterId: encounter.id,
        isEnemy: true,
        name: i === enemyCount - 1 && difficulty >= 3 
          ? "Viking Rico" 
          : enemyNames[Math.floor(Math.random() * enemyNames.length)],
        currentHp: hp,
        maxHp: hp,
        strength: baseEnemyStats.strength + statVariance,
        agility: baseEnemyStats.agility + statVariance,
        defense: baseEnemyStats.defense + statVariance,
        position: i + 1 + team.length, // Position after player dogs
        defeated: false
      });
    }
    
    // Get all participants for response
    const participants = await db.query.combatParticipants.findMany({
      where: eq(combatParticipants.encounterId, encounter.id)
    });
    
    res.status(201).json({
      ...encounter,
      participants,
      rewards: {
        plk: plkReward,
        lor: lorReward,
        gems: gemsReward,
        exp: expReward
      }
    });
  } catch (error) {
    console.error("Start combat error:", error);
    res.status(500).json({ message: "Failed to start combat", error });
  }
};

// Execute combat action
export const executeAction = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const encounterId = parseInt(req.params.id);
    const { participantId, action, targetId } = req.body;
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    if (!action || !['attack', 'defend', 'pass'].includes(action)) {
      return res.status(400).json({ message: "Invalid action" });
    }
    
    if (action !== 'pass' && !targetId) {
      return res.status(400).json({ message: "Target is required for this action" });
    }
    
    // Find combat encounter and verify ownership
    const encounter = await db.query.combatEncounters.findFirst({
      where: and(
        eq(combatEncounters.id, encounterId),
        eq(combatEncounters.userId, userId),
        eq(combatEncounters.status, "ongoing")
      )
    });
    
    if (!encounter) {
      return res.status(404).json({ message: "Combat encounter not found or already completed" });
    }
    
    // Get all participants
    const allParticipants = await db.query.combatParticipants.findMany({
      where: eq(combatParticipants.encounterId, encounterId)
    });
    
    // Find acting participant
    const actor = allParticipants.find(p => p.id === participantId);
    if (!actor) {
      return res.status(404).json({ message: "Participant not found" });
    }
    
    if (actor.isEnemy) {
      return res.status(400).json({ message: "Cannot control enemy participants" });
    }
    
    if (actor.defeated) {
      return res.status(400).json({ message: "Defeated participants cannot act" });
    }
    
    if (actor.position !== encounter.currentTurn) {
      return res.status(400).json({ message: "It's not this participant's turn" });
    }
    
    // Combat logs
    const logs: string[] = [];
    logs.push(`${actor.name}'s turn.`);
    
    // Handle action
    if (action === 'attack') {
      const target = allParticipants.find(p => p.id === targetId);
      if (!target) {
        return res.status(404).json({ message: "Target not found" });
      }
      
      if (target.defeated) {
        return res.status(400).json({ message: "Cannot target defeated participants" });
      }
      
      // Calculate damage based on strength, agility, and defense
      const hitChance = 70 + (actor.agility - target.agility) * 2;
      const hit = Math.random() * 100 < hitChance;
      
      if (hit) {
        const baseDamage = actor.strength;
        const damageReduction = target.defense / 10;
        const damage = Math.max(1, Math.floor(baseDamage * (1 - damageReduction)));
        
        const newHp = Math.max(0, target.currentHp - damage);
        const defeated = newHp === 0;
        
        // Update target
        await db.update(combatParticipants)
          .set({
            currentHp: newHp,
            defeated
          })
          .where(eq(combatParticipants.id, target.id));
        
        logs.push(`${actor.name} attacks ${target.name} for ${damage} damage!`);
        
        if (defeated) {
          logs.push(`${target.name} has been defeated!`);
        }
      } else {
        logs.push(`${actor.name} tries to attack ${target.name} but misses!`);
      }
    } else if (action === 'defend') {
      // Increase defense temporarily (effect handled client-side)
      logs.push(`${actor.name} takes a defensive stance!`);
    } else if (action === 'pass') {
      logs.push(`${actor.name} passes their turn.`);
    }
    
    // Update encounter turn
    let nextTurn = encounter.currentTurn + 1;
    const maxPosition = Math.max(...allParticipants.map(p => p.position));
    
    if (nextTurn > maxPosition) {
      nextTurn = 1; // Reset to first position
    }
    
    // Check if next participant is defeated, skip if so
    while (allParticipants.find(p => p.position === nextTurn && p.defeated)) {
      nextTurn++;
      if (nextTurn > maxPosition) {
        nextTurn = 1;
      }
    }
    
    // Check if combat is over
    const allPlayerParticipants = allParticipants.filter(p => !p.isEnemy);
    const allEnemyParticipants = allParticipants.filter(p => p.isEnemy);
    
    const allPlayerDefeated = allPlayerParticipants.every(p => p.defeated);
    const allEnemyDefeated = allEnemyParticipants.every(p => p.defeated);
    
    let status = "ongoing";
    if (allPlayerDefeated) {
      status = "defeat";
      logs.push("Your team has been defeated!");
    } else if (allEnemyDefeated) {
      status = "victory";
      logs.push("Victory! You've defeated all the evil cats!");
    }
    
    // Update encounter
    await db.update(combatEncounters)
      .set({
        currentTurn: nextTurn,
        status,
        completedAt: status !== "ongoing" ? new Date() : undefined
      })
      .where(eq(combatEncounters.id, encounterId));
    
    // Get updated participants
    const updatedParticipants = await db.query.combatParticipants.findMany({
      where: eq(combatParticipants.encounterId, encounterId)
    });
    
    // Get updated encounter
    const updatedEncounter = await db.query.combatEncounters.findFirst({
      where: eq(combatEncounters.id, encounterId)
    });
    
    res.json({
      encounter: {
        ...updatedEncounter,
        participants: updatedParticipants,
        rewards: {
          plk: encounter.plkReward,
          lor: encounter.lorReward,
          gems: encounter.gemsReward,
          exp: encounter.expReward
        }
      },
      logs
    });
  } catch (error) {
    console.error("Execute action error:", error);
    res.status(500).json({ message: "Failed to execute action", error });
  }
};

// Execute enemy action
export const executeEnemyAction = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const encounterId = parseInt(req.params.id);
    const { participantId } = req.body;
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Find combat encounter and verify ownership
    const encounter = await db.query.combatEncounters.findFirst({
      where: and(
        eq(combatEncounters.id, encounterId),
        eq(combatEncounters.userId, userId),
        eq(combatEncounters.status, "ongoing")
      )
    });
    
    if (!encounter) {
      return res.status(404).json({ message: "Combat encounter not found or already completed" });
    }
    
    // Get all participants
    const allParticipants = await db.query.combatParticipants.findMany({
      where: eq(combatParticipants.encounterId, encounterId)
    });
    
    // Find acting enemy
    const enemy = allParticipants.find(p => p.id === participantId);
    if (!enemy) {
      return res.status(404).json({ message: "Enemy participant not found" });
    }
    
    if (!enemy.isEnemy) {
      return res.status(400).json({ message: "This is not an enemy participant" });
    }
    
    if (enemy.defeated) {
      return res.status(400).json({ message: "Defeated participants cannot act" });
    }
    
    if (enemy.position !== encounter.currentTurn) {
      return res.status(400).json({ message: "It's not this enemy's turn" });
    }
    
    // Combat logs
    const logs: string[] = [];
    logs.push(`${enemy.name}'s turn.`);
    
    // Enemy AI - Simple: Always attack a random player participant
    const playerParticipants = allParticipants.filter(p => !p.isEnemy && !p.defeated);
    
    if (playerParticipants.length > 0) {
      // Select random player participant as target
      const targetIndex = Math.floor(Math.random() * playerParticipants.length);
      const target = playerParticipants[targetIndex];
      
      // Calculate damage
      const hitChance = 70 + (enemy.agility - target.agility) * 2;
      const hit = Math.random() * 100 < hitChance;
      
      if (hit) {
        const baseDamage = enemy.strength;
        const damageReduction = target.defense / 10;
        const damage = Math.max(1, Math.floor(baseDamage * (1 - damageReduction)));
        
        const newHp = Math.max(0, target.currentHp - damage);
        const defeated = newHp === 0;
        
        // Update target
        await db.update(combatParticipants)
          .set({
            currentHp: newHp,
            defeated
          })
          .where(eq(combatParticipants.id, target.id));
        
        logs.push(`${enemy.name} attacks ${target.name} for ${damage} damage!`);
        
        if (defeated) {
          logs.push(`${target.name} has been defeated!`);
        }
      } else {
        logs.push(`${enemy.name} tries to attack ${target.name} but misses!`);
      }
    } else {
      logs.push(`${enemy.name} has no valid targets!`);
    }
    
    // Update encounter turn
    let nextTurn = encounter.currentTurn + 1;
    const maxPosition = Math.max(...allParticipants.map(p => p.position));
    
    if (nextTurn > maxPosition) {
      nextTurn = 1; // Reset to first position
    }
    
    // Check if next participant is defeated, skip if so
    while (allParticipants.find(p => p.position === nextTurn && p.defeated)) {
      nextTurn++;
      if (nextTurn > maxPosition) {
        nextTurn = 1;
      }
    }
    
    // Check if combat is over
    const allPlayerParticipants = allParticipants.filter(p => !p.isEnemy);
    const allEnemyParticipants = allParticipants.filter(p => p.isEnemy);
    
    const allPlayerDefeated = allPlayerParticipants.every(p => p.defeated);
    const allEnemyDefeated = allEnemyParticipants.every(p => p.defeated);
    
    let status = "ongoing";
    if (allPlayerDefeated) {
      status = "defeat";
      logs.push("Your team has been defeated!");
    } else if (allEnemyDefeated) {
      status = "victory";
      logs.push("Victory! You've defeated all the evil cats!");
    }
    
    // Update encounter
    await db.update(combatEncounters)
      .set({
        currentTurn: nextTurn,
        status,
        completedAt: status !== "ongoing" ? new Date() : undefined
      })
      .where(eq(combatEncounters.id, encounterId));
    
    // Get updated participants
    const updatedParticipants = await db.query.combatParticipants.findMany({
      where: eq(combatParticipants.encounterId, encounterId)
    });
    
    // Get updated encounter
    const updatedEncounter = await db.query.combatEncounters.findFirst({
      where: eq(combatEncounters.id, encounterId)
    });
    
    res.json({
      encounter: {
        ...updatedEncounter,
        participants: updatedParticipants,
        rewards: {
          plk: encounter.plkReward,
          lor: encounter.lorReward,
          gems: encounter.gemsReward,
          exp: encounter.expReward
        }
      },
      logs
    });
  } catch (error) {
    console.error("Execute enemy action error:", error);
    res.status(500).json({ message: "Failed to execute enemy action", error });
  }
};

// Distribute combat rewards
export const distributeCombatRewards = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const encounterId = parseInt(req.params.id);
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Find combat encounter and verify ownership
    const encounter = await db.query.combatEncounters.findFirst({
      where: and(
        eq(combatEncounters.id, encounterId),
        eq(combatEncounters.userId, userId),
        eq(combatEncounters.status, "victory")
      )
    });
    
    if (!encounter) {
      return res.status(404).json({ message: "Victorious combat encounter not found" });
    }
    
    // Award resources to user
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
    let newExperience = user.experience + encounter.expReward;
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
        plk: user.plk + encounter.plkReward,
        lor: user.lor + encounter.lorReward,
        gems: user.gems + encounter.gemsReward,
        experience: newExperience,
        level: newLevel
      })
      .where(eq(users.id, userId));
    
    // Award experience to participating dogs
    const participants = await db.query.combatParticipants.findMany({
      where: and(
        eq(combatParticipants.encounterId, encounterId),
        eq(combatParticipants.isEnemy, false),
        isNull(combatParticipants.defeated)
      )
    });
    
    for (const participant of participants) {
      if (!participant.dogId) continue;
      
      const dog = await db.query.dogs.findFirst({
        where: eq(dogs.id, participant.dogId)
      });
      
      if (!dog) continue;
      
      // Award experience based on dog's role in combat
      const dogExpReward = Math.floor(encounter.expReward / participants.length);
      let newDogExperience = dog.experience + dogExpReward;
      let newDogLevel = dog.level;
      
      // Check for level up
      const dogExpRequired = dog.level < 5 ? 30 : 100;
      if (newDogExperience >= dogExpRequired) {
        newDogExperience -= dogExpRequired;
        newDogLevel += 1;
      }
      
      // Update dog
      await db.update(dogs)
        .set({
          experience: newDogExperience,
          level: newDogLevel,
          isAdult: newDogLevel >= 5 // Dogs become adults at level 5
        })
        .where(eq(dogs.id, dog.id));
    }
    
    res.json({ message: "Combat rewards distributed successfully" });
  } catch (error) {
    console.error("Distribute combat rewards error:", error);
    res.status(500).json({ message: "Failed to distribute combat rewards", error });
  }
};
