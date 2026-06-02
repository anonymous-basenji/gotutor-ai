import { useNavigate } from 'react-router-dom';
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
                <button className='sign-in-btn' onClick={() => navigate('/sign-in')}>Sign In or Create Account</button>
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
