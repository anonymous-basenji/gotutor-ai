import { Routes, Route } from 'react-router-dom';
import Home from './Home';
import SignIn from './SignIn';
import Terms from './Terms';
import UserDashboard from './UserDashboard';
import './App.css';

function App() {
  return(
    <Routes>
      <Route path='/' element={<Home />}/>
      <Route path='/sign-in' element={<SignIn/>}/>
      <Route path='/terms-of-service' element={<Terms/>}/>
      <Route path='/user-dashboard' element={<UserDashboard/>}/>
    </Routes>
  );
}

export default App;
