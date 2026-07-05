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
});

router.get("/get-classes", async(req: Request, res: Response) => {
    const authHeader = req.headers.authorization;

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

    const { data: userClasses, error: classesError } = await supabase
        .from('UserClass')
        .select('class_id, role, Class(name)')
        .eq('user_id', user_id);

    if (classesError) {
        console.error(classesError);
        return res.status(500).json({ error: 'Failed to fetch classes' });
    }

    if (userClasses.length === 0) {
        return res.status(200).json([]);
    }

    const classIds = userClasses.map(uc => uc.class_id);

    const { data: supervisors, error: supervisorsError } = await supabase
        .from('UserClass')
        .select('class_id, User(name)')
        .in('class_id', classIds)
        .eq('role', 'supervisor');

    if (supervisorsError) {
        console.error(supervisorsError);
        return res.status(500).json({ error: 'Failed to fetch supervisor info' });
    }

    const supervisorMap: Record<string, string> = {};
    for (const row of supervisors) {
        const supervisorName = (row.User as any)?.name ?? 'Unknown';
        supervisorMap[row.class_id] = supervisorName;
    }

    const result = userClasses.map(uc => ({
        class_id: uc.class_id,
        role: uc.role,
        name: (uc.Class as any)?.name ?? 'Unnamed Class',
        supervisor: supervisorMap[uc.class_id] ?? 'Unknown'
    }));

    return res.status(200).json(result);
});


router.post("/add-user-to-class", async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;

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

    const { class_id, role } = req.body;

    if (!class_id) {
        return res.status(400).json({ error: 'class_id is required' });
    }

    const validRoles = ['supervisor', 'student'];
    if (!role || !validRoles.includes(role)) {
        return res.status(400).json({ error: `role must be one of: ${validRoles.join(', ')}` });
    }

    const { data, error } = await supabase
        .from('UserClass')
        .upsert(
            { user_id, class_id, role },
            { onConflict: 'user_id,class_id', ignoreDuplicates: true }
        )
        .select();

    if (error) {
        console.error(error);
        return res.status(500).json({ error: 'Failed to add user to class' });
    }

    return res.status(201).json(data);
});

export default router;