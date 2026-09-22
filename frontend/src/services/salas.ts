import { api } from './api';

export interface Sala {
  id: string;
  nome: string;
  fotoUrl: string | null;
  liderId: string;
  encerrada: boolean;
  criadoEm: string;
}

export interface MembroSala {
  id: string;
  apelido: string;
  fotoUrl: string | null;
}

export interface DetalhesSala extends Sala {
  membros: MembroSala[];
}

export async function listarSalas(): Promise<Sala[]> {
  const { data } = await api.get<Sala[]>('/salas');
  return data;
}

export async function criarSala(nome: string): Promise<Sala> {
  const { data } = await api.post<Sala>('/salas', { nome });
  return data;
}

export async function obterSala(id: string): Promise<DetalhesSala> {
  const { data } = await api.get<DetalhesSala>(`/salas/${id}`);
  return data;
}

export async function entrarSala(codigo: string): Promise<Sala> {
  const { data } = await api.post<Sala>('/salas/entrar', { codigo });
  return data;
}

export async function criarConvite(id: string): Promise<{ codigo: string; expiraEm: string }> {
  const { data } = await api.post<{ codigo: string; expiraEm: string }>(`/salas/${id}/convites`);
  return data;
}

export async function sairSala(id: string): Promise<void> {
  await api.post(`/salas/${id}/sair`);
}

export async function encerrarSala(id: string): Promise<void> {
  await api.post(`/salas/${id}/encerrar`);
}

export async function transferirLideranca(id: string, novoLiderId: string): Promise<void> {
  await api.post(`/salas/${id}/transferir-lideranca`, { novoLiderId });
}

export async function expulsarMembro(id: string, usuarioId: string): Promise<void> {
  await api.post(`/salas/${id}/membros/${usuarioId}/expulsar`);
}
