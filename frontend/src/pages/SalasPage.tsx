import { useNavigate } from 'react-router-dom';
import { limparToken } from '../services/api';

export function SalasPage() {
  const navigate = useNavigate();

  function sair() {
    limparToken();
    navigate('/login', { replace: true });
  }

  return (
    <main className="placeholder-page">
      <div>
        <p className="eyebrow">xMatch</p>
        <h1>Suas salas</h1>
        <p>A listagem de salas será implementada no próximo passo da Sprint 5.</p>
        <button className="button button--ghost" type="button" onClick={sair}>
          Sair
        </button>
      </div>
    </main>
  );
}
