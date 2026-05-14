import { BrowserRouter } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

console.log("main.tsx is running");
const container = document.getElementById('root');
if (container) {
  console.log("Root container found");
  const root = createRoot(container);
  root.render(
    <BrowserRouter>
      <App />
    </BrowserRouter>,
  );
} else {
  console.error("Root container NOT found");
}
