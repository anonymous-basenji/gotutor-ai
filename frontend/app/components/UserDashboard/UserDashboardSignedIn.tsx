import { useState, useContext, useEffect } from 'react';
import { type User } from '@supabase/supabase-js';
import { supabase } from '../../lib/SupabaseClient';
import { UserContext } from '../../lib/UserProvider';
import ClassCard from './ClassCard';
import UserBadge from '../UserBadge/UserBadge';
import CreateClassCard from './CreateClassCard';
import './UserDashboard.css';

interface ClassVisual {
    name: string;
    class_id: string;
    supervisor: string;
    role: string;
}

function UserDashboardSignedIn({ user }: { user: User }) {
    const [classes, setClasses] = useState<ClassVisual[]>([]);
    const userCtx = useContext(UserContext);
    const name = user.user_metadata?.full_name || user.email || "User";

    const handleCreateClass = async (className: string) => {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        let response: Response | null = null;
        try {
            response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/classes/create-class`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: className })
            });
        } catch(e) {
            console.error("Error creating new class:", e);
            return;
        }

        if(!response) {
            return;
        }

        if (response.ok) {
            const data = await response.json();
            await addCurrUserAsSupervisor(data[0].class_id);
            await fetchClasses();
        }        
    };

    const addCurrUserAsSupervisor = async(classId: string) => {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        try {
            await fetch(`${import.meta.env.VITE_BACKEND_URL}/classes/add-user-to-class`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ class_id: classId, role: "supervisor" })
            });
        } catch(e) {
            console.error("Error adding supervisor to class:", e);
        }
    }

    const fetchClasses = async() => {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/classes/get-classes`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                console.error("Failed to fetch classes:", response.status);
                return;
            }

            const data = await response.json();
            const mapped: ClassVisual[] = data.map((row: any) => ({
                class_id: row.class_id,
                name: row.name,
                supervisor: row.supervisor,
                role: row.role
            }));
            setClasses(mapped);
        } catch(e) {
            console.error("Error fetching classes:", e);
        }
    };

    const checkName = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) return;

        try {
            await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/check-name`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
        } catch (e) {
            console.error("Error checking user name:", e);
        }
    };

    useEffect(() => {
        checkName();
        fetchClasses();
    }, []);

    return (
        <div className='user-dashboard'>
            <UserBadge />
            
            <h1>Welcome, {name}</h1>
            <h2>Your classes:</h2>
            <div className='classes-display-container'>
                {classes.map(cls => (
                    <ClassCard 
                        key={cls.class_id} 
                        classId={cls.class_id} 
                        classTitle={cls.name} 
                        supervisorName={cls.supervisor}
                        isSupervisor={cls.role === 'supervisor'}
                        onDeleteRefresh={fetchClasses}
                    />
                ))}
                {userCtx?.isAdult && (
                    <CreateClassCard onCreate={handleCreateClass} />
                )}
            </div>
        </div>
    ); 
}

export default UserDashboardSignedIn;
