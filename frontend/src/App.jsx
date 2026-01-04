import { Routes, Route } from 'react-router-dom';
import Home from './Home.jsx';
import SignIn from './SignIn.jsx';
import './App.css';

function App() {
  return(
    <Routes>
      <Route path='/' element={<Home />}/>
      <Route path='/sign-in' element={<SignIn/>}/>
    </Routes>
  );
}

export default App;
