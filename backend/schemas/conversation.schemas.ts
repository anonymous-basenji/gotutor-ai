import { z } from 'zod';

export const createConversationSchema = z.object({
    class_id: z.coerce.string().min(1, 'class_id is required'),
    student_id: z.string().optional(),
    title: z.string().optional(),
});

export const updateConversationSchema = z.object({
    title: z.string().min(1, 'title cannot be empty'),
});
