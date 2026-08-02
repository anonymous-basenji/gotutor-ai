import { z } from 'zod';

export const createClassSchema = z.object({
    name: z.string().trim().min(1, 'Class name is required'),
});

export const addUserToClassSchema = z.object({
    class_id: z.union([z.string(), z.number()], { error: 'class_id is required' }),
    role: z.enum(['supervisor', 'student'], {
        error: 'role must be one of: supervisor, student',
    }),
});

export const addUserByEmailSchema = z.object({
    class_id: z.union([z.string(), z.number()], { error: 'class_id is required' }),
    email: z.string().min(1, 'Email is required'),
    role: z.enum(['supervisor', 'student']).default('student'),
});

export const removeUserSchema = z.object({
    class_id: z.union([z.string(), z.number()], { error: 'class_id is required' }),
    user_id: z.string().optional(),
    target_user_id: z.string().optional(),
    student_id: z.string().optional(),
    role: z.string().default('student'),
});

export const deleteClassSchema = z.object({
    class_id: z.union([z.string(), z.number()], { error: 'class_id is required' }),
});

export const renameClassSchema = z.object({
    class_id: z.union([z.string(), z.number()], { error: 'class_id is required' }),
    new_name: z.string().min(1, 'new_name is required'),
});

export type CreateClassDTO = z.infer<typeof createClassSchema>;
export type AddUserToClassDTO = z.infer<typeof addUserToClassSchema>;
export type AddUserByEmailDTO = z.infer<typeof addUserByEmailSchema>;
export type RemoveUserDTO = z.infer<typeof removeUserSchema>;
export type DeleteClassDTO = z.infer<typeof deleteClassSchema>;
export type RenameClassDTO = z.infer<typeof renameClassSchema>;
