import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from './firebase-config';
import { UserContext } from './UserProvider';
import './SignIn.css';

function SignIn() {
    const userCtx = useContext(UserContext);
    const navigate = useNavigate();

    const handleGoogleSignIn = async() => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            userCtx?.setUser(user);
            console.log("user is ");
            console.log(user);

            if(user) {
                navigate('/user-dashboard');
            }
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
