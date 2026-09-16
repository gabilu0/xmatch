import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { PosAutenticacao } from '../components/PosAutenticacao';
import { setToken } from '../services/api';
import '../styles/auth.css';

export function AuthCallbackPage() {
  const location = useLocation();
  const [erro, setErro] = useState<string | null>(null);
  const [autenticado, setAutenticado] = useState(false);

  useEffect(() => {
    const parametros = new URLSearchParams(location.hash.slice(1));
    const token = parametros.get('token');

    window.history.replaceState(null, '', location.pathname);

    if (!token) {
      setErro('O Google não retornou um token de acesso válido.');
      return;
    }

    setToken(token);
    setAutenticado(true);
  }, [location.hash, location.pathname]);

  return (
    <main className="auth-page">
      <div className="auth-card auth-card--compact">
        {autenticado ? (
          <PosAutenticacao />
        ) : erro ? (
          <section className="auth-callback-message">
            <h1>Não foi possível entrar</h1>
            <p className="form-error" role="alert">
              {erro}
            </p>
            <a className="button button--primary" href="/login">
              Voltar ao login
            </a>
          </section>
        ) : (
          <section className="auth-callback-message" aria-live="polite">
            <span className="spinner" aria-hidden="true" />
            <h1>Concluindo seu acesso…</h1>
          </section>
        )}
      </div>
    </main>
  );
}
