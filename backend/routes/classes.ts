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

router.get("/get-class/:id", async(req: Request, res: Response) => {
    const classId = req.params.id;
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

    const { data: memberCheck, error: memberCheckError } = await supabase
        .from('UserClass')
        .select('role')
        .eq('user_id', user_id)
        .eq('class_id', classId)
        .maybeSingle();

    if (memberCheckError) {
        console.error(memberCheckError);
        return res.status(500).json({ error: 'Failed to verify class membership' });
    }

    if (!memberCheck) {
        return res.status(403).json({ error: 'Access denied: You are not a member of this class' });
    }

    const { data: classData, error: classDataError } = await supabase
        .from('Class')
        .select('name')
        .eq('class_id', classId)
        .maybeSingle();

    if (classDataError || !classData) {
        return res.status(404).json({ error: 'Class not found' });
    }

    const { data: members, error: membersError } = await supabase
        .from('UserClass')
        .select('role, user_id, User(name, email)')
        .eq('class_id', classId);

    if (membersError) {
        console.error(membersError);
        return res.status(500).json({ error: 'Failed to fetch class members' });
    }

    const supervisors = members
        .filter(m => m.role === 'supervisor')
        .map(m => ({
            user_id: m.user_id,
            name: (m.User as any)?.name ?? 'Unknown',
            email: (m.User as any)?.email ?? 'Unknown'
        }));

    const students = members
        .filter(m => m.role === 'student')
        .map(m => ({
            user_id: m.user_id,
            name: (m.User as any)?.name ?? 'Unknown',
            email: (m.User as any)?.email ?? 'Unknown'
        }));

    return res.status(200).json({
        class_id: classId,
        name: classData.name,
        supervisors,
        students
    });
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

router.post("/add-student-by-email", async(req: Request, res: Response) => {
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

    const classId = req.body.class_id;
    const email = req.body.email;

    const { data: supervisorCheck, error: supervisorError } = await supabase
        .from('UserClass')
        .select('role')
        .eq('user_id', user_id)
        .eq('class_id', classId)
        .eq('role', 'supervisor')
        .maybeSingle()

    if(supervisorError || !supervisorCheck) {
        return res.status(403).json({ error: 'Access denied: Only class supervisors can add students'});
    }

    const { data: student, error: studentError } = await supabase
        .from('User')
        .select('user_id')
        .eq('email', email)
        .maybeSingle();

    if(studentError || !student) {
        return res.status(404).json({ error: "No registered user found with that email" });
    }

    const { error: joinError } = await supabase
        .from('UserClass')
        .upsert(
            { user_id: student.user_id, class_id: classId, role: 'student'},
            { onConflict: 'user_id,class_id', ignoreDuplicates: true }
        );

    if(joinError) {
        return res.status(500).json({ error: 'Failed to add student to class' });
    }

    return res.status(201).json({ message: 'Student successfully added' });
})

export default router;