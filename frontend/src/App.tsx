import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { AuthPage } from './pages/AuthPage';
import { LayoutAbas } from './components/LayoutAbas';
import { AmigosPage } from './pages/AmigosPage';
import { PerfilPage } from './pages/PerfilPage';
import { SalasPage } from './pages/SalasPage';
import { SalaPage } from './pages/SalaPage';
import { JogoPage } from './pages/JogoPage';
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
          element={
            <RotaProtegida>
              <LayoutAbas />
            </RotaProtegida>
          }
        >
          <Route path="/salas" element={<SalasPage />} />
          <Route path="/salas/:salaId" element={<SalaPage />} />
          <Route path="/salas/:salaId/jogos/:jogoId" element={<JogoPage />} />
          <Route path="/perfil" element={<PerfilPage />} />
          <Route path="/amigos" element={<AmigosPage />} />
        </Route>
        <Route path="*" element={<Inicio />} />
      </Routes>
    </BrowserRouter>
  );
}
