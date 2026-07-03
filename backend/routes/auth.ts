import { Router, Request, Response } from 'express';
import { supabase } from '../db';

const router = Router();

const calculateAge = (birthDate: Date) => {
    const currentDate: Date = new Date();

    // 1. Calculate the raw difference in years
    let age = currentDate.getFullYear() - birthDate.getFullYear();

    // 2. Calculate the difference in months
    const monthDiff = currentDate.getMonth() - birthDate.getMonth();

    // 3. Adjust if the birthday hasn't happened yet this year
    // Condition: Current month is before birth month OR
    // (It is the birth month, but the current day is before the birth day)
    if (monthDiff < 0 || (monthDiff === 0 && currentDate.getDate() < birthDate.getDate())) {
        age--;
    }

    return age;
};

router.post("/sync-user", async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer')) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    let user_id: string;
    let user_email: string;

    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        user_id = user.id;
        user_email = user.email ?? '';
    } catch (e) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    const dob = new Date(req.body.date_of_birth);
    if (isNaN(dob.getTime()) || dob > new Date()) {
        return res.status(400).json({ error: 'Invalid date of birth' });
    }

    const age = calculateAge(dob);

    if (age < 13) {
        await supabase.from('User').delete().eq('user_id', user_id);
        await supabase.auth.admin.deleteUser(user_id);
        return res.status(403).json({ error: 'User must be 13 or older' });
    }

    try {
        const { data: upserted, error: upsertError } = await supabase
            .from('User')
            .upsert(
                { user_id, email: user_email, name: req.body.name, date_of_birth: req.body.date_of_birth },
                { onConflict: 'user_id', ignoreDuplicates: true }
            )
            .select();

        if (upsertError) {
            console.error('Upsert error:', upsertError);
            return res.status(500).json({ error: 'Failed to create user' });
        }

        return res.status(200).json(upserted);
    } catch (e) {
        console.error('Unhandled upsert exception:', e);
        return res.status(500).json({ error: 'Unexpected server error' });
    }


});

export default router;
