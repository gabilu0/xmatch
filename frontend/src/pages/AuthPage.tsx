import { type FormEvent, useState } from 'react';
import { PosAutenticacao } from '../components/PosAutenticacao';
import { setToken } from '../services/api';
import {
  cadastrar,
  entrar,
  iniciarLoginGoogle,
  obterMensagemErro,
} from '../services/auth';
import '../styles/auth.css';

type Modo = 'login' | 'cadastro';

export function AuthPage() {
  const [modo, setModo] = useState<Modo>('login');
  const [apelido, setApelido] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [autenticado, setAutenticado] = useState(false);

  function trocarModo(novoModo: Modo) {
    setModo(novoModo);
    setErro(null);
    setSenha('');
  }

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);

    const apelidoNormalizado = apelido.trim();
    if (apelidoNormalizado.length < 3 || apelidoNormalizado.length > 30) {
      setErro('O apelido deve ter entre 3 e 30 caracteres.');
      return;
    }

    if (senha.length < 6 || senha.length > 72) {
      setErro('A senha deve ter entre 6 e 72 caracteres.');
      return;
    }

    setEnviando(true);

    try {
      const resposta =
        modo === 'login'
          ? await entrar({ apelido: apelidoNormalizado, senha })
          : await cadastrar({
              apelido: apelidoNormalizado,
              email: email.trim(),
              senha,
            });

      setToken(resposta.accessToken);
      setAutenticado(true);
    } catch (error) {
      setErro(
        obterMensagemErro(
          error,
          modo === 'login'
            ? 'Não foi possível entrar. Confira seus dados e tente novamente.'
            : 'Não foi possível criar a conta. Tente novamente.',
        ),
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-brand" aria-label="xMatch">
        <span className="auth-brand__mark" aria-hidden="true">
          X
        </span>
        <div>
          <strong>xMatch</strong>
          <p>Seu placar entre amigos em um só lugar.</p>
        </div>
      </section>

      <div className="auth-card">
        {autenticado ? (
          <PosAutenticacao />
        ) : (
          <>
            <header className="auth-card__header">
              <p className="eyebrow">Bem-vindo ao xMatch</p>
              <h1>{modo === 'login' ? 'Entre na sua conta' : 'Crie sua conta'}</h1>
              <p>
                {modo === 'login'
                  ? 'Acesse suas salas e acompanhe o placar.'
                  : 'Comece a registrar suas partidas com os amigos.'}
              </p>
            </header>

            <div className="auth-tabs" role="tablist" aria-label="Autenticação">
              <button
                className={modo === 'login' ? 'auth-tab auth-tab--active' : 'auth-tab'}
                type="button"
                role="tab"
                aria-selected={modo === 'login'}
                onClick={() => trocarModo('login')}
              >
                Entrar
              </button>
              <button
                className={
                  modo === 'cadastro' ? 'auth-tab auth-tab--active' : 'auth-tab'
                }
                type="button"
                role="tab"
                aria-selected={modo === 'cadastro'}
                onClick={() => trocarModo('cadastro')}
              >
                Criar conta
              </button>
            </div>

            <button
              className="button button--google"
              type="button"
              onClick={iniciarLoginGoogle}
            >
              <span className="google-mark" aria-hidden="true">G</span>
              Entrar com Google
            </button>

            <div className="auth-divider" aria-hidden="true">
              <span>ou</span>
            </div>

            <form className="auth-form" onSubmit={enviar} noValidate>
              <label>
                Apelido
                <input
                  name="apelido"
                  type="text"
                  autoComplete="username"
                  minLength={3}
                  maxLength={30}
                  value={apelido}
                  onChange={(event) => setApelido(event.target.value)}
                  placeholder="Como seus amigos te conhecem"
                  required
                />
              </label>

              {modo === 'cadastro' && (
                <label>
                  E-mail
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="voce@exemplo.com"
                    required
                  />
                </label>
              )}

              <label>
                Senha
                <input
                  name="senha"
                  type="password"
                  autoComplete={modo === 'login' ? 'current-password' : 'new-password'}
                  minLength={6}
                  maxLength={72}
                  value={senha}
                  onChange={(event) => setSenha(event.target.value)}
                  placeholder="Mínimo de 6 caracteres"
                  required
                />
              </label>

              {erro && (
                <p className="form-error" role="alert">
                  {erro}
                </p>
              )}

              <button
                className="button button--primary"
                type="submit"
                disabled={enviando}
              >
                {enviando
                  ? 'Aguarde…'
                  : modo === 'login'
                    ? 'Entrar'
                    : 'Criar minha conta'}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
