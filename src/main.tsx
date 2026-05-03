console.log('main.tsx loading...');
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import './index.css';

console.log('Attempting to render App...');
const container = document.getElementById('root');
if (!container) {
  console.error('Failed to find root element');
} else {
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  console.log('Render called successfully');
}
