import { React } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SignIn from './SignIn.jsx';
import './Home.css';

function Home() {
    const navigate = useNavigate();

    return(
        <div className='home-page'>
            <div className='top-bar'>
                <h1 className='title'>GoTutor.ai</h1>
            </div>
            <div className='main-content'>
                <h1 className='catchphrase'>
                    Your private tutor, on demand.
                </h1>
                <button className='sign-in-btn' onClick={() => navigate('/sign-in')}>Sign In</button>
                <p>or</p>
                <button className='create-acc-btn' onClick={() => navigate('/sign-in')}>Create Account</button>
                <br></br>
                <br></br>
                <br></br>
                <br></br>
                <br></br>
                <br></br>
            </div>
            
        </div>
    );
}

export default Home;