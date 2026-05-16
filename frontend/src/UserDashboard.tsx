import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from './UserProvider';
import UserDashboardSignedIn from './UserDashboardSignedIn';
import './UserDashboard.css';

function UserDashboard() {
    const userCtx = useContext(UserContext);
    const navigate = useNavigate();

    return(
        <div>
            {userCtx?.user ? (
                // Add your dashboard content here when user is authenticated
                <UserDashboardSignedIn user={userCtx.user}/>
            ) : 
                <p>Whoops! It appears that you are signed out. Please go back to the <a onClick={() => navigate('/sign-in')}>sign-in page</a> and sign in with a valid account.</p>
            }
        </div>
    ); 
};

export default UserDashboard;