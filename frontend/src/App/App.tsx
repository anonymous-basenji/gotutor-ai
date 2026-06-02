import { Routes, Route } from 'react-router-dom';
import Home from '../Home/Home';
import SignIn from '../SignIn/SignIn';
import Terms from '../Terms/Terms';
import UserDashboard from '../UserDashboard/UserDashboard';
import ClassPage from '../ClassPage/ClassPage';
import './App.css';

function App() {
  return(
    <Routes>
      <Route path='/' element={<Home />}/>
      <Route path='/sign-in' element={<SignIn/>}/>
      <Route path='/terms-of-service' element={<Terms/>}/>
      <Route path='/user-dashboard' element={<UserDashboard/>}/>
      <Route path='/class/:classId' element={<ClassPage/>}/>
    </Routes>
  );
}

export default App;
