/**
 * Base error class for the application.
 * Every custom error stores an HTTP status code so the global
 * error handler can send the right response automatically.
 *
 * Usage: throw new ForbiddenError('Only supervisors can do this');
 *   → the error handler catches it and sends res.status(403).json({ error: '...' })
 */
export class AppError extends Error {
    public readonly statusCode: number;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;

        // Fix the prototype chain (needed when extending built-in classes in TS)
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

/** 400 — The client sent invalid data (bad JSON, missing fields, etc.) */
export class BadRequestError extends AppError {
    constructor(message = 'Bad request') {
        super(message, 400);
    }
}

/** 401 — No token, expired token, or invalid token */
export class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
        super(message, 401);
    }
}

/** 403 — Token is valid but the user doesn't have permission */
export class ForbiddenError extends AppError {
    constructor(message = 'Forbidden') {
        super(message, 403);
    }
}

/** 404 — The requested resource doesn't exist */
export class NotFoundError extends AppError {
    constructor(message = 'Not found') {
        super(message, 404);
    }
}

/** 409 — Conflict (e.g., duplicate email) */
export class ConflictError extends AppError {
    constructor(message = 'Conflict') {
        super(message, 409);
    }
}
