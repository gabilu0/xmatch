import { api } from './api';

export interface Jogo {
  id: string;
  salaId: string;
  nome: string;
  modo: 'duelo' | 'competicao' | 'rei_do_pedaco';
  ciclo: 'sem_fim' | 'season';
  metaVitorias: number | null;
  arquivado: boolean;
  membros: string[];
}

export interface DadosJogo {
  nome: string;
  membros: string[];
  modo?: 'competicao' | 'rei_do_pedaco';
  ciclo: 'sem_fim' | 'season';
  metaVitorias?: number;
}

export interface Placar {
  usuarioId: string;
  vitorias: number;
}

export interface Partida {
  id: string;
  jogoId: string;
  registradoPor: string;
  status: 'pendente' | 'contestada' | 'confirmada' | 'cancelada';
  expiraEm: string;
  criadoEm: string;
  resultados?: { usuarioId: string; vencedor: boolean; pontos: number }[];
}

export interface Season {
  id: string;
  numero: number;
  campeaoId: string | null;
  iniciadaEm: string;
  encerradaEm: string | null;
}

export async function listarJogos(salaId: string): Promise<Jogo[]> {
  const { data } = await api.get<Jogo[]>(`/salas/${salaId}/jogos`);
  return data;
}

export async function criarJogo(salaId: string, jogo: DadosJogo): Promise<Jogo> {
  const { data } = await api.post<Jogo>(`/salas/${salaId}/jogos`, jogo);
  return data;
}

export async function adicionarMembroJogo(jogoId: string, usuarioId: string): Promise<void> {
  await api.post(`/jogos/${jogoId}/membros`, { usuarioId });
}

export async function obterPlacar(jogoId: string): Promise<Placar[]> {
  const { data } = await api.get<Placar[]>(`/jogos/${jogoId}/placar`);
  return data;
}

export async function obterPlacarSala(salaId: string): Promise<Placar[]> {
  const { data } = await api.get<Placar[]>(`/salas/${salaId}/placar`);
  return data;
}

export async function listarPartidas(jogoId: string): Promise<Partida[]> {
  const { data } = await api.get<Partida[]>(`/jogos/${jogoId}/partidas`);
  return data;
}

export async function listarPendentes(): Promise<Partida[]> {
  const { data } = await api.get<Partida[]>('/partidas/pendentes');
  return data;
}

export async function listarSeasons(jogoId: string): Promise<Season[]> {
  const { data } = await api.get<Season[]>(`/jogos/${jogoId}/seasons`);
  return data;
}

export async function registrarVitoria(jogoId: string, perdedorId?: string): Promise<void> {
  await api.post(`/jogos/${jogoId}/partidas`, perdedorId ? { perdedorId } : {});
}

export async function resolverPartida(id: string, acao: 'contestar' | 'confirmar' | 'cancelar'): Promise<void> {
  await api.post(`/partidas/${id}/${acao}`);
}
