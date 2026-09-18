import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import type { MetaFunction } from 'react-router';
import { supabase } from '../lib/SupabaseClient';
import { UserContext } from '../lib/UserProvider';
import AgeForm from '../components/SignIn/AgeForm';
import '../components/SignIn/SignIn.css';

export const meta: MetaFunction = () => [
  { title: "Sign In — GoTutor.ai" },
  { name: "description", content: "Sign in to your GoTutor.ai account or create a new one." },
];

export default function SignIn() {
    const [showAgeForm, setShowAgeForm] = useState(false);
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

            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            if (!token) return;

            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 404) {
                setShowAgeForm(true);
            } else if (response.ok) {
                navigate('/user-dashboard');
            } else {
                console.error("Error checking user profile", response.status);
            }
        };

        if (userCtx && !userCtx.loading && userCtx.user) {
            checkUserProfile();
        }
    }, [userCtx?.user, userCtx?.loading, navigate]);

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
