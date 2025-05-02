import { Request, Response } from "express";
import { db } from "../db";
import { dogs, Dog, users } from "../../shared/schema";
import { eq, and } from "drizzle-orm";

// Get all dogs for user
export const getDogs = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const userDogs = await db.query.dogs.findMany({
      where: eq(dogs.userId, userId)
    });
    
    res.json(userDogs);
  } catch (error) {
    console.error("Get dogs error:", error);
    res.status(500).json({ message: "Failed to get dogs", error });
  }
};

// Get dog by ID
export const getDogById = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const dogId = parseInt(req.params.id);
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const dog = await db.query.dogs.findFirst({
      where: and(
        eq(dogs.id, dogId),
        eq(dogs.userId, userId)
      )
    });
    
    if (!dog) {
      return res.status(404).json({ message: "Dog not found" });
    }
    
    res.json(dog);
  } catch (error) {
    console.error("Get dog by ID error:", error);
    res.status(500).json({ message: "Failed to get dog", error });
  }
};

// Create a new dog
export const createDog = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const { name, strength, agility, defense, parent1Id, parent2Id } = req.body;
    
    // Validate input
    if (!name) {
      return res.status(400).json({ message: "Dog name is required" });
    }
    
    // Create dog
    const [newDog] = await db.insert(dogs).values({
      userId,
      name,
      level: 1,
      experience: 0,
      strength: strength || 5,
      agility: agility || 5,
      defense: defense || 5,
      happiness: 50,
      loyalty: 50,
      energy: 100,
      isAdult: false,
      parent1Id,
      parent2Id
    }).returning();
    
    res.status(201).json(newDog);
  } catch (error) {
    console.error("Create dog error:", error);
    res.status(500).json({ message: "Failed to create dog", error });
  }
};

// Feed a dog
export const feedDog = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const dogId = parseInt(req.params.id);
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Find dog and verify ownership
    const dog = await db.query.dogs.findFirst({
      where: and(
        eq(dogs.id, dogId),
        eq(dogs.userId, userId)
      )
    });
    
    if (!dog) {
      return res.status(404).json({ message: "Dog not found" });
    }
    
    // Verify user has enough PLK
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { plk: true }
    });
    
    if (!user || user.plk < 5) {
      return res.status(400).json({ message: "Not enough PLK" });
    }
    
    // Update PLK
    await db.update(users)
      .set({ plk: user.plk - 5 })
      .where(eq(users.id, userId));
    
    // Calculate new energy and experience
    const newEnergy = Math.min(100, dog.energy + 30);
    let newExperience = dog.experience + 10;
    let newLevel = dog.level;
    
    // Check for level up
    const expRequired = newLevel < 5 ? 30 : 100;
    if (newExperience >= expRequired) {
      newExperience -= expRequired;
      newLevel += 1;
    }
    
    // Update dog
    const [updatedDog] = await db.update(dogs)
      .set({
        energy: newEnergy,
        experience: newExperience,
        level: newLevel,
        isAdult: newLevel >= 5 // Dogs become adults at level 5
      })
      .where(eq(dogs.id, dogId))
      .returning();
    
    res.json(updatedDog);
  } catch (error) {
    console.error("Feed dog error:", error);
    res.status(500).json({ message: "Failed to feed dog", error });
  }
};

// Pet a dog
export const petDog = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const dogId = parseInt(req.params.id);
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Find dog and verify ownership
    const dog = await db.query.dogs.findFirst({
      where: and(
        eq(dogs.id, dogId),
        eq(dogs.userId, userId)
      )
    });
    
    if (!dog) {
      return res.status(404).json({ message: "Dog not found" });
    }
    
    // Calculate new happiness and loyalty
    const newHappiness = Math.min(100, dog.happiness + 15);
    const newLoyalty = Math.min(100, dog.loyalty + 10);
    
    // Update dog
    const [updatedDog] = await db.update(dogs)
      .set({
        happiness: newHappiness,
        loyalty: newLoyalty
      })
      .where(eq(dogs.id, dogId))
      .returning();
    
    res.json(updatedDog);
  } catch (error) {
    console.error("Pet dog error:", error);
    res.status(500).json({ message: "Failed to pet dog", error });
  }
};

