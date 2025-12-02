import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractToken } from './auth';

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        email: string;
        role: string;
    };
}

/**
 * Middleware to verify JWT token
 */
export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = extractToken(req.headers.authorization);

    if (!token) {
        return res.status(401).json({ error: 'Missing authentication token' });
    }

    try {
        const payload = verifyToken(token);
        req.user = payload;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

/**
 * Middleware to check if user has required role
 */
export const authorize = (...allowedRoles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        next();
    };
};
