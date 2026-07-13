import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import type { MetaFunction } from 'react-router';
import { UserContext } from '../lib/UserProvider';
import { supabase } from '../lib/SupabaseClient';
import SignedOut from '../components/SignedOut';
import UserDashboardSignedIn from '../components/UserDashboard/UserDashboardSignedIn';
import '../components/UserDashboard/UserDashboard.css';

export const meta: MetaFunction = () => [
  { title: "Dashboard — GoTutor.ai" },
  { name: "description", content: "Manage your GoTutor.ai classes and students from your personal dashboard." },
];

export default function UserDashboard() {
    const userCtx = useContext(UserContext);
    const navigate = useNavigate();

    const [hasProfile, setHasProfile] = useState<boolean | null>(null);

    useEffect(() => {
        if (userCtx?.user) {
            supabase.from('User').select('user_id').eq('user_id', userCtx.user.id).maybeSingle()
                .then(({ data }) => setHasProfile(!!data));
        } else if (!userCtx?.loading) {
            setHasProfile(false);
        }
    }, [userCtx?.user, userCtx?.loading]);

    if (userCtx?.loading || (userCtx?.user && hasProfile === null)) {
        return <div className="loading-screen">Loading dashboard...</div>;
    }

    return(
        <div>
            {userCtx?.user ? (
                <UserDashboardSignedIn user={userCtx.user}/>
            ) : 
                <SignedOut nav={navigate}/>
            }
        </div>
    ); 
}
