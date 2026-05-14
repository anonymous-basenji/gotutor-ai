import { useState } from 'react';
import { signInWithPopup, type User } from 'firebase/auth';
import { auth, googleProvider } from './firebase-config';
import './SupervisorSignIn.css';

function SupervisorSignIn() {
    const [user, setUser] = useState<User | null>(null);

    const handleGoogleSignIn = async() => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            setUser(result.user);
        } catch (error) {
            console.error("Error signing in with Google", error);
        }
    }

    return (
        <div className="supervisor-sign-in">
            <h1>Supervisor Sign In</h1>
            <button onClick={handleGoogleSignIn}>Sign in with Google</button>
            {user && <p>Signed in as: {user.displayName}</p>}
        </div>
    );
}

export default SupervisorSignIn;
