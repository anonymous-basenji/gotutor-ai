/**
 * Zod validation schemas for /classes endpoints.
 *
 * Each schema defines the exact shape of the request body for one endpoint.
 * The Controller calls schema.parse(req.body) — if it passes, the data is
 * guaranteed to be the right shape. If it fails, Zod throws automatically.
 *
 * Note: class_id is kept as a generic value (not coerced to number) because
 * the Supabase database may use UUIDs or integers for primary keys.
 * Supabase handles the type coercion on its end.
 */
import { z } from 'zod';

/** POST /classes/create-class */
export const createClassSchema = z.object({
    name: z.string().trim().min(1, 'Class name is required'),
});

/** POST /classes/add-user-to-class */
export const addUserToClassSchema = z.object({
    class_id: z.union([z.string()], { error: 'class_id is required' }),
    role: z.enum(['supervisor', 'student'], {
        error: 'role must be one of: supervisor, student',
    }),
});

/** POST /classes/add-user-by-email */
export const addUserByEmailSchema = z.object({
    class_id: z.union([z.string()], { error: 'class_id is required' }),
    email: z.string().min(1, 'Email is required'),
    role: z.enum(['supervisor', 'student']).default('student'),
});

/** DELETE /classes/remove-user */
export const removeUserSchema = z.object({
    class_id: z.union([z.string()], { error: 'class_id is required' }),
    // The frontend can send the target user ID under any of these 3 field names
    user_id: z.string().optional(),
    target_user_id: z.string().optional(),
    student_id: z.string().optional(),
    role: z.string().default('student'),
});

/** DELETE /classes/delete-class */
export const deleteClassSchema = z.object({
    class_id: z.union([z.string()], { error: 'class_id is required' }),
});

/** POST /classes/rename-class */
export const renameClassSchema = z.object({
    class_id: z.union([z.string()], { error: 'class_id is required' }),
    new_name: z.string().min(1, 'new_name is required'),
});

// Inferred types — use these in services instead of hand-writing types
export type CreateClassDTO = z.infer<typeof createClassSchema>;
export type AddUserToClassDTO = z.infer<typeof addUserToClassSchema>;
export type AddUserByEmailDTO = z.infer<typeof addUserByEmailSchema>;
export type RemoveUserDTO = z.infer<typeof removeUserSchema>;
export type DeleteClassDTO = z.infer<typeof deleteClassSchema>;
export type RenameClassDTO = z.infer<typeof renameClassSchema>;
