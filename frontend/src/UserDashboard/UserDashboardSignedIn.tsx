import { useState } from 'react';
import { type User } from '@supabase/supabase-js';
import { supabase } from '../SupabaseClient';
import { useNavigate } from 'react-router-dom';
import ClassCard from './ClassCard';
import './UserDashboard.css';

interface ClassVisual {
    name: string,
    class_id: string,
    supervisor: string
}

function UserDashboardSignedIn({ user }: { user: User }) {
    const [classes, setClasses] = useState<ClassVisual[]>([]);
    const navigate = useNavigate();
    const name = user.user_metadata?.full_name || user.email || "User";

    const handleSignOut = async() => {
        await supabase.auth.signOut();
        navigate('/sign-in');
    }

    return(
        <div className='user-dashboard'>
            <button className="sign-out-btn" onClick={handleSignOut}>Sign-out</button>
            <h1>Welcome, {name}</h1>
            <h2>Your classes:</h2>
            <div className='classes-display-container'>
                {classes.map(cls => (
                    <ClassCard key={cls.class_id} classId={cls.class_id} classTitle={cls.name} supervisorName={cls.supervisor}/>
                ))}
            </div>
        </div>
    ); 
};

export default UserDashboardSignedIn;