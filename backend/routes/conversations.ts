import { Router, Request, Response } from 'express';
import { supabase } from '../db';

const router = Router();

router.get('/', async(req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const class_id = req.query.class_id;
    const student_id = req.query.student_id;

    if (!authHeader || !authHeader.startsWith('Bearer')) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    let user_id: string;

    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) return res.status(401).json({ error: 'Invalid or expired token' });
        user_id = user.id;
    } catch (e) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    let targetStudentId = (req.query.student_id as string) || user_id;
    if(targetStudentId !== user_id) {
        const { data: check } = await supabase
            .from('UserClass')
            .select('role')
            .eq('user_id', user_id)
            .eq('class_id', class_id)
            .eq('role', 'supervisor')
            .maybeSingle();

        if(!check) {
            return res.status(403).json({ error: 'Access denied: You are not a supervisor in this class' });
        }
    }

    const { data, error } = await supabase
        .from("Conversation")
        .select("*")
        .eq("student_id", targetStudentId)
        .eq("class_id", class_id);

    if(error) {
        console.error(error);
        return res.status(500).json({ error: 'Failed to fetch conversations' });
    }

    return res.status(200).json(data);

});

export default router;