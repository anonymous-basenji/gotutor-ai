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

router.post("/add-user-to-class", async(req: Request, res: Response) => {
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

const calculateAge = (birthDate: Date) => {
    const currentDate: Date = new Date();
    let age = currentDate.getFullYear() - birthDate.getFullYear();
    const monthDiff = currentDate.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && currentDate.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

router.post("/add-user-by-email", async(req: Request, res: Response) => {
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
    const role = req.body.role || 'student';

    if (role !== 'student' && role !== 'supervisor') {
        return res.status(400).json({ error: 'Role must be either student or supervisor' });
    }

    const { data: supervisorCheck, error: supervisorError } = await supabase
        .from('UserClass')
        .select('role')
        .eq('user_id', user_id)
        .eq('class_id', classId)
        .eq('role', 'supervisor')
        .maybeSingle();

    if (supervisorError || !supervisorCheck) {
        return res.status(403).json({ error: 'Access denied: Only class supervisors can add users' });
    }

    const { data: targetUser, error: targetUserError } = await supabase
        .from('User')
        .select('user_id, date_of_birth')
        .eq('email', email)
        .maybeSingle();

    if (targetUserError || !targetUser) {
        return res.status(404).json({ error: "No registered user found with that email" });
    }

    if (role === 'supervisor') {
        if (!targetUser.date_of_birth || calculateAge(new Date(targetUser.date_of_birth)) < 18) {
            return res.status(403).json({ error: 'User must be 18 or older to be added as a supervisor' });
        }
    }

    const { error: joinError } = await supabase
        .from('UserClass')
        .upsert(
            { user_id: targetUser.user_id, class_id: classId, role },
            { onConflict: 'user_id,class_id', ignoreDuplicates: true }
        );

    if (joinError) {
        return res.status(500).json({ error: `Failed to add ${role} to class` });
    }

    return res.status(201).json({ message: `${role === 'supervisor' ? 'Supervisor' : 'Student'} successfully added` });
});

router.delete("/remove-user", async(req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer')) {
        return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.split('Bearer ')[1];
    let requester_id: string;
    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) return res.status(401).json({ error: 'Invalid token' });
        requester_id = user.id;
    } catch (e) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    const { class_id } = req.body;
    const target_user_id = req.body.user_id || req.body.target_user_id || req.body.student_id;
    const role = req.body.role || 'student';

    if (!class_id || !target_user_id) {
        return res.status(400).json({ error: 'class_id and user_id are required' });
    }

    if (role === 'supervisor') {
        if (requester_id !== target_user_id) {
            return res.status(403).json({ error: 'Access denied: Only a supervisor can remove themselves from a class' });
        }

        const { data: supervisors, error: supError } = await supabase
            .from('UserClass')
            .select('user_id')
            .eq('class_id', class_id)
            .eq('role', 'supervisor');

        if (supError) {
            return res.status(500).json({ error: 'Failed to check class supervisors' });
        }

        if (supervisors.length <= 1) {
            return res.status(403).json({ error: 'Cannot leave class: A class must have at least one supervisor' });
        }
    } else {
        const { data: supervisorCheck, error: supervisorError } = await supabase
            .from('UserClass')
            .select('role')
            .eq('user_id', requester_id)
            .eq('class_id', class_id)
            .eq('role', 'supervisor')
            .maybeSingle();

        if (supervisorError || !supervisorCheck) {
            return res.status(403).json({ error: 'Access denied: Only supervisors can remove students' });
        }
    }

    const { error: deleteError } = await supabase
        .from('UserClass')
        .delete()
        .eq('user_id', target_user_id)
        .eq('class_id', class_id)
        .eq('role', role);

    if (deleteError) {
        console.error(deleteError);
        return res.status(500).json({ error: `Failed to remove ${role}` });
    }

    return res.status(200).json({ message: `${role === 'supervisor' ? 'Supervisor' : 'Student'} successfully removed` });
});

router.delete("/delete-class", async(req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer')) {
        return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.split('Bearer ')[1];
    let user_id: string;
    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) return res.status(401).json({ error: 'Invalid token' });
        user_id = user.id;
    } catch (e) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    const { class_id } = req.body;
    if (!class_id) {
        return res.status(400).json({ error: 'class_id is required' });
    }

    // 1. Verify user is a supervisor of the class
    const { data: supervisorCheck, error: supervisorError } = await supabase
        .from('UserClass')
        .select('role')
        .eq('user_id', user_id)
        .eq('class_id', class_id)
        .eq('role', 'supervisor')
        .maybeSingle();

    if (supervisorError || !supervisorCheck) {
        return res.status(403).json({ error: 'Access denied: Only supervisors can delete a class' });
    }

    try {
        // 2. Fetch conversations to delete their messages first (for constraint safety)
        const { data: conversations } = await supabase
            .from('Conversation')
            .select('conversation_id')
            .eq('class_id', class_id);
            
        const convIds = conversations?.map(c => c.conversation_id) || [];

        if (convIds.length > 0) {
            // Delete messages
            const { error: msgErr } = await supabase.from('Message').delete().in('conversation_id', convIds);
            if (msgErr) throw msgErr;

            // Delete conversations
            const { error: convErr } = await supabase.from('Conversation').delete().in('conversation_id', convIds);
            if (convErr) throw convErr;
        }

        // 3. Delete class memberships
        const { error: memberErr } = await supabase.from('UserClass').delete().eq('class_id', class_id);
        if (memberErr) throw memberErr;

        // 4. Delete the class itself
        const { error: classErr } = await supabase.from('Class').delete().eq('class_id', class_id);
        if (classErr) throw classErr;

        return res.status(200).json({ message: 'Class successfully deleted' });
    } catch (err) {
        console.error('Failed to delete class:', err);
        return res.status(500).json({ error: 'Failed to delete class and associated data' });
    }
});

router.post("/rename-class", async(req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if(!authHeader || !authHeader.startsWith('Bearer')) {
        return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.split('Bearer ')[1];
    let user_id: string;
    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if(authError || !user) {
            return res.status(401).json({ error: 'Invalid token'});
        }
        user_id = user.id;
    } catch(e) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    const { class_id, new_name } = req.body;
    if(!class_id || !new_name) {
        return res.status(400).json({ error: 'class_id or new_name missing' });
    }

    const { data: supervisorCheck, error: supervisorError } = await supabase
        .from('UserClass')
        .select('role')
        .eq('user_id', user_id)
        .eq('class_id', class_id)
        .eq('role', 'supervisor')
        .maybeSingle();

    if(supervisorError || !supervisorCheck) {
        return res.status(403).json({ error: 'Access denied: Only supervisors can access this resource' });
    }

    const { error: nameChangeError } = await supabase
        .from('Class')
        .update({ name: new_name })
        .eq('class_id', class_id)
        .select();

    if(nameChangeError) {
        console.error(nameChangeError);
        return res.status(500).json({ error: `Failed to rename class ${class_id}` });
    }

    return res.status(200).json({ message: 'Class successfully renamed' });
});

export default router;