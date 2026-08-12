import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppContent } from './App';
import { ConnectionProvider } from './context/ConnectionContext';
import './index.css';
import './styles/explorer.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConnectionProvider>
      <AppContent />
    </ConnectionProvider>
  </React.StrictMode>
);
