import { useState, useContext } from 'react';
import { type User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../UserProvider';
import ClassCard from './ClassCard';
import UserBadge from '../UserBadge/UserBadge';
import './UserDashboard.css';

interface ClassVisual {
    name: string,
    class_id: string,
    supervisor: string
}

function UserDashboardSignedIn({ user }: { user: User }) {
    const [classes, setClasses] = useState<ClassVisual[]>([]);
    const userCtx = useContext(UserContext);
    const navigate = useNavigate();
    const name = user.user_metadata?.full_name || user.email || "User";

    return(
        <div className='user-dashboard'>
            <UserBadge/>
            {
                userCtx?.isAdult ?
                (<button className='add-cls-btn'>+ Add Class</button>)
                :
                (<></>)
            }
            
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