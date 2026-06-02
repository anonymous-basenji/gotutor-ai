import { useState } from 'react';
import { type User } from 'firebase/auth';
import ClassCard from './ClassCard';
import './UserDashboard.css';

interface ClassVisual {
    name: string,
    class_id: string,
    supervisor: string
}

function UserDashboardSignedIn({ user }: { user: User }) {
    const [classes, setClasses] = useState<ClassVisual[]>([]);

    return(
        <div className='user-dashboard'>
            <h1>Welcome, {user.displayName}</h1>
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