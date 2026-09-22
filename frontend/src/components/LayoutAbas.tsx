import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { observarNotificacoesEmPrimeiroPlano } from '../services/firebase';

type Aba = 'salas' | 'perfil' | 'amigos';

const abas: { caminho: string; titulo: string; icone: Aba }[] = [
  { caminho: '/salas', titulo: 'Salas', icone: 'salas' },
  { caminho: '/perfil', titulo: 'Perfil', icone: 'perfil' },
  { caminho: '/amigos', titulo: 'Amigos', icone: 'amigos' },
];

function IconeAba({ aba }: { aba: Aba }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {aba === 'salas' && (
        <>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </>
      )}
      {aba === 'perfil' && (
        <>
          <circle cx="12" cy="8" r="4" />
          <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
        </>
      )}
      {aba === 'amigos' && (
        <>
          <circle cx="9" cy="8" r="3" />
          <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
          <path d="M16.5 5.3a3 3 0 0 1 0 5.4M17 14a6 6 0 0 1 4.5 6" />
        </>
      )}
    </svg>
  );
}

export function LayoutAbas() {
  const [notificacao, setNotificacao] = useState('');

  useEffect(() => {
    let ativo = true;
    let cancelar: (() => void) | null = null;
    observarNotificacoesEmPrimeiroPlano((payload) => {
      setNotificacao(payload.data?.title ?? payload.notification?.title ?? 'Nova notificação no xMatch');
    }).then((unsubscribe) => {
      if (ativo) cancelar = unsubscribe;
      else unsubscribe?.();
    }).catch(() => { /* Notificações são opcionais no navegador. */ });
    return () => { ativo = false; cancelar?.(); };
  }, []);

  return (
    <div className="app-shell">
      {notificacao && <div className="notification-toast" role="status"><span>{notificacao}</span><button type="button" onClick={() => setNotificacao('')} aria-label="Fechar notificação">×</button></div>}
      <div className="app-shell__content">
        <Outlet />
      </div>
      <nav className="bottom-nav" aria-label="Navegação principal">
        <div className="bottom-nav__items">
          {abas.map(({ caminho, titulo, icone }) => (
            <NavLink
              key={caminho}
              to={caminho}
              className={({ isActive }) =>
                `bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}`
              }
            >
              <IconeAba aba={icone} />
              <span>{titulo}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
