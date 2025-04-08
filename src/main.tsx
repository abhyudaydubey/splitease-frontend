import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './app.css';
import App from './App.tsx';

// ✨ Import ToastContainer
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <>
      <App />
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  </StrictMode>
);
