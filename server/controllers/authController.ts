import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../db";
import { users, insertUserSchema, User } from "../../shared/schema";
import { eq } from "drizzle-orm";

// JWT secret - in production would be from environment variables
const JWT_SECRET = process.env.JWT_SECRET || "sweet-dog-secret-key";

// Generate JWT token
const generateToken = (user: User) => {
  return jwt.sign(
    { id: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// Register new user
export const register = async (req: Request, res: Response) => {
  try {
    // Validate input using Zod schema
    const validatedData = insertUserSchema.parse(req.body);
    
    // Check if username or email already exists
    const existingUser = await db.query.users.findFirst({
      where: (users, { or, eq }) => or(
        eq(users.username, validatedData.username),
        eq(users.email, validatedData.email)
      )
    });
    
    if (existingUser) {
      return res.status(400).json({ message: "Username or email already in use" });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(validatedData.password, salt);
    
    // Create user
    const [user] = await db.insert(users).values({
      ...validatedData,
      password: hashedPassword,
    }).returning();
    
    if (!user) {
      return res.status(500).json({ message: "Failed to create user" });
    }
    
    // Create starter dogs for the new user
    const starterDogs = [
      {
        userId: user.id,
        name: "Luc",
        level: 1,
        strength: 7,
        agility: 5,
        defense: 6,
        isAdult: false
      },
      {
        userId: user.id,
        name: "Lynda",
        level: 1,
        strength: 5,
        agility: 7,
        defense: 6,
        isAdult: false
      }
    ];
    
    // Insert starter dogs
    await db.transaction(async (tx) => {
      for (const dog of starterDogs) {
        await tx.insert(dogs).values(dog);
      }
    });
    
    // Generate JWT token
    const token = generateToken(user);
    
    // Return success with token
    res.status(201).json({
      message: "User registered successfully",
      token,
      userId: user.id,
      username: user.username
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(400).json({ message: "Registration failed", error });
  }
};

// Login user
export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    
    // Check if user exists
    const user = await db.query.users.findFirst({
      where: eq(users.username, username)
    });
    
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    
    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    
    // Generate JWT token
    const token = generateToken(user);
    
    // Return success with token
    res.json({
      message: "Login successful",
      token,
      userId: user.id,
      username: user.username
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed", error });
  }
};

// Verify JWT token
export const verifyToken = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });
    
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    
    res.json({
      userId: user.id,
      username: user.username
    });
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(500).json({ message: "Token verification failed", error });
  }
};

// Get user resources
export const getResources = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        plk: true,
        lor: true,
        gems: true,
        level: true,
        experience: true,
        lastResourceUpdate: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json(user);
  } catch (error) {
    console.error("Get resources error:", error);
    res.status(500).json({ message: "Failed to get resources", error });
  }
};

// Update user resources
export const updateResources = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const { plk, lor, gems } = req.body;
    
    const [updatedUser] = await db.update(users)
      .set({
        plk: plk !== undefined ? plk : undefined,
        lor: lor !== undefined ? lor : undefined,
        gems: gems !== undefined ? gems : undefined,
        lastResourceUpdate: new Date()
      })
      .where(eq(users.id, userId))
      .returning({
        plk: users.plk,
        lor: users.lor,
        gems: users.gems,
        lastResourceUpdate: users.lastResourceUpdate
      });
    
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json(updatedUser);
  } catch (error) {
    console.error("Update resources error:", error);
    res.status(500).json({ message: "Failed to update resources", error });
  }
};

// Update passive resources
export const updatePassiveResources = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Get user
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        plk: true,
        lor: true,
        gems: true,
        lastResourceUpdate: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Calculate time since last update
    const now = new Date();
    const lastUpdate = new Date(user.lastResourceUpdate);
    const hoursSinceLastUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
    
    // Only update if it's been at least 15 minutes (0.25 hours)
    if (hoursSinceLastUpdate < 0.25) {
      return res.json(user);
    }
    
    // Calculate resource gains (20 PLK, 20 Lor, 2 Gems per hour)
    const hoursElapsed = Math.floor(hoursSinceLastUpdate);
    const plkGained = 20 * hoursElapsed;
    const lorGained = 20 * hoursElapsed;
    const gemsGained = 2 * hoursElapsed;
    
    // Update user resources
    const [updatedUser] = await db.update(users)
      .set({
        plk: user.plk + plkGained,
        lor: user.lor + lorGained,
        gems: user.gems + gemsGained,
        lastResourceUpdate: now
      })
      .where(eq(users.id, userId))
      .returning({
        plk: users.plk,
        lor: users.lor,
        gems: users.gems,
        lastResourceUpdate: users.lastResourceUpdate
      });
    
    res.json(updatedUser);
  } catch (error) {
    console.error("Update passive resources error:", error);
    res.status(500).json({ message: "Failed to update passive resources", error });
  }
};

// Add experience to user
export const addExperience = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid experience amount" });
    }
    
    // Get user
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        level: true,
        experience: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Calculate new experience and check for level up
    let newExperience = user.experience + amount;
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
    
    // Update user level and experience
    const [updatedUser] = await db.update(users)
      .set({
        level: newLevel,
        experience: newExperience
      })
      .where(eq(users.id, userId))
      .returning({
        level: users.level,
        experience: users.experience
      });
    
    res.json(updatedUser);
  } catch (error) {
    console.error("Add experience error:", error);
    res.status(500).json({ message: "Failed to add experience", error });
  }
};
