import { useEffect, useState, type FormEvent } from 'react';
import { buscarAmigo, listarAmigos, listarSolicitacoes, responderSolicitacao, solicitarAmizade, type Amigo, type Solicitacao } from '../services/amigos';
import { obterMensagemErro } from '../services/auth';
import { obterPerfil, type Perfil } from '../services/perfil';
import '../styles/app-pages.css';

export function AmigosPage() {
  const [amigos, setAmigos] = useState<Amigo[]>([]);
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [busca, setBusca] = useState('');
  const [resultado, setResultado] = useState<Amigo | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');

  useEffect(() => {
    let ativo = true;
    Promise.all([listarAmigos(), listarSolicitacoes(), obterPerfil()])
      .then(([lista, pendentes, usuario]) => { if (ativo) { setAmigos(lista); setSolicitacoes(pendentes); setPerfil(usuario); } })
      .catch((falha: unknown) => { if (ativo) setErro(obterMensagemErro(falha, 'Não foi possível carregar seus amigos.')); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, []);

  async function procurar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault(); setOcupado(true); setErro(''); setResultado(null); setMensagem('');
    try { setResultado(await buscarAmigo(busca.trim())); }
    catch (falha) { setErro(obterMensagemErro(falha, 'Usuário não encontrado.')); }
    finally { setOcupado(false); }
  }

  async function executar(acao: () => Promise<void>, sucesso: string) {
    setOcupado(true); setErro(''); setMensagem('');
    try {
      await acao();
      const [lista, pendentes] = await Promise.all([listarAmigos(), listarSolicitacoes()]);
      setAmigos(lista); setSolicitacoes(pendentes); setResultado(null); setMensagem(sucesso);
    } catch (falha) { setErro(obterMensagemErro(falha, 'Não foi possível concluir a ação.')); }
    finally { setOcupado(false); }
  }

  return <main className="app-page"><header className="app-page__heading"><p className="eyebrow">xMatch</p><h1>Amigos</h1></header>
    {carregando && <p role="status">Carregando amigos...</p>}
    {erro && <p className="form-error" role="alert">{erro}</p>}
    {mensagem && <p className="form-message" role="status">{mensagem}</p>}
    <section className="panel"><h2>Encontrar pessoa</h2><form className="app-form" onSubmit={procurar}><label>Apelido exato<input value={busca} onChange={(evento) => setBusca(evento.target.value)} required maxLength={30} minLength={3} /></label><button type="submit" className="button button--primary" disabled={ocupado}>Buscar</button></form>
      {resultado && <div><p><strong>{resultado.apelido}</strong> · {resultado.salasEmComum} salas em comum</p>{resultado.id !== perfil?.id && !amigos.some((amigo) => amigo.id === resultado.id) && <button type="button" className="button button--ghost" disabled={ocupado} onClick={() => executar(() => solicitarAmizade(resultado.apelido), 'Solicitação enviada.')}>Enviar solicitação</button>}</div>}
    </section>
    <section className="panel"><h2>Solicitações recebidas ({solicitacoes.length})</h2>{solicitacoes.length === 0 ? <p>Nenhuma solicitação pendente.</p> : <ul className="item-list">{solicitacoes.map((solicitacao) => <li key={solicitacao.id}><p>{solicitacao.solicitante.apelido}</p><button className="button button--primary" type="button" disabled={ocupado} onClick={() => executar(() => responderSolicitacao(solicitacao.id, 'aceitar'), 'Solicitação aceita.')}>Aceitar</button><button className="button button--ghost" type="button" disabled={ocupado} onClick={() => executar(() => responderSolicitacao(solicitacao.id, 'recusar'), 'Solicitação recusada.')}>Recusar</button></li>)}</ul>}</section>
    <section className="panel"><h2>Seus amigos ({amigos.length})</h2>{amigos.length === 0 ? <p>Nenhum amigo por enquanto.</p> : <ul className="item-list">{amigos.map((amigo) => <li key={amigo.id}><p><strong>{amigo.apelido}</strong> · {amigo.salasEmComum} {amigo.salasEmComum === 1 ? 'sala' : 'salas'} em comum</p></li>)}</ul>}</section>
  </main>;
}
