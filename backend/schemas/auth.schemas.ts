import { z } from 'zod';

export const syncUserSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    date_of_birth: z.string().min(1, 'Date of birth is required'),
    accepted_terms: z.literal(true, {
        message: 'You must accept the Terms of Service',
    }),
});

export type SyncUserDTO = z.infer<typeof syncUserSchema>;
