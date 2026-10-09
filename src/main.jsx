import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { Analytics } from '@vercel/analytics/react';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Analytics />
        <Toaster
          position="top-center"
          containerStyle={{ top: 52 }}
          toastOptions={{
            style: {
              background: '#ffffff',
              color: '#111719',
              border: '1px solid rgba(28,38,31,.1)',
              borderRadius: '16px',
              fontSize: '13px',
              fontFamily: 'Inter, system-ui, sans-serif',
              boxShadow: '0 18px 45px rgba(43,72,46,.12)',
              padding: '12px 16px',
            },
            success: {
              iconTheme: { primary: '#315f3b', secondary: '#dbeed4' },
              style: { borderColor: 'rgba(49,95,59,.2)' },
            },
            error: {
              iconTheme: { primary: '#c84d4d', secondary: '#ffe1e1' },
              style: { borderColor: 'rgba(200,77,77,.2)' },
            },
            duration: 3000,
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
