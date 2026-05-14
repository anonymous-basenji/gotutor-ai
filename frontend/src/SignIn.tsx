import { useState } from 'react';
import { signInWithPopup, type User } from 'firebase/auth';
import { auth, googleProvider } from './firebase-config';
import './SignIn.css';

function SignIn() {
    const [user, setUser] = useState<User | null>(null);

    const handleGoogleSignIn = async() => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            setUser(result.user);
        } catch (error) {
            console.error("Error signing in with Google", error);
        }
    }

    return(
        <div className='sign-in-screen'>
            <div className='sign-in-card'>
                <h1 className='sign-in-h1'>Choose an option to sign in</h1>
                <button className='student-btn'>Student Sign-In</button>
                <br></br>
                <br></br>
                <p>Supervisors/Teachers/Parents:</p>
                <button className='supervisor-btn' onClick={handleGoogleSignIn}>Sign in with Google</button>
                {user && <p>Signed in as: {user.displayName}</p>}
            </div>
            <br></br>
            <br></br>
        </div>
    )
}

export default SignIn;
