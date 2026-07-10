import React from 'react';
import { createRoot } from 'react-dom/client';
import { DomainAdmin } from './components/domain-admin';
import { LoginPage } from './pages/LoginPage';
import './styles/app.css';

function Router() {
  if (window.location.pathname === '/admin/login') return <LoginPage />;
  return <DomainAdmin />;
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router />
  </React.StrictMode>,
);
