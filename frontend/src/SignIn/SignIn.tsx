import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../SupabaseClient';
import { UserContext } from '../UserProvider';
import AgeForm from './AgeForm';
import './SignIn.css';

function SignIn() {
    const [showAgeForm, setShowAgeForm] = useState(false);
    const [signingIn, setSigningIn] = useState(false);
    const userCtx = useContext(UserContext);
    const navigate = useNavigate();

    const handleGoogleSignIn = async() => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${import.meta.env.VITE_FRONTEND_URL}/sign-in`
                }
            });

            if(error) {
                throw error;
            } else {
                setSigningIn(true);
                sessionStorage.setItem('oauth_in_progress', 'true');
            }
        } catch (error) {
            console.error("Error signing in with Google", error);
        }
    }

    useEffect(() => {
        const checkUserProfile = async() => {
            if(!userCtx?.user) {
                setShowAgeForm(false);
                return;
            }

            const { data, error } = await supabase
                .from('User')
                .select('user_id')
                .eq('user_id', userCtx.user.id)
                .maybeSingle();

            if(error) {
                console.error("Error checking user profile", error);
                return;
            };

            if(!data) {
                // Show the age form under the button if they have no profile
                setShowAgeForm(true);
            } else {
                // Profile exists, take them straight to dashboard
                navigate('/user-dashboard');
            };
        };

        // Run the check only after the session has finished loading
        if(userCtx && !userCtx.loading && userCtx.authEvent === 'SIGNED_IN' && sessionStorage.getItem('oauth_in_progress')) {
            sessionStorage.removeItem('oauth_in_progress');
            checkUserProfile();
        };
    }, [userCtx?.user, userCtx?.loading, userCtx?.authEvent, navigate]);

    return(
        <div className='sign-in-screen'>
            <div className='sign-in-card'>
                <h1 className='sign-in-h1'>Choose an option to sign in</h1>
                <button className='student-btn' onClick={handleGoogleSignIn}>Sign-In With Google</button>
                <br></br>
                {
                    showAgeForm ?
                        <AgeForm user={userCtx?.user} onComplete={() => navigate('/user-dashboard')}/>
                    :
                        <div></div>
                }
                <br></br>
            </div>
            <br></br>
            <br></br>
        </div>
    )
}

export default SignIn;
