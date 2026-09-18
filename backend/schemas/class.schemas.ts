import { z } from 'zod';

export const createClassSchema = z.object({
    name: z.string().trim().min(1, 'Class name is required'),
});


export const addUserByEmailSchema = z.object({
    class_id: z.coerce.string({ error: 'class_id is required' }),
    email: z.string().min(1, 'Email is required'),
    role: z.enum(['supervisor', 'student']).default('student'),
});

export const removeUserSchema = z.object({
    class_id: z.coerce.string({ error: 'class_id is required' }),
    user_id: z.string().min(1, 'user_id is required'),
    role: z.enum(['supervisor', 'student']).default('student'),
});

export const deleteClassSchema = z.object({
    class_id: z.coerce.string({ error: 'class_id is required' }),
});

export const renameClassSchema = z.object({
    class_id: z.coerce.string({ error: 'class_id is required' }),
    new_name: z.string().min(1, 'new_name is required'),
});

export type CreateClassDTO = z.infer<typeof createClassSchema>;
export type AddUserByEmailDTO = z.infer<typeof addUserByEmailSchema>;
export type RemoveUserDTO = z.infer<typeof removeUserSchema>;
export type DeleteClassDTO = z.infer<typeof deleteClassSchema>;
export type RenameClassDTO = z.infer<typeof renameClassSchema>;
