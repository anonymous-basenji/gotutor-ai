import { Routes, Route } from 'react-router-dom';
import Home from './Home';
import SignIn from './SignIn';
import Terms from './Terms';
import './App.css';
import SupervisorSignIn from './SupervisorSignIn';

function App() {
  return(
    <Routes>
      <Route path='/' element={<Home />}/>
      <Route path='/sign-in' element={<SignIn/>}/>
      <Route path='/terms-of-service' element={<Terms/>}/>
    </Routes>
  );
}

export default App;
