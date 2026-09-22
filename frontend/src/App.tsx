import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { AuthPage } from './pages/AuthPage';
import { LayoutAbas } from './components/LayoutAbas';
import { PaginaEmConstrucao } from './pages/PaginaEmConstrucao';
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
          element={
            <RotaProtegida>
              <LayoutAbas />
            </RotaProtegida>
          }
        >
          <Route path="/salas" element={<SalasPage />} />
          <Route
            path="/perfil"
            element={
              <PaginaEmConstrucao
                titulo="Perfil"
                descricao="Seu perfil ficará disponível aqui."
              />
            }
          />
          <Route
            path="/amigos"
            element={
              <PaginaEmConstrucao
                titulo="Amigos"
                descricao="Seus amigos ficarão disponíveis aqui."
              />
            }
          />
        </Route>
        <Route path="*" element={<Inicio />} />
      </Routes>
    </BrowserRouter>
  );
}
