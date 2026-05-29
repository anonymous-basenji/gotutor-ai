import { type User } from 'firebase/auth';
import ClassCard from './ClassCard';
import './UserDashboard.css';

function UserDashboardSignedIn({ user }: { user: User }) {

    return(
        <div className='user-dashboard'>
            <h1>Welcome, {user.displayName}</h1>
            <h2>Your classes:</h2>
            <div className='classes-display-container'>
                
            </div>
        </div>
    ); 
};

export default UserDashboardSignedIn;