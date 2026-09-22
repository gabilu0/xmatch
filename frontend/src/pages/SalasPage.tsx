import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { limparToken } from '../services/api';
import { obterMensagemErro } from '../services/auth';
import { criarSala, entrarSala, listarSalas, type Sala } from '../services/salas';
import '../styles/salas.css';

export function SalasPage() {
  const navigate = useNavigate();
  const [salas, setSalas] = useState<Sala[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroLista, setErroLista] = useState('');
  const [nome, setNome] = useState('');
  const [criando, setCriando] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [erroFormulario, setErroFormulario] = useState('');
  const [codigo, setCodigo] = useState('');
  const [entrando, setEntrando] = useState(false);
  const [erroConvite, setErroConvite] = useState('');

  useEffect(() => {
    let ativo = true;
    listarSalas()
      .then((resultado) => {
        if (ativo) setSalas(resultado);
      })
      .catch((erro: unknown) => {
        if (ativo) setErroLista(obterMensagemErro(erro, 'Não foi possível carregar suas salas.'));
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => { ativo = false; };
  }, []);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const nomeLimpo = nome.trim();
    if (!nomeLimpo || nomeLimpo.length > 50) {
      setErroFormulario('O nome da sala deve ter entre 1 e 50 caracteres.');
      return;
    }
    setCriando(true);
    setErroFormulario('');
    try {
      const sala = await criarSala(nomeLimpo);
      setSalas((anteriores) => [sala, ...anteriores]);
      setNome('');
      setMostrarFormulario(false);
      setErroLista('');
    } catch (erro) {
      setErroFormulario(obterMensagemErro(erro, 'Não foi possível criar a sala.'));
    } finally {
      setCriando(false);
    }
  }

  async function enviarConvite(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setEntrando(true);
    setErroConvite('');
    try {
      const sala = await entrarSala(codigo.trim().toUpperCase());
      navigate(`/salas/${sala.id}`);
    } catch (erro) {
      setErroConvite(obterMensagemErro(erro, 'Não foi possível entrar na sala.'));
    } finally {
      setEntrando(false);
    }
  }

  function sair() {
    limparToken();
    navigate('/login', { replace: true });
  }

  return (
    <main className="salas-page">
      <header className="salas-page__header">
        <div><p className="eyebrow">xMatch</p><h1>Suas salas</h1></div>
        <button className="button button--ghost" type="button" onClick={sair}>Sair</button>
      </header>
      <div className="salas-page__actions">
        <p>Jogue com seus amigos em salas privadas.</p>
        <button className="button button--primary" type="button" onClick={() => setMostrarFormulario((anterior) => !anterior)} aria-expanded={mostrarFormulario}>
          {mostrarFormulario ? 'Fechar' : 'Criar sala'}
        </button>
      </div>
      {mostrarFormulario && (
        <form className="form-sala" onSubmit={enviar}>
          <label htmlFor="nome-sala">Nome da sala</label>
          <input id="nome-sala" value={nome} onChange={(evento) => setNome(evento.target.value)} maxLength={50} required autoFocus placeholder="Ex.: Campeonato da turma" />
          {erroFormulario && <p role="alert" className="form-error">{erroFormulario}</p>}
          <button className="button button--primary" type="submit" disabled={criando}>{criando ? 'Criando...' : 'Criar'}</button>
        </form>
      )}
      <form className="form-sala" onSubmit={enviarConvite}>
        <label htmlFor="codigo-convite">Recebeu um convite? Digite o código</label>
        <input id="codigo-convite" value={codigo} onChange={(evento) => setCodigo(evento.target.value.toUpperCase())} maxLength={8} minLength={6} required placeholder="Código de 6 caracteres" autoCapitalize="characters" />
        {erroConvite && <p className="form-error" role="alert">{erroConvite}</p>}
        <button className="button button--ghost" type="submit" disabled={entrando}>{entrando ? 'Entrando...' : 'Entrar na sala'}</button>
      </form>
      {carregando && <p role="status">Carregando salas...</p>}
      {erroLista && <p role="alert" className="form-error">{erroLista}</p>}
      {!carregando && !erroLista && salas.length === 0 && (
        <div className="salas-page__empty"><h2>Nenhuma sala por enquanto</h2><p>Crie uma sala para começar a jogar.</p></div>
      )}
      {salas.length > 0 && (
        <ul className="salas-page__grid" aria-label="Suas salas">
          {salas.map((sala) => (
            <li className="sala-card" key={sala.id}>
              <div className="sala-card__avatar" aria-hidden="true">{sala.fotoUrl ? <img src={sala.fotoUrl} alt="" /> : sala.nome.slice(0, 2).toUpperCase()}</div>
              <div className="sala-card__text"><h2><Link to={`/salas/${sala.id}`}>{sala.nome}</Link></h2><p>{sala.encerrada ? 'Encerrada' : 'Ativa'}</p></div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
