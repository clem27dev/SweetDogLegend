import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// JWT secret - in production would be from environment variables
const JWT_SECRET = process.env.JWT_SECRET || "sweet-dog-secret-key";

// Add user to request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
      };
    }
  }
}

// Authentication middleware
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({ message: "Access denied. No token provided." });
    }
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: number;
      username: string;
    };
    
    // Add user to request
    req.user = decoded;
    
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ message: "Invalid token" });
  }
};
