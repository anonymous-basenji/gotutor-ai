/**
 * Auth Middleware — requireAuth
 *
 * This runs BEFORE every protected route. It does ONE job:
 * 1. Read the Bearer token from the Authorization header
 * 2. Validate it with Supabase
 * 3. Attach the user's ID to the request object
 * 4. Call next() to let the request continue to the Controller
 *
 * If the token is missing or invalid, it throws an UnauthorizedError
 * which the global error handler catches and sends as a 401 response.
 *
 * This replaces the identical 10-line auth block that was previously
 * copy-pasted in every single route handler.
 */
import { Request, Response, NextFunction } from 'express';
import { supabase } from '../db';
import { UnauthorizedError } from '../errors/AppError';

/**
 * Extend Express's Request type so TypeScript knows about req.userId.
 * Without this, TypeScript would complain that 'userId' doesn't exist on Request.
 */
declare global {
    namespace Express {
        interface Request {
            userId: string;
            userEmail: string;
        }
    }
}

export const requireAuth = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer')) {
        throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.split('Bearer ')[1];

    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            throw new UnauthorizedError('Invalid or expired token');
        }

        // Attach user info to the request — every Controller can now use req.userId
        req.userId = user.id;
        req.userEmail = user.email ?? '';
        next();
    } catch (e) {
        // If the error is already an UnauthorizedError, rethrow it
        if (e instanceof UnauthorizedError) {
            throw e;
        }
        // Otherwise wrap it
        throw new UnauthorizedError('Invalid token');
    }
};
