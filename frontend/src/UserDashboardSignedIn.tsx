import { type User } from 'firebase/auth';
import './UserDashboard.css';

function UserDashboardSignedIn({ user }: { user: User }) {

    return(
        <div className='user-dashboard'>
            <p>haha, you're a user! And your name is {user.displayName}! Haha!</p>
        </div>
    ); 
};

export default UserDashboardSignedIn;