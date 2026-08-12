import { z } from 'zod';

export const createConversationSchema = z.object({
    class_id: z.coerce.string().min(1, 'class_id is required'),
    student_id: z.string().optional(),
    title: z.string().optional(),
});

export const updateConversationSchema = z.object({
    title: z.string().min(1, 'title cannot be empty'),
});

export const sendMessageSchema = z.object({
    content: z.string().optional(),
    attachment_url: z.string().optional(),
    attachment_name: z.string().optional(),
    attachment_type: z.string().optional(),
}).refine(data => (data.content && data.content.trim().length > 0) || Boolean(data.attachment_url), {
    message: 'Either message content or an attachment is required',
});

export type CreateConversationDTO = z.infer<typeof createConversationSchema>;
export type UpdateConversationDTO = z.infer<typeof updateConversationSchema>;
export type SendMessageDTO = z.infer<typeof sendMessageSchema>;
