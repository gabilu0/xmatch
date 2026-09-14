import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registrarDispositivoParaNotificacoes } from '../services/firebase';

export function PosAutenticacao() {
  const navigate = useNavigate();
  const [ativando, setAtivando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);

  async function ativarNotificacoes() {
    setAtivando(true);
    setMensagem(null);

    try {
      const ativadas = await registrarDispositivoParaNotificacoes();
      setMensagem(
        ativadas
          ? 'Notificações ativadas neste dispositivo.'
          : 'As notificações não foram ativadas neste dispositivo.',
      );
    } catch {
      setMensagem(
        'Não foi possível registrar este dispositivo para notificações.',
      );
    } finally {
      setAtivando(false);
    }
  }

  return (
    <section className="auth-success" aria-labelledby="auth-success-title">
      <span className="auth-success__icon" aria-hidden="true">
        ✓
      </span>
      <h2 id="auth-success-title">Acesso confirmado</h2>
      <p>
        Ative as notificações para acompanhar convites, partidas e alterações
        nas suas salas.
      </p>

      {mensagem && (
        <p className="form-message" role="status">
          {mensagem}
        </p>
      )}

      <button
        className="button button--primary"
        type="button"
        onClick={ativarNotificacoes}
        disabled={ativando}
      >
        {ativando ? 'Ativando…' : 'Ativar notificações'}
      </button>
      <button
        className="button button--ghost"
        type="button"
        onClick={() => navigate('/salas', { replace: true })}
      >
        Continuar para Salas
      </button>
    </section>
  );
}
