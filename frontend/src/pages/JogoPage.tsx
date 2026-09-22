import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { obterMensagemErro } from '../services/auth';
import { adicionarMembroJogo, listarJogos, listarPartidas, listarSeasons, obterPlacar, registrarVitoria, resolverPartida, type Jogo, type Partida, type Placar, type Season } from '../services/jogos';
import { obterPerfil, type Perfil } from '../services/perfil';
import { obterSala, type DetalhesSala } from '../services/salas';
import '../styles/app-pages.css';

export function JogoPage() {
  const { salaId = '', jogoId = '' } = useParams();
  const [sala, setSala] = useState<DetalhesSala | null>(null);
  const [jogo, setJogo] = useState<Jogo | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [placar, setPlacar] = useState<Placar[]>([]);
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [perdedorId, setPerdedorId] = useState('');
  const [novoMembro, setNovoMembro] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');

  const atualizar = useCallback(async () => {
    const [salaAtual, jogos, perfilAtual, placarAtual, partidasAtuais] = await Promise.all([
      obterSala(salaId), listarJogos(salaId), obterPerfil(), obterPlacar(jogoId), listarPartidas(jogoId),
    ]);
    const jogoAtual = jogos.find((item) => item.id === jogoId);
    if (!jogoAtual) throw new Error('Jogo não encontrado nesta sala.');
    setSala(salaAtual);
    setJogo(jogoAtual);
    setPerfil(perfilAtual);
    setPlacar(placarAtual);
    setPartidas(partidasAtuais);
    if (jogoAtual.ciclo === 'season') setSeasons(await listarSeasons(jogoId));
  }, [salaId, jogoId]);

  useEffect(() => {
    let ativo = true;
    // A limpeza impede atualizações após navegar para outra página.
    Promise.all([obterSala(salaId), listarJogos(salaId), obterPerfil(), obterPlacar(jogoId), listarPartidas(jogoId)])
      .then(async ([salaAtual, jogos, perfilAtual, placarAtual, partidasAtuais]) => {
        const jogoAtual = jogos.find((item) => item.id === jogoId);
        if (!jogoAtual) throw new Error('Jogo não encontrado nesta sala.');
        const seasonsAtuais = jogoAtual.ciclo === 'season' ? await listarSeasons(jogoId) : [];
        if (!ativo) return;
        setSala(salaAtual); setJogo(jogoAtual); setPerfil(perfilAtual);
        setPlacar(placarAtual); setPartidas(partidasAtuais); setSeasons(seasonsAtuais);
      })
      .catch((falha: unknown) => { if (ativo) setErro(obterMensagemErro(falha, 'Não foi possível carregar o jogo.')); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [salaId, jogoId]);

  async function executar(acao: () => Promise<void>, sucesso: string) {
    setOcupado(true); setErro(''); setMensagem('');
    try { await acao(); await atualizar(); setMensagem(sucesso); }
    catch (falha) { setErro(obterMensagemErro(falha, 'Não foi possível concluir a ação.')); }
    finally { setOcupado(false); }
  }

  function enviarVitoria(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    executar(() => registrarVitoria(jogoId, jogo?.modo === 'rei_do_pedaco' ? perdedorId : undefined), 'Vitória registrada. A partida pode ser contestada durante 24 horas.');
  }

  const nome = (id: string) => sala?.membros.find((membro) => membro.id === id)?.apelido ?? 'Participante';
  if (carregando) return <main className="app-page"><p role="status">Carregando jogo...</p></main>;
  if (!sala || !jogo || !perfil) return <main className="app-page"><Link to={`/salas/${salaId}`}>← Sala</Link><p role="alert" className="form-error">{erro || 'Jogo não encontrado.'}</p></main>;

  const jogadores = jogo.membros.map((id) => ({ id, vitorias: placar.find((item) => item.usuarioId === id)?.vitorias ?? 0 })).sort((a, b) => b.vitorias - a.vitorias);
  const pendentes = partidas.filter((partida) => partida.status === 'pendente' || partida.status === 'contestada');
  const outros = jogo.membros.filter((id) => id !== perfil.id);
  const disponiveis = sala.membros.filter((membro) => !jogo.membros.includes(membro.id));

  return <main className="app-page">
    <Link to={`/salas/${salaId}`}>← {sala.nome}</Link>
    <header className="app-page__heading"><p className="eyebrow">{jogo.modo === 'duelo' ? 'Duelo' : jogo.modo === 'competicao' ? 'Competição' : 'Rei do Pedaço'}</p><h1>{jogo.nome}</h1><p className="subtle">{jogo.ciclo === 'season' ? `Temporada · meta de ${jogo.metaVitorias} vitórias` : 'Jogo sem fim'}</p></header>
    {erro && <p className="form-error" role="alert">{erro}</p>}
    {mensagem && <p className="form-message" role="status">{mensagem}</p>}
    <section className="panel"><h2>Ranking</h2><p className="subtle">Vitórias pendentes ou confirmadas {jogo.ciclo === 'season' ? 'nesta temporada' : 'neste jogo'}.</p><ol className="rank-list">{jogadores.map((jogador) => <li key={jogador.id}>{nome(jogador.id)}<strong>{jogador.vitorias}</strong></li>)}</ol></section>
    {!sala.encerrada && !jogo.arquivado && jogo.membros.includes(perfil.id) && <section className="panel"><h2>Registrar vitória</h2><p>Você será marcado como vencedor.</p><form className="app-form" onSubmit={enviarVitoria}>{jogo.modo === 'rei_do_pedaco' && <label>Quem perdeu?<select required value={perdedorId} onChange={(evento) => setPerdedorId(evento.target.value)}><option value="">Selecione</option>{outros.map((id) => <option key={id} value={id}>{nome(id)}</option>)}</select></label>}<button type="submit" className="button button--primary" disabled={ocupado}>{ocupado ? 'Registrando...' : 'Registrar minha vitória'}</button></form></section>}
    {!sala.encerrada && !jogo.arquivado && sala.liderId === perfil.id && disponiveis.length > 0 && <section className="panel"><h2>Adicionar participante</h2><div className="app-form"><label>Membro da sala<select value={novoMembro} onChange={(evento) => setNovoMembro(evento.target.value)}><option value="">Selecione</option>{disponiveis.map((membro) => <option value={membro.id} key={membro.id}>{membro.apelido}</option>)}</select></label><button className="button button--ghost" type="button" disabled={ocupado || !novoMembro} onClick={() => executar(async () => { await adicionarMembroJogo(jogoId, novoMembro); setNovoMembro(''); }, 'Participante adicionado ao jogo.')}>Adicionar</button></div></section>}
    <section className="panel"><h2>Pendentes ({pendentes.length})</h2>{pendentes.length === 0 ? <p>Nenhuma partida pendente.</p> : <ul className="item-list">{pendentes.map((partida) => <li key={partida.id}><p>Vitória de {nome(partida.registradoPor)} · {partida.status === 'contestada' ? 'contestada' : 'aguardando contestação até ' + new Date(partida.expiraEm).toLocaleString('pt-BR')}</p>{partida.status === 'pendente' && partida.registradoPor !== perfil.id && <button className="button button--ghost" type="button" disabled={ocupado} onClick={() => executar(() => resolverPartida(partida.id, 'contestar'), 'Partida contestada.')}>Contestar</button>}{partida.status === 'contestada' && <div className="action-row"><button className="button button--ghost" type="button" disabled={ocupado} onClick={() => executar(() => resolverPartida(partida.id, 'confirmar'), 'Partida confirmada.')}>Confirmar</button><button className="button button--ghost" type="button" disabled={ocupado} onClick={() => executar(() => resolverPartida(partida.id, 'cancelar'), 'Partida cancelada.')}>Cancelar</button></div>}</li>)}</ul>}</section>
    {jogo.ciclo === 'season' && <section className="panel"><h2>Temporadas</h2><ul className="item-list">{seasons.map((season) => <li key={season.id}><p>Temporada {season.numero} · {season.encerradaEm ? `campeão: ${nome(season.campeaoId ?? '')}` : 'em andamento'}</p></li>)}</ul></section>}
    <section className="panel"><h2>Histórico de partidas</h2>{partidas.length === 0 ? <p>Nenhuma partida registrada.</p> : <ul className="item-list">{partidas.map((partida) => <li key={partida.id}><p>{nome(partida.registradoPor)} · {partida.status} · {new Date(partida.criadoEm).toLocaleString('pt-BR')}</p></li>)}</ul>}</section>
  </main>;
}
