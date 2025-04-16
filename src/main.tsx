import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './app.css';
import App from './App.tsx';

// Import Toaster from react-hot-toast
import { Toaster } from 'react-hot-toast';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <>
      <App />
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
    </>
  </StrictMode>
);
