import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../UserProvider';
import { supabase } from '../SupabaseClient';
import SignedOut from '../SignedOut';
import UserDashboardSignedIn from './UserDashboardSignedIn';
import './UserDashboard.css';

function UserDashboard() {
    const userCtx = useContext(UserContext);
    const navigate = useNavigate();

    const [hasProfile, setHasProfile] = useState<boolean | null>(null);

    useEffect(() => {
        if (userCtx?.user) {
            // Check if profile exists for this authenticated user
            supabase.from('User').select('user_id').eq('user_id', userCtx.user.id).maybeSingle()
                .then(({ data }) => setHasProfile(!!data));
        } else if (!userCtx?.loading) {
            setHasProfile(false);
        }
    }, [userCtx?.user, userCtx?.loading]);

    // Show loading until we know their login and profile status
    if (userCtx?.loading || (userCtx?.user && hasProfile === null)) {
        return <div className="loading-screen">Loading dashboard...</div>;
    }

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