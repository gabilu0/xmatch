import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { obterMensagemErro } from '../services/auth';
import {
  listarJogos,
  listarPartidas,
  listarSeasons,
  obterPlacar,
  registrarVitoria,
  resolverPartida,
  type Jogo,
  type Partida,
  type Placar,
  type Season,
} from '../services/jogos';
import { obterPerfil, type Perfil } from '../services/perfil';
import { obterSala, type DetalhesSala } from '../services/salas';
import '../styles/app-pages.css';
import '../styles/jogo.css';

type ModalJogo = 'pendencias' | 'historico' | 'perdedor' | null;
type EstadoConfirmacao = 'carregando' | 'sucesso' | null;

function IconeSino() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </svg>
  );
}

function IconeHistorico() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function IconeCoroa() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m3 7 4.5 4L12 4l4.5 7L21 7l-2 11H5L3 7Z" />
      <path d="M5 18h14" />
    </svg>
  );
}

function textoVitorias(vitorias: number) {
  return `${vitorias} ${vitorias === 1 ? 'vitória' : 'vitórias'}`;
}

export function JogoPage() {
  const { salaId = '', jogoId = '' } = useParams();
  const [sala, setSala] = useState<DetalhesSala | null>(null);
  const [jogo, setJogo] = useState<Jogo | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [placar, setPlacar] = useState<Placar[]>([]);
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [perdedorId, setPerdedorId] = useState('');
  const [modalAtivo, setModalAtivo] = useState<ModalJogo>(null);
  const [estadoConfirmacao, setEstadoConfirmacao] = useState<EstadoConfirmacao>(null);
  const [tituloConfirmacao, setTituloConfirmacao] = useState('');
  const [limiteHistorico, setLimiteHistorico] = useState(5);
  const [carregando, setCarregando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');

  const atualizar = useCallback(async () => {
    const [salaAtual, jogos, perfilAtual, placarAtual, partidasAtuais] = await Promise.all([
      obterSala(salaId),
      listarJogos(salaId),
      obterPerfil(),
      obterPlacar(jogoId),
      listarPartidas(jogoId),
    ]);
    const jogoAtual = jogos.find((item) => item.id === jogoId);
    if (!jogoAtual) throw new Error('Jogo não encontrado nesta sala.');
    setSala(salaAtual);
    setJogo(jogoAtual);
    setPerfil(perfilAtual);
    setPlacar(placarAtual);
    setPartidas(partidasAtuais);
    setSeasons(jogoAtual.ciclo === 'season' ? await listarSeasons(jogoId) : []);
  }, [salaId, jogoId]);

  useEffect(() => {
    let ativo = true;
    Promise.all([
      obterSala(salaId),
      listarJogos(salaId),
      obterPerfil(),
      obterPlacar(jogoId),
      listarPartidas(jogoId),
    ])
      .then(async ([salaAtual, jogos, perfilAtual, placarAtual, partidasAtuais]) => {
        const jogoAtual = jogos.find((item) => item.id === jogoId);
        if (!jogoAtual) throw new Error('Jogo não encontrado nesta sala.');
        const seasonsAtuais = jogoAtual.ciclo === 'season' ? await listarSeasons(jogoId) : [];
        if (!ativo) return;
        setSala(salaAtual);
        setJogo(jogoAtual);
        setPerfil(perfilAtual);
        setPlacar(placarAtual);
        setPartidas(partidasAtuais);
        setSeasons(seasonsAtuais);
      })
      .catch((falha: unknown) => {
        if (ativo) setErro(obterMensagemErro(falha, 'Não foi possível carregar o jogo.'));
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => { ativo = false; };
  }, [salaId, jogoId]);

  useEffect(() => {
    if (!modalAtivo && !estadoConfirmacao) return;

    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function fecharComEscape(evento: KeyboardEvent) {
      if (evento.key === 'Escape' && estadoConfirmacao !== 'carregando') {
        setModalAtivo(null);
        setEstadoConfirmacao(null);
      }
    }
    window.addEventListener('keydown', fecharComEscape);
    return () => {
      document.body.style.overflow = overflowAnterior;
      window.removeEventListener('keydown', fecharComEscape);
    };
  }, [modalAtivo, estadoConfirmacao]);

  async function executar(
    acao: () => Promise<void>,
    sucesso: string,
    confirmacao?: { carregando: string; titulo: string },
  ) {
    setOcupado(true);
    setErro('');
    setMensagem('');
    if (confirmacao) {
      setModalAtivo(null);
      setTituloConfirmacao(confirmacao.carregando);
      setEstadoConfirmacao('carregando');
    }
    try {
      await acao();
      await atualizar();
      if (confirmacao) {
        setTituloConfirmacao(confirmacao.titulo);
        setEstadoConfirmacao('sucesso');
      } else {
        setMensagem(sucesso);
      }
    } catch (falha) {
      setEstadoConfirmacao(null);
      setErro(obterMensagemErro(falha, 'Não foi possível concluir a ação.'));
    } finally {
      setOcupado(false);
    }
  }

  function abrirModal(modal: Exclude<ModalJogo, null>) {
    setErro('');
    setMensagem('');
    if (modal === 'historico') setLimiteHistorico(5);
    setModalAtivo(modal);
  }

  function abrirRegistroVitoria() {
    if (jogo?.modo === 'rei_do_pedaco') {
      setPerdedorId('');
      abrirModal('perdedor');
      return;
    }
    executar(
      () => registrarVitoria(jogoId),
      'Vitória registrada. Os outros jogadores têm 1 hora para contestar.',
      { carregando: 'Registrando vitória...', titulo: 'Vitória registrada' },
    );
  }

  function enviarVitoriaRei(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    executar(async () => {
      await registrarVitoria(jogoId, perdedorId);
      setPerdedorId('');
    }, 'Vitória registrada. Os outros jogadores têm 1 hora para contestar.', {
      carregando: 'Registrando vitória...',
      titulo: 'Vitória registrada',
    });
  }

  const nome = (id: string) => (
    sala?.membros.find((membro) => membro.id === id)?.apelido ?? 'Participante'
  );

  if (carregando) {
    return <main className="app-page"><p role="status">Carregando jogo...</p></main>;
  }

  if (!sala || !jogo || !perfil) {
    return (
      <main className="app-page">
        <Link to={`/salas/${salaId}`}>← Sala</Link>
        <p role="alert" className="form-error">{erro || 'Jogo não encontrado.'}</p>
      </main>
    );
  }

  const jogadores = jogo.membros
    .map((id) => ({
      id,
      vitorias: placar.find((item) => item.usuarioId === id)?.vitorias ?? 0,
    }))
    .sort((a, b) => b.vitorias - a.vitorias || nome(a.id).localeCompare(nome(b.id), 'pt-BR'));
  const pendentes = partidas.filter(
    (partida) => partida.status === 'pendente' || partida.status === 'contestada',
  );
  const historico = [...partidas].sort(
    (a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime(),
  );
  const outros = jogo.membros.filter((id) => id !== perfil.id);
  const seasonAtiva = seasons.find((season) => !season.encerradaEm);
  const ultimoCampeao = [...seasons]
    .filter((season) => season.encerradaEm && season.campeaoId)
    .sort((a, b) => b.numero - a.numero)[0];
  const vitoriasPotenciais = new Map(
    jogadores.map((jogador) => [jogador.id, jogador.vitorias]),
  );
  if (seasonAtiva) {
    partidas
      .filter((partida) => partida.seasonId === seasonAtiva.id && partida.status === 'contestada')
      .flatMap((partida) => partida.resultados ?? [])
      .filter((resultado) => resultado.vencedor)
      .forEach((resultado) => {
        vitoriasPotenciais.set(
          resultado.usuarioId,
          (vitoriasPotenciais.get(resultado.usuarioId) ?? 0) + 1,
        );
      });
  }
  const metaVitorias = jogo.metaVitorias;
  const temporadaBloqueada = jogo.ciclo === 'season'
    && metaVitorias !== null
    && [...vitoriasPotenciais.values()].some((total) => total >= metaVitorias);
  const podeRegistrar = !sala.encerrada
    && !jogo.arquivado
    && jogo.membros.includes(perfil.id);

  return (
    <main className="app-page game-page">
      <div className="game-page__topbar">
        <Link to={`/salas/${salaId}`} className="game-page__back">← {sala.nome}</Link>
        <div className="game-page__shortcuts">
          <button
            className="game-page__shortcut"
            type="button"
            onClick={() => abrirModal('pendencias')}
            aria-label={`Abrir pendências: ${pendentes.length}`}
            title="Pendências"
          >
            <IconeSino />
            {pendentes.length > 0 && (
              <span className="game-page__badge" aria-hidden="true">{pendentes.length}</span>
            )}
          </button>
          <button
            className="game-page__shortcut"
            type="button"
            onClick={() => abrirModal('historico')}
            aria-label="Abrir histórico"
            title="Histórico"
          >
            <IconeHistorico />
          </button>
        </div>
      </div>

      <header className="game-page__heading">
        <p className="eyebrow">
          {jogo.modo === 'duelo'
            ? 'Duelo'
            : jogo.modo === 'competicao'
              ? 'Competição'
              : 'Rei do Pedaço'}
        </p>
        <h1>{jogo.nome}</h1>
        <p className="subtle">
          {jogo.ciclo === 'season'
            ? `Temporada · meta de ${jogo.metaVitorias} vitórias`
            : 'Jogo sem fim'}
        </p>
      </header>

      {!modalAtivo && (erro || mensagem) && (
        <div className="game-page__feedback">
          {erro && <p className="form-error" role="alert">{erro}</p>}
          {mensagem && <p className="form-message" role="status">{mensagem}</p>}
        </div>
      )}

      <section className="panel game-ranking" aria-labelledby="game-ranking-title">
        <h2 id="game-ranking-title">Ranking</h2>
        <ol className="game-ranking__list">
          {jogadores.slice(0, 3).map((jogador, indice) => (
            <li className={`game-ranking__entry game-ranking__entry--${indice + 1}`} key={jogador.id}>
              <span className="game-ranking__position" aria-hidden="true">{indice + 1}º</span>
              <span className="game-ranking__name">
                {nome(jogador.id)}
                {indice === 0 && (
                  <span className="game-ranking__crown" aria-label="Primeiro colocado">
                    <IconeCoroa />
                  </span>
                )}
              </span>
              <strong>{textoVitorias(jogador.vitorias)}</strong>
            </li>
          ))}
        </ol>
      </section>

      <section className="game-page__victory" aria-label="Registrar vitória">
        {podeRegistrar ? (
          <>
            <button
              className="game-page__victory-button"
              type="button"
              disabled={ocupado || temporadaBloqueada}
              onClick={abrirRegistroVitoria}
            >
              <strong>{ocupado ? '...' : '+1'}</strong>
              <span>Registrar vitória</span>
            </button>
            {temporadaBloqueada && (
              <p role="status">Aguardando a resolução da vitória decisiva.</p>
            )}
          </>
        ) : (
          <p>Este jogo não aceita novas vitórias.</p>
        )}
      </section>

      {jogo.ciclo === 'season' && (
        <footer className="game-page__champion">
          <span>Último campeão</span>
          <strong>
            {ultimoCampeao?.campeaoId
              ? `${nome(ultimoCampeao.campeaoId)} · Temporada ${ultimoCampeao.numero}`
              : 'Ainda não definido'}
          </strong>
        </footer>
      )}

      {modalAtivo && (
        <div
          className="game-modal-backdrop"
          onClick={(evento) => {
            if (evento.target === evento.currentTarget) setModalAtivo(null);
          }}
        >
          <section
            className="game-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="game-modal-title"
          >
            <header className="game-modal__header">
              <h2 id="game-modal-title">
                {modalAtivo === 'pendencias' && `Pendências (${pendentes.length})`}
                {modalAtivo === 'historico' && 'Histórico de partidas'}
                {modalAtivo === 'perdedor' && 'Quem perdeu?'}
              </h2>
              <button
                className="game-modal__close"
                type="button"
                onClick={() => setModalAtivo(null)}
                aria-label="Fechar"
              >
                ×
              </button>
            </header>

            {(erro || mensagem) && (
              <div className="game-modal__feedback">
                {erro && <p className="form-error" role="alert">{erro}</p>}
                {mensagem && <p className="form-message" role="status">{mensagem}</p>}
              </div>
            )}

            {modalAtivo === 'pendencias' && (
              pendentes.length === 0 ? (
                <p>Nenhuma partida pendente.</p>
              ) : (
                <ul className="item-list game-modal__list">
                  {pendentes.map((partida) => {
                    const prazo = new Date(partida.expiraEm).toLocaleString('pt-BR');
                    const usuarioVencedor = partida.registradoPor === perfil.id
                      || partida.resultados?.some(
                        (resultado) => resultado.usuarioId === perfil.id && resultado.vencedor,
                      );

                    return (
                      <li key={partida.id}>
                        {partida.status === 'pendente' ? (
                          <p>
                            <strong>Vitória de {nome(partida.registradoPor)}.</strong>{' '}
                            Pode ser contestada até {prazo}.
                          </p>
                        ) : (
                          <p>
                            <strong>Vitória de {nome(partida.registradoPor)} contestada.</strong>{' '}
                            Deve ser resolvida até {prazo}.
                          </p>
                        )}

                        {partida.status === 'pendente' && !usuarioVencedor && (
                          <button
                            className="button button--ghost"
                            type="button"
                            disabled={ocupado}
                            onClick={() => executar(
                              () => resolverPartida(partida.id, 'contestar'),
                              'Vitória contestada.',
                            )}
                          >
                            Contestar vitória
                          </button>
                        )}

                        {partida.status === 'contestada' && !usuarioVencedor && (
                          <div className="action-row">
                            <button
                              className="button button--ghost"
                              type="button"
                              disabled={ocupado}
                              onClick={() => executar(
                                () => resolverPartida(partida.id, 'confirmar'),
                                'Vitória confirmada.',
                                { carregando: 'Confirmando vitória...', titulo: 'Vitória confirmada' },
                              )}
                            >
                              Confirmar vitória
                            </button>
                            <button
                              className="button button--ghost"
                              type="button"
                              disabled={ocupado}
                              onClick={() => executar(
                                () => resolverPartida(partida.id, 'cancelar'),
                                'Vitória cancelada.',
                              )}
                            >
                              Cancelar vitória
                            </button>
                          </div>
                        )}

                        {partida.status === 'contestada' && usuarioVencedor && (
                          <p className="subtle">Aguardando a decisão dos outros jogadores.</p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )
            )}

            {modalAtivo === 'historico' && (
              historico.length === 0 ? (
                <p>Nenhuma partida registrada.</p>
              ) : (
                <>
                  <ul className="item-list game-modal__list">
                    {historico.slice(0, limiteHistorico).map((partida) => (
                      <li key={partida.id}>
                        <p>
                          {nome(partida.registradoPor)} · {partida.status} ·{' '}
                          {new Date(partida.criadoEm).toLocaleString('pt-BR')}
                        </p>
                      </li>
                    ))}
                  </ul>
                  {limiteHistorico < historico.length && (
                    <button
                      className="button button--ghost game-modal__more"
                      type="button"
                      onClick={() => setLimiteHistorico((limite) => limite + 5)}
                    >
                      Mostrar mais
                    </button>
                  )}
                </>
              )
            )}

            {modalAtivo === 'perdedor' && (
              <form className="app-form game-modal__form" onSubmit={enviarVitoriaRei}>
                <label>
                  Selecione o jogador derrotado
                  <select
                    required
                    value={perdedorId}
                    onChange={(evento) => setPerdedorId(evento.target.value)}
                  >
                    <option value="">Selecione</option>
                    {outros.map((id) => <option key={id} value={id}>{nome(id)}</option>)}
                  </select>
                </label>
                <button
                  className="button button--primary"
                  type="submit"
                  disabled={ocupado || !perdedorId}
                >
                  {ocupado ? 'Registrando...' : 'Confirmar vitória'}
                </button>
              </form>
            )}
          </section>
        </div>
      )}

      {estadoConfirmacao && (
        <div
          className={`game-action-backdrop game-action-backdrop--${estadoConfirmacao}`}
          onClick={(evento) => {
            if (estadoConfirmacao === 'sucesso' && evento.target === evento.currentTarget) {
              setEstadoConfirmacao(null);
            }
          }}
        >
          {estadoConfirmacao === 'carregando' ? (
            <div className="game-action-loading" role="status" aria-live="polite">
              <span className="game-action-loading__spinner" aria-hidden="true" />
              <strong>{tituloConfirmacao}</strong>
            </div>
          ) : (
            <section
              className="game-action-success"
              role="dialog"
              aria-modal="true"
              aria-labelledby="game-action-title"
            >
              <span className="game-action-success__icon" aria-hidden="true">✓</span>
              <h2 id="game-action-title">{tituloConfirmacao}</h2>
              <p>A atualização já aparece na tela do jogo.</p>
              <button
                className="button button--primary"
                type="button"
                onClick={() => setEstadoConfirmacao(null)}
              >
                Continuar
              </button>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
