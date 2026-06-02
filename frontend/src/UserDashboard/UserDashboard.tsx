import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../UserProvider';
import SignedOut from '../SignedOut';
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
                <SignedOut nav={navigate}/>
            }
        </div>
    ); 
};

export default UserDashboard;