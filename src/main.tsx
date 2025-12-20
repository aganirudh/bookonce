import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerServiceWorker } from './utils/registerServiceWorker';
import { ThemeProvider } from './contexts/ThemeContext';

createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);

// Register service worker for offline support
if (import.meta.env.PROD) {
  registerServiceWorker().catch(error => {
    console.error('Failed to register service worker:', error);
  });
}
