import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { obterMensagemErro } from '../services/auth';
import { criarJogo, listarJogos, obterPlacarSala, type Jogo, type Placar } from '../services/jogos';
import { obterPerfil, type Perfil } from '../services/perfil';
import {
  criarConvite,
  encerrarSala,
  expulsarMembro,
  obterSala,
  sairSala,
  transferirLideranca,
  type DetalhesSala,
} from '../services/salas';
import '../styles/app-pages.css';
import '../styles/sala.css';

type ModalSala = 'convite' | 'criar-jogo' | 'configuracoes' | null;

function descricaoJogo(jogo: Jogo) {
  const modo = jogo.modo === 'duelo'
    ? 'Duelo'
    : jogo.modo === 'competicao'
      ? 'Competição'
      : 'Rei do Pedaço';
  const ciclo = jogo.ciclo === 'season' ? 'Temporada' : 'Sem fim';
  return `${modo} · ${ciclo}`;
}

function textoVitorias(vitorias: number) {
  return `${vitorias} ${vitorias === 1 ? 'vitória' : 'vitórias'}`;
}

export function SalaPage() {
  const { salaId = '' } = useParams();
  const navigate = useNavigate();
  const [sala, setSala] = useState<DetalhesSala | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [placar, setPlacar] = useState<Placar[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [erroModal, setErroModal] = useState('');
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
  const [modalAtivo, setModalAtivo] = useState<ModalSala>(null);

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
      .catch((falha: unknown) => {
        if (ativo) setErro(obterMensagemErro(falha, 'Não foi possível abrir a sala.'));
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => { ativo = false; };
  }, [salaId]);

  useEffect(() => {
    if (!modalAtivo) return;

    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function fecharComEscape(evento: KeyboardEvent) {
      if (evento.key === 'Escape') setModalAtivo(null);
    }

    window.addEventListener('keydown', fecharComEscape);
    return () => {
      document.body.style.overflow = overflowAnterior;
      window.removeEventListener('keydown', fecharComEscape);
    };
  }, [modalAtivo]);

  function abrirModal(modal: Exclude<ModalSala, null>) {
    setErroModal('');
    setModalAtivo(modal);
  }

  function fecharModal() {
    setModalAtivo(null);
    setErroModal('');
  }

  async function executar(acao: () => Promise<void>, fecharAoConcluir = false) {
    setOcupado(true);
    setErro('');
    setErroModal('');
    try {
      await acao();
      if (fecharAoConcluir) fecharModal();
    } catch (falha) {
      const mensagem = obterMensagemErro(falha, 'Não foi possível concluir a ação.');
      if (modalAtivo) setErroModal(mensagem);
      else setErro(mensagem);
    } finally {
      setOcupado(false);
    }
  }

  async function abrirConvite() {
    abrirModal('convite');
    setCodigo('');
    setOcupado(true);
    try {
      const convite = await criarConvite(salaId);
      setCodigo(convite.codigo);
    } catch (falha) {
      setErroModal(obterMensagemErro(falha, 'Não foi possível gerar o convite.'));
    } finally {
      setOcupado(false);
    }
  }

  async function enviarJogo(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (membros.length < 2) {
      setErroModal('Escolha pelo menos duas pessoas.');
      return;
    }
    setCriando(true);
    setErroModal('');
    try {
      await criarJogo(salaId, {
        nome: nome.trim(),
        membros,
        ...(membros.length > 2 ? { modo } : {}),
        ciclo,
        ...(ciclo === 'season' ? { metaVitorias: Number(meta) } : {}),
      });
      setJogos(await listarJogos(salaId));
      setNome('');
      fecharModal();
    } catch (falha) {
      setErroModal(obterMensagemErro(falha, 'Não foi possível criar o jogo.'));
    } finally {
      setCriando(false);
    }
  }

  if (carregando) {
    return <main className="app-page"><p role="status">Carregando sala...</p></main>;
  }

  if (!sala || !perfil) {
    return (
      <main className="app-page">
        <Link to="/salas">← Suas salas</Link>
        <p role="alert" className="form-error">{erro || 'Sala não encontrada.'}</p>
      </main>
    );
  }

  const lider = sala.liderId === perfil.id;
  const nomeParticipante = (usuarioId: string) => (
    sala.membros.find((membro) => membro.id === usuarioId)?.apelido ?? 'Participante'
  );

  return (
    <main className="app-page room-page">
      <div className="room-page__topbar">
        <Link to="/salas">← Suas salas</Link>
        {!sala.encerrada && lider && (
          <button
            className="room-page__invite"
            type="button"
            onClick={abrirConvite}
            disabled={ocupado}
            aria-label="Gerar convite"
            title="Gerar convite"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 8a3 3 0 1 0-2.83-4A3 3 0 0 0 15 8ZM6 14a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm9-4c-2.33 0-7 1.17-7 3.5V16h14v-2.5C22 11.17 17.33 10 15 10ZM6 16c-2.33 0-6 1.17-6 3.5V22h8v-2.5c0-.86.33-1.61.89-2.25A9.74 9.74 0 0 0 6 16Z" />
              <path d="M19 2v2h-2v2h2v2h2V6h2V4h-2V2h-2Z" />
            </svg>
          </button>
        )}
      </div>

      <header className="room-page__heading">
        <h1>{sala.nome}</h1>
      </header>

      {erro && <p className="form-error" role="alert">{erro}</p>}

      <section className="panel podium-panel">
        <h2>Pódio da sala</h2>
        <ol className="podium-list">
          {placar.slice(0, 3).map((linha, indice) => (
            <li className={`podium-entry podium-entry--${indice + 1}`} key={linha.usuarioId}>
              <span className="podium-entry__position" aria-hidden="true">{indice + 1}º</span>
              <span className="podium-entry__name">{nomeParticipante(linha.usuarioId)}</span>
              <strong>{textoVitorias(linha.vitorias)}</strong>
            </li>
          ))}
        </ol>
        {placar.length > 3 && (
          <details className="room-ranking">
            <summary>Ver ranking completo</summary>
            <ol className="rank-list">
              {placar.map((linha) => (
                <li key={linha.usuarioId}>
                  {nomeParticipante(linha.usuarioId)}
                  <strong>{textoVitorias(linha.vitorias)}</strong>
                </li>
              ))}
            </ol>
          </details>
        )}
      </section>

      <section className="room-games">
        <h2>Jogos</h2>
        {jogos.length === 0 ? (
          <div className="room-games__empty">Nenhum jogo criado nesta sala.</div>
        ) : (
          <ul className="game-grid">
            {jogos.map((jogo) => {
              const participa = jogo.membros.includes(perfil.id);
              const conteudo = (
                <>
                  <span className="game-card__avatar" aria-hidden="true">
                    {jogo.nome.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="game-card__text">
                    <strong>{jogo.nome}</strong>
                    <span>{participa ? descricaoJogo(jogo) : 'Você não participa deste jogo'}</span>
                  </span>
                </>
              );

              return (
                <li key={jogo.id}>
                  {participa ? (
                    <Link className="game-card" to={`/salas/${salaId}/jogos/${jogo.id}`}>
                      {conteudo}
                    </Link>
                  ) : (
                    <div className="game-card game-card--disabled">{conteudo}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {!sala.encerrada && lider && (
        <section className="room-admin-actions" aria-label="Administração da sala">
          <button
            className="button button--primary"
            type="button"
            onClick={() => abrirModal('criar-jogo')}
          >
            Criar jogo
          </button>
          <button
            className="button button--ghost"
            type="button"
            onClick={() => abrirModal('configuracoes')}
          >
            Configurações
          </button>
        </section>
      )}

      {!sala.encerrada && !lider && (
        <div className="room-leave">
          <button
            type="button"
            className="button button--ghost"
            disabled={ocupado}
            onClick={() => executar(async () => {
              await sairSala(salaId);
              navigate('/salas');
            })}
          >
            Sair da sala
          </button>
        </div>
      )}

      {modalAtivo && (
        <div
          className="room-modal-backdrop"
          onClick={(evento) => {
            if (evento.target === evento.currentTarget) fecharModal();
          }}
        >
          <section
            className="room-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="room-modal-title"
          >
            <header className="room-modal__header">
              <h2 id="room-modal-title">
                {modalAtivo === 'convite' && 'Convite da sala'}
                {modalAtivo === 'criar-jogo' && 'Criar jogo'}
                {modalAtivo === 'configuracoes' && 'Configurações'}
              </h2>
              <button
                className="room-modal__close"
                type="button"
                onClick={fecharModal}
                aria-label="Fechar"
                autoFocus={modalAtivo !== 'criar-jogo'}
              >
                ×
              </button>
            </header>

            {erroModal && <p className="form-error" role="alert">{erroModal}</p>}

            {modalAtivo === 'convite' && (
              <div className="invite-result" aria-live="polite">
                {ocupado && <p>Gerando convite...</p>}
                {codigo && (
                  <>
                    <p>Compartilhe este código:</p>
                    <strong>{codigo}</strong>
                    <p>Válido por 48 horas ou até ser usado.</p>
                  </>
                )}
              </div>
            )}

            {modalAtivo === 'criar-jogo' && (
              sala.membros.length < 2 ? (
                <p>Convide mais uma pessoa para poder criar um jogo.</p>
              ) : (
                <form className="app-form room-modal__form" onSubmit={enviarJogo}>
                  <label>
                    Nome do jogo
                    <input
                      value={nome}
                      onChange={(evento) => setNome(evento.target.value)}
                      maxLength={50}
                      required
                      autoFocus
                    />
                  </label>
                  <fieldset>
                    <legend>Participantes (mínimo 2)</legend>
                    <div className="chips">
                      {sala.membros.map((membro) => (
                        <label key={membro.id} className="check">
                          <input
                            type="checkbox"
                            checked={membros.includes(membro.id)}
                            onChange={() => setMembros((anteriores) => (
                              anteriores.includes(membro.id)
                                ? anteriores.filter((id) => id !== membro.id)
                                : [...anteriores, membro.id]
                            ))}
                          />
                          {membro.apelido}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  {membros.length > 2 && (
                    <label>
                      Modo
                      <select value={modo} onChange={(evento) => setModo(evento.target.value as typeof modo)}>
                        <option value="competicao">Competição</option>
                        <option value="rei_do_pedaco">Rei do Pedaço</option>
                      </select>
                    </label>
                  )}
                  <label>
                    Ciclo
                    <select value={ciclo} onChange={(evento) => setCiclo(evento.target.value as typeof ciclo)}>
                      <option value="sem_fim">Sem fim</option>
                      <option value="season">Temporada</option>
                    </select>
                  </label>
                  {ciclo === 'season' && (
                    <label>
                      Meta de vitórias
                      <input
                        type="number"
                        min={1}
                        max={9999}
                        required
                        value={meta}
                        onChange={(evento) => setMeta(evento.target.value)}
                      />
                    </label>
                  )}
                  <button
                    className="button button--primary"
                    type="submit"
                    disabled={criando || membros.length < 2}
                  >
                    {criando ? 'Criando...' : 'Criar jogo'}
                  </button>
                </form>
              )
            )}

            {modalAtivo === 'configuracoes' && (
              <div className="room-settings">
                {sala.membros.length > 1 && (
                  <>
                    <div className="app-form">
                      <label>
                        Transferir liderança
                        <select value={novoLider} onChange={(evento) => setNovoLider(evento.target.value)}>
                          <option value="">Selecione um membro</option>
                          {sala.membros
                            .filter((membro) => membro.id !== perfil.id)
                            .map((membro) => (
                              <option key={membro.id} value={membro.id}>{membro.apelido}</option>
                            ))}
                        </select>
                      </label>
                      <button
                        className="button button--ghost"
                        type="button"
                        disabled={!novoLider || ocupado}
                        onClick={() => executar(async () => {
                          await transferirLideranca(salaId, novoLider);
                          setSala(await obterSala(salaId));
                        }, true)}
                      >
                        Transferir liderança
                      </button>
                    </div>

                    <div className="app-form room-settings__section">
                      <label>
                        Remover membro
                        <select value={expulso} onChange={(evento) => setExpulso(evento.target.value)}>
                          <option value="">Selecione um membro</option>
                          {sala.membros
                            .filter((membro) => membro.id !== perfil.id)
                            .map((membro) => (
                              <option key={membro.id} value={membro.id}>{membro.apelido}</option>
                            ))}
                        </select>
                      </label>
                      <button
                        className="button button--ghost"
                        type="button"
                        disabled={!expulso || ocupado}
                        onClick={() => {
                          if (window.confirm('Remover este membro da sala?')) {
                            executar(async () => {
                              await expulsarMembro(salaId, expulso);
                              const salaAtualizada = await obterSala(salaId);
                              setSala(salaAtualizada);
                              setMembros(salaAtualizada.membros.map((membro) => membro.id));
                              setExpulso('');
                            });
                          }
                        }}
                      >
                        Remover da sala
                      </button>
                    </div>
                  </>
                )}

                <div className="room-settings__section room-settings__danger">
                  <p>Encerrar a sala mantém o histórico disponível para consulta.</p>
                  <button
                    type="button"
                    className="button button--ghost"
                    disabled={ocupado}
                    onClick={() => {
                      if (window.confirm('Encerrar esta sala?')) {
                        executar(async () => {
                          await encerrarSala(salaId);
                          setSala({ ...sala, encerrada: true });
                        }, true);
                      }
                    }}
                  >
                    Encerrar sala
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
