import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Extend Express Request interface to include user property
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
    // Get token from header
    const token = req.header('x-auth-token');
    
    // Check if no token
    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Pas de token, autorisation refusée' 
        });
    }
    
    try {
        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET) as { id: number; username: string };
        
        // Add user from payload to request
        req.user = decoded;
        
        next();
    } catch (error) {
        res.status(401).json({ 
            success: false, 
            message: 'Token invalide' 
        });
    }
};