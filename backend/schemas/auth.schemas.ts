import { z } from 'zod';

export const syncUserSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    date_of_birth: z.string().min(1, 'Date of birth is required'),
});

export type SyncUserDTO = z.infer<typeof syncUserSchema>;
