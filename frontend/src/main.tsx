import { BrowserRouter } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import UserProvider from './UserProvider';
import './index.css';
import App from './App';

const container = document.getElementById('root');
if (container) {
  console.log("Root container found");
  const root = createRoot(container);
  root.render(
    <BrowserRouter>
      <UserProvider>
        <App />
      </UserProvider>
    </BrowserRouter>,
  );
} else {
  console.error("Root container NOT found");
}
