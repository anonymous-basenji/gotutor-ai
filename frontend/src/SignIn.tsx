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
            console.log("user is ");
            console.log(user);
        } catch (error) {
            console.error("Error signing in with Google", error);
        }
    }

    return(
        <div className='sign-in-screen'>
            <div className='sign-in-card'>
                <h1 className='sign-in-h1'>Choose an option to sign in</h1>
                <button className='student-btn' onClick={handleGoogleSignIn}>Sign-In With Google</button>
                <br></br>
                <br></br>
            </div>
            <br></br>
            <br></br>
        </div>
    )
}

export default SignIn;
