import { type User } from 'firebase/auth';
import './UserDashboard.css';

function UserDashboardSignedIn({ user }: { user: User }) {

    return(
        <div className='user-dashboard'>
            <h1>Welcome, {user.displayName}</h1>
        </div>
    ); 
};

export default UserDashboardSignedIn;