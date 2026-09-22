import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { obterMensagemErro } from '../services/auth';
import { criarJogo, listarJogos, obterPlacarSala, type Jogo, type Placar } from '../services/jogos';
import { obterPerfil, type Perfil } from '../services/perfil';
import { criarConvite, encerrarSala, expulsarMembro, obterSala, sairSala, transferirLideranca, type DetalhesSala } from '../services/salas';
import '../styles/app-pages.css';

export function SalaPage() {
  const { salaId = '' } = useParams();
  const navigate = useNavigate();
  const [sala, setSala] = useState<DetalhesSala | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [placar, setPlacar] = useState<Placar[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [codigo, setCodigo] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [nome, setNome] = useState('');
  const [membros, setMembros] = useState<string[]>([]);
  const [modo, setModo] = useState<'competicao' | 'rei_do_pedaco'>('competicao');
  const [ciclo, setCiclo] = useState<'sem_fim' | 'season'>('sem_fim');
  const [meta, setMeta] = useState('5');
  const [criando, setCriando] = useState(false);
  const [novoLider, setNovoLider] = useState('');
  const [expulso, setExpulso] = useState('');

  useEffect(() => {
    let ativo = true;
    Promise.all([obterSala(salaId), listarJogos(salaId), obterPerfil(), obterPlacarSala(salaId)])
      .then(([salaAtual, jogosAtuais, perfilAtual, placarAtual]) => {
        if (!ativo) return;
        setSala(salaAtual);
        setJogos(jogosAtuais);
        setPlacar(placarAtual);
        setPerfil(perfilAtual);
        setMembros(salaAtual.membros.map((membro) => membro.id));
      })
      .catch((falha: unknown) => { if (ativo) setErro(obterMensagemErro(falha, 'Não foi possível abrir a sala.')); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [salaId]);

  async function executar(acao: () => Promise<void>) {
    setOcupado(true);
    setErro('');
    try { await acao(); } catch (falha) { setErro(obterMensagemErro(falha, 'Não foi possível concluir a ação.')); }
    finally { setOcupado(false); }
  }

  async function enviarJogo(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (membros.length < 2) { setErro('Escolha pelo menos duas pessoas.'); return; }
    setCriando(true);
    setErro('');
    try {
      await criarJogo(salaId, {
        nome: nome.trim(), membros,
        ...(membros.length > 2 ? { modo } : {}),
        ciclo,
        ...(ciclo === 'season' ? { metaVitorias: Number(meta) } : {}),
      });
      setJogos(await listarJogos(salaId));
      setNome('');
    } catch (falha) { setErro(obterMensagemErro(falha, 'Não foi possível criar o jogo.')); }
    finally { setCriando(false); }
  }

  if (carregando) return <main className="app-page"><p role="status">Carregando sala...</p></main>;
  if (!sala || !perfil) return <main className="app-page"><Link to="/salas">← Suas salas</Link><p role="alert" className="form-error">{erro || 'Sala não encontrada.'}</p></main>;

  const lider = sala.liderId === perfil.id;
  return (
    <main className="app-page">
      <Link to="/salas">← Suas salas</Link>
      <header className="app-page__heading"><div><p className="eyebrow">Sala {sala.encerrada ? 'encerrada' : 'ativa'}</p><h1>{sala.nome}</h1></div></header>
      {erro && <p className="form-error" role="alert">{erro}</p>}
      <section className="panel"><h2>Membros ({sala.membros.length})</h2>
        <ul className="chips">{sala.membros.map((membro) => <li key={membro.id}>{membro.apelido}{membro.id === sala.liderId ? ' · líder' : ''}</li>)}</ul>
        {!sala.encerrada && lider && <div className="action-row"><button type="button" className="button button--ghost" disabled={ocupado} onClick={() => executar(async () => { const convite = await criarConvite(salaId); setCodigo(convite.codigo); })}>Gerar convite</button>{codigo && <p className="form-message">Código: <strong>{codigo}</strong> · válido por 48 horas ou até ser usado</p>}</div>}
        {!sala.encerrada && !lider && <button type="button" className="button button--ghost" disabled={ocupado} onClick={() => executar(async () => { await sairSala(salaId); navigate('/salas'); })}>Sair da sala</button>}
      </section>
      <section className="panel"><h2>Jogos</h2>
        {jogos.length === 0 ? <p>Nenhum jogo criado nesta sala.</p> : <ul className="item-list">{jogos.map((jogo) => <li key={jogo.id}>{jogo.membros.includes(perfil.id) ? <Link to={`/salas/${salaId}/jogos/${jogo.id}`}><strong>{jogo.nome}</strong><span>{jogo.modo === 'duelo' ? 'Duelo' : jogo.modo === 'competicao' ? 'Competição' : 'Rei do Pedaço'} · {jogo.ciclo === 'season' ? 'Temporada' : 'Sem fim'}</span></Link> : <p>{jogo.nome} · você não participa deste jogo</p>}</li>)}</ul>}
      </section>
      <section className="panel"><h2>Pódio da sala</h2><ol className="rank-list">{placar.slice(0, 3).map((linha) => <li key={linha.usuarioId}>{sala.membros.find((membro) => membro.id === linha.usuarioId)?.apelido ?? 'Participante'}<strong>{linha.vitorias} vitórias</strong></li>)}</ol><details><summary>Ver ranking completo</summary><ol className="rank-list">{placar.map((linha) => <li key={linha.usuarioId}>{sala.membros.find((membro) => membro.id === linha.usuarioId)?.apelido ?? 'Participante'}<strong>{linha.vitorias} vitórias</strong></li>)}</ol></details></section>
      {!sala.encerrada && lider && <section className="panel"><h2>Criar jogo</h2>
        {sala.membros.length < 2 ? <p>Convide mais uma pessoa para poder criar um jogo.</p> : <form className="app-form" onSubmit={enviarJogo}>
          <label>Nome do jogo<input value={nome} onChange={(evento) => setNome(evento.target.value)} maxLength={50} required /></label>
          <fieldset><legend>Participantes (mínimo 2)</legend><div className="chips">{sala.membros.map((membro) => <label key={membro.id} className="check"><input type="checkbox" checked={membros.includes(membro.id)} onChange={() => setMembros((anteriores) => anteriores.includes(membro.id) ? anteriores.filter((id) => id !== membro.id) : [...anteriores, membro.id])} />{membro.apelido}</label>)}</div></fieldset>
          {membros.length > 2 && <label>Modo<select value={modo} onChange={(evento) => setModo(evento.target.value as typeof modo)}><option value="competicao">Competição</option><option value="rei_do_pedaco">Rei do Pedaço</option></select></label>}
          <label>Ciclo<select value={ciclo} onChange={(evento) => setCiclo(evento.target.value as typeof ciclo)}><option value="sem_fim">Sem fim</option><option value="season">Temporada</option></select></label>
          {ciclo === 'season' && <label>Meta de vitórias<input type="number" min={1} max={9999} required value={meta} onChange={(evento) => setMeta(evento.target.value)} /></label>}
          <button className="button button--primary" type="submit" disabled={criando || membros.length < 2}>{criando ? 'Criando...' : 'Criar jogo'}</button>
        </form>}
      </section>}
      {!sala.encerrada && lider && <section className="panel"><h2>Configurações</h2>
        {sala.membros.length > 1 && <>
          <div className="app-form"><label>Transferir liderança<select value={novoLider} onChange={(evento) => setNovoLider(evento.target.value)}><option value="">Selecione um membro</option>{sala.membros.filter((membro) => membro.id !== perfil.id).map((membro) => <option key={membro.id} value={membro.id}>{membro.apelido}</option>)}</select></label><button className="button button--ghost" type="button" disabled={!novoLider || ocupado} onClick={() => executar(async () => { await transferirLideranca(salaId, novoLider); setSala(await obterSala(salaId)); })}>Transferir liderança</button></div>
          <div className="app-form management-form"><label>Remover membro<select value={expulso} onChange={(evento) => setExpulso(evento.target.value)}><option value="">Selecione um membro</option>{sala.membros.filter((membro) => membro.id !== perfil.id).map((membro) => <option key={membro.id} value={membro.id}>{membro.apelido}</option>)}</select></label><button className="button button--ghost" type="button" disabled={!expulso || ocupado} onClick={() => { if (window.confirm('Remover este membro da sala?')) executar(async () => { await expulsarMembro(salaId, expulso); setSala(await obterSala(salaId)); setExpulso(''); }); }}>Remover da sala</button></div>
        </>}
        <p>Encerrar a sala mantém o histórico disponível para consulta.</p><button type="button" className="button button--ghost" disabled={ocupado} onClick={() => { if (window.confirm('Encerrar esta sala?')) executar(async () => { await encerrarSala(salaId); setSala({ ...sala, encerrada: true }); }); }}>Encerrar sala</button>
      </section>}
    </main>
  );
}
