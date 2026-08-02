import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from '../errors/AppError';

export const errorHandler = (
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction,
): void => {
    if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
    }

    if (err instanceof z.ZodError) {
        const message = err.issues.map((issue: { message: string }) => issue.message).join(', ');
        res.status(400).json({ error: message });
        return;
    }

    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Unexpected server error' });
};
