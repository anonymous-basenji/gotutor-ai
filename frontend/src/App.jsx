import { Routes, Route } from 'react-router-dom';
import Home from './Home.jsx';
import SignIn from './SignIn.jsx';
import Terms from './Terms.jsx';
import './App.css';

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
