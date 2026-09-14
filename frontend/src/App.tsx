import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { AuthPage } from './pages/AuthPage';
import { SalasPage } from './pages/SalasPage';
import { getToken } from './services/api';

function Inicio() {
  return <Navigate to={getToken() ? '/salas' : '/login'} replace />;
}

function RotaProtegida({ children }: { children: ReactNode }) {
  return getToken() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route
          path="/salas"
          element={
            <RotaProtegida>
              <SalasPage />
            </RotaProtegida>
          }
        />
        <Route path="*" element={<Inicio />} />
      </Routes>
    </BrowserRouter>
  );
}
