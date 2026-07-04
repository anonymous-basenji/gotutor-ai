import { useContext } from 'react';
import { supabase } from '../SupabaseClient';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../UserProvider';
import './UserBadge.css';

function UserBadge() {
    const navigate = useNavigate();
    const userCtx = useContext(UserContext);
    const user = userCtx?.user;

    if(!user) {
        return null;
    };

    const name = user.user_metadata?.full_name || user.email || "User";

    const handleSignOut = async() => {
        await supabase.auth.signOut();
        navigate('/sign-in');
    };

    return(
        <div className='user-badge'>
            <p>{name}</p>
            <button className="sign-out-btn" onClick={handleSignOut}>Sign-out</button>
        </div>
    );
};

export default UserBadge;