import { Request, Response } from 'express';
import { memoryDB } from '../services/memoryDB';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Generate JWT token for a user
const generateToken = (userId: number, username: string) => {
  return jwt.sign(
    { id: userId, username },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Register a new user
export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    
    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Veuillez fournir un nom d\'utilisateur, un email et un mot de passe.' 
      });
    }
    
    // Check if username already exists
    const existingUser = memoryDB.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Ce nom d\'utilisateur est déjà utilisé.' 
      });
    }
    
    // Hash password
    const salt = await bcryptjs.genSalt(10);
    const passwordHash = await bcryptjs.hash(password, salt);
    
    // Create user
    const user = memoryDB.createUser(username, email, passwordHash);
    
    // Generate token
    const token = generateToken(user.id, user.username);
    
    // Get user's resources
    const resources = memoryDB.getResources(user.id);
    
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        level: user.level
      },
      resources
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de l\'inscription.' 
    });
  }
};

// Login an existing user
export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    
    // Validate input
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Veuillez fournir un nom d\'utilisateur et un mot de passe.' 
      });
    }
    
    // Find user
    const user = memoryDB.getUserByUsername(username);
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nom d\'utilisateur ou mot de passe incorrect.' 
      });
    }
    
    // Verify password
    const isMatch = await bcryptjs.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nom d\'utilisateur ou mot de passe incorrect.' 
      });
    }
    
    // Generate token
    const token = generateToken(user.id, user.username);
    
    // Get user's resources
    const resources = memoryDB.getResources(user.id);
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        level: user.level
      },
      resources
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la connexion.' 
    });
  }
};

// Verify JWT token
export const verifyToken = async (req: Request, res: Response) => {
  try {
    // The user should be attached to the request by the auth middleware
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Non autorisé, veuillez vous connecter.' 
      });
    }
    
    // Get the full user object
    const user = memoryDB.getUserById(req.user.id);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Utilisateur non trouvé.' 
      });
    }
    
    // Get user's resources
    const resources = memoryDB.getResources(user.id);
    
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        level: user.level
      },
      resources
    });
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la vérification du token.' 
    });
  }
};

// Get user's resources
export const getResources = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Non autorisé, veuillez vous connecter.' 
      });
    }
    
    const resources = memoryDB.getResources(req.user.id);
    if (!resources) {
      return res.status(404).json({ 
        success: false, 
        message: 'Ressources non trouvées.' 
      });
    }
    
    res.json({
      success: true,
      resources
    });
  } catch (error) {
    console.error('Get resources error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération des ressources.' 
    });
  }
};

// Update user's resources
export const updateResources = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Non autorisé, veuillez vous connecter.' 
      });
    }
    
    const { plk, lor, gems } = req.body;
    
    // Validate input - allow zeros
    if (plk === undefined || lor === undefined || gems === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Veuillez fournir des valeurs pour plk, lor et gems.' 
      });
    }
    
    const updatedResources = memoryDB.updateResources(
      req.user.id,
      Number(plk),
      Number(lor),
      Number(gems)
    );
    
    if (!updatedResources) {
      return res.status(404).json({ 
        success: false, 
        message: 'Ressources non trouvées.' 
      });
    }
    
    res.json({
      success: true,
      resources: updatedResources
    });
  } catch (error) {
    console.error('Update resources error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la mise à jour des ressources.' 
    });
  }
};

// Update passive resources (called periodically)
export const updatePassiveResources = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Non autorisé, veuillez vous connecter.' 
      });
    }
    
    // Get current resources
    const currentResources = memoryDB.getResources(req.user.id);
    if (!currentResources) {
      return res.status(404).json({ 
        success: false, 
        message: 'Ressources non trouvées.' 
      });
    }
    
    // Calculate passive income (simple for now)
    const passivePlk = 1;
    const passiveLor = 2;
    
    const updatedResources = memoryDB.updateResources(
      req.user.id,
      passivePlk,
      passiveLor,
      0 // No passive gems
    );
    
    res.json({
      success: true,
      resources: updatedResources,
      added: {
        plk: passivePlk,
        lor: passiveLor,
        gems: 0
      }
    });
  } catch (error) {
    console.error('Update passive resources error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la mise à jour des ressources passives.' 
    });
  }
};

// Add experience to the user
export const addExperience = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Non autorisé, veuillez vous connecter.' 
      });
    }
    
    const { experience } = req.body;
    
    // Validate input
    if (!experience || isNaN(Number(experience)) || Number(experience) <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Veuillez fournir une valeur d\'expérience valide.' 
      });
    }
    
    // Get current user
    const user = memoryDB.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Utilisateur non trouvé.' 
      });
    }
    
    // Simple level up logic
    const expNeededForNextLevel = user.level * 100;
    let currentExp = Number(experience);
    let newLevel = user.level;
    
    // Level up if enough XP
    if (currentExp >= expNeededForNextLevel) {
      newLevel += 1;
      currentExp -= expNeededForNextLevel;
    }
    
    // Update user level
    const success = memoryDB.updateUserLevel(user.id, newLevel);
    
    if (!success) {
      return res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de la mise à jour du niveau.' 
      });
    }
    
    res.json({
      success: true,
      level: newLevel,
      leveledUp: newLevel > user.level
    });
  } catch (error) {
    console.error('Add experience error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de l\'ajout d\'expérience.' 
    });
  }
};