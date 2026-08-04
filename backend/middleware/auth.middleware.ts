import { Request, Response, NextFunction } from 'express';
import { supabase } from '../db';
import { UnauthorizedError } from '../errors/AppError';

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

        req.userId = user.id;
        req.userEmail = user.email ?? '';
        next();
    } catch (e) {
        if (e instanceof UnauthorizedError) {
            throw e;
        }
        throw new UnauthorizedError('Invalid token');
    }
};
