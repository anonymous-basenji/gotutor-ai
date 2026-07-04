import { useState, useContext } from 'react';
import { type User } from '@supabase/supabase-js';
import { UserContext } from '../UserProvider';
import ClassCard from './ClassCard';
import UserBadge from '../UserBadge/UserBadge';
import CreateClassCard from './CreateClassCard';
import './UserDashboard.css';

interface ClassVisual {
    name: string,
    class_id: string,
    supervisor: string
}

function UserDashboardSignedIn({ user }: { user: User }) {
    const [classes, setClasses] = useState<ClassVisual[]>([]);
    const userCtx = useContext(UserContext);
    const name = user.user_metadata?.full_name || user.email || "User";

    const handleCreateClass = async (className: string) => {
        
        
        // Optimistically add it to UI for demonstration purposes
        const newClass: ClassVisual = {
            name: className,
            class_id: Math.random().toString(36).substring(2, 11),
            supervisor: name
        };
        setClasses(prev => [...prev, newClass]);
    };

    return (
        <div className='user-dashboard'>
            <UserBadge />
            
            <h1>Welcome, {name}</h1>
            <h2>Your classes:</h2>
            <div className='classes-display-container'>
                {classes.map(cls => (
                    <ClassCard key={cls.class_id} classId={cls.class_id} classTitle={cls.name} supervisorName={cls.supervisor}/>
                ))}
                {userCtx?.isAdult && (
                    <CreateClassCard onCreate={handleCreateClass} />
                )}
            </div>
        </div>
    ); 
}

export default UserDashboardSignedIn;