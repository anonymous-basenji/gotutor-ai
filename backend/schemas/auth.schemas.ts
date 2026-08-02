/**
 * Zod validation schemas for /auth endpoints.
 *
 * These run in the Controller BEFORE any business logic executes.
 * If the request body doesn't match the schema, Zod throws a ZodError
 * which the global error handler catches and sends as a 400 response.
 */
import { z } from 'zod';

/** POST /auth/sync-user — create or link a user profile after signup */
export const syncUserSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    date_of_birth: z.string().min(1, 'Date of birth is required'),
});

/** Type inferred from the schema — use this instead of hand-writing the type */
export type SyncUserDTO = z.infer<typeof syncUserSchema>;
