/**
 * Global Error Handler Middleware
 *
 * This is the LAST middleware in the Express pipeline. Any error that
 * gets thrown (or passed via next(error)) in any Controller, Service,
 * or Repository ends up here.
 *
 * It checks the error type and sends the appropriate HTTP response:
 * - AppError → use the statusCode baked into the error (400, 403, 404, etc.)
 * - ZodError → 400 Bad Request with validation details
 * - Anything else → 500 Internal Server Error (and log it)
 *
 * This replaces every try/catch block in the old route handlers.
 */
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from '../errors/AppError';

export const errorHandler = (
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction,
): void => {
    // Our custom errors (BadRequestError, ForbiddenError, etc.)
    // already have the right status code baked in
    if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
    }

    // Zod validation errors — the schema.parse() call failed
    // In Zod v4, use .issues instead of .errors
    if (err instanceof z.ZodError) {
        const message = err.issues.map((issue: { message: string }) => issue.message).join(', ');
        res.status(400).json({ error: message });
        return;
    }

    // Anything else is unexpected — log it and send a generic 500
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Unexpected server error' });
};