// Train a dog
export const trainDog = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const dogId = parseInt(req.params.id);
    const { stat } = req.body;
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    if (!stat || !['strength', 'agility', 'defense'].includes(stat)) {
      return res.status(400).json({ message: "Invalid stat to train" });
    }
    
    // Find dog and verify ownership
    const dog = await db.query.dogs.findFirst({
      where: and(
        eq(dogs.id, dogId),
        eq(dogs.userId, userId)
      )
    });
    
    if (!dog) {
      return res.status(404).json({ message: "Dog not found" });
    }
    
    // Verify user has enough PLK
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { plk: true }
    });
    
    if (!user || user.plk < 10) {
      return res.status(400).json({ message: "Not enough PLK" });
    }
    
    // Update PLK
    await db.update(users)
      .set({ plk: user.plk - 10 })
      .where(eq(users.id, userId));
    
    // Calculate new stat value, energy, and experience
    const statIncrement = Math.floor(Math.random() * 2) + 1; // Random 1-2 increase
    const newStatValue = dog[stat] + statIncrement;
    const newEnergy = Math.max(10, dog.energy - 20);
    let newExperience = dog.experience + 15;
    let newLevel = dog.level;
    
    // Check for level up
    const expRequired = newLevel < 5 ? 30 : 100;
    if (newExperience >= expRequired) {
      newExperience -= expRequired;
      newLevel += 1;
    }
    
    // Update dog
    const [updatedDog] = await db.update(dogs)
      .set({
        [stat]: newStatValue,
        energy: newEnergy,
        experience: newExperience,
        level: newLevel,
        isAdult: newLevel >= 5 // Dogs become adults at level 5
      })
      .where(eq(dogs.id, dogId))
      .returning();
    
    res.json(updatedDog);
  } catch (error) {
    console.error("Train dog error:", error);
    res.status(500).json({ message: "Failed to train dog", error });
  }
};

// Breed dogs
export const breedDogs = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { dog1Id, dog2Id, puppyName } = req.body;
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    if (!dog1Id || !dog2Id) {
      return res.status(400).json({ message: "Two dogs are required for breeding" });
    }
    
    if (dog1Id === dog2Id) {
      return res.status(400).json({ message: "Cannot breed a dog with itself" });
    }
    
    // Verify user has enough PLK
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { plk: true }
    });
    
    if (!user || user.plk < 5) {
      return res.status(400).json({ message: "Not enough PLK" });
    }
    
    // Get both dogs and verify ownership and adulthood
    const dog1 = await db.query.dogs.findFirst({
      where: and(
        eq(dogs.id, dog1Id),
        eq(dogs.userId, userId)
      )
    });
    
    const dog2 = await db.query.dogs.findFirst({
      where: and(
        eq(dogs.id, dog2Id),
        eq(dogs.userId, userId)
      )
    });
    
    if (!dog1 || !dog2) {
      return res.status(404).json({ message: "One or both dogs not found" });
    }
    
    if (!dog1.isAdult || !dog2.isAdult) {
      return res.status(400).json({ message: "Both dogs must be adults to breed" });
    }
    
    // Check for breeding cooldown
    const now = new Date();
    if (dog1.breedingCooldown && new Date(dog1.breedingCooldown) > now) {
      return res.status(400).json({ message: `${dog1.name} is still on breeding cooldown` });
    }
    
    if (dog2.breedingCooldown && new Date(dog2.breedingCooldown) > now) {
      return res.status(400).json({ message: `${dog2.name} is still on breeding cooldown` });
    }
    
    // Update PLK
    await db.update(users)
      .set({ plk: user.plk - 5 })
      .where(eq(users.id, userId));
    
    // Set breeding cooldown for both parents (24 hours)
    const cooldownDate = new Date();
    cooldownDate.setHours(cooldownDate.getHours() + 24);
    
    await db.update(dogs)
      .set({ breedingCooldown: cooldownDate })
      .where(eq(dogs.id, dog1Id));
      
    await db.update(dogs)
      .set({ breedingCooldown: cooldownDate })
      .where(eq(dogs.id, dog2Id));
    
    // Generate puppy stats based on parents
    const name = puppyName || `Puppy of ${dog1.name} & ${dog2.name}`;
    const strength = Math.floor((dog1.strength + dog2.strength) / 2) + Math.floor(Math.random() * 3) - 1;
    const agility = Math.floor((dog1.agility + dog2.agility) / 2) + Math.floor(Math.random() * 3) - 1;
    const defense = Math.floor((dog1.defense + dog2.defense) / 2) + Math.floor(Math.random() * 3) - 1;
    
    // Create puppy
    const [puppy] = await db.insert(dogs).values({
      userId,
      name,
      level: 1,
      experience: 0,
      strength,
      agility,
      defense,
      happiness: 60,
      loyalty: 70,
      energy: 100,
      isAdult: false,
      parent1Id: dog1Id,
      parent2Id: dog2Id
    }).returning();
    
    res.status(201).json(puppy);
  } catch (error) {
    console.error("Breed dogs error:", error);
    res.status(500).json({ message: "Failed to breed dogs", error });
  }
};
