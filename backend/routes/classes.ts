import { Router, Request, Response } from 'express';
import { supabase } from '../db';

const router = Router();

router.post("/create-class", async(req: Request, res: Response) => {
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
    } catch (e) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    if (!req.body.name?.trim()) {
        return res.status(400).json({ error: 'Class name is required' });
    }

    const { data, error } = await supabase
        .from('Class')
        .insert([
            { name: req.body.name }
        ])
        .select();

    if(error) {
        console.log(error);
        return res.status(500).json({ error: `Failed to create class: ${error}`});
    }

    return res.status(201).json(data);
})

export default router;