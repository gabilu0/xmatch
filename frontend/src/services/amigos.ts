import { api } from './api';

export interface Amigo {
  id: string;
  apelido: string;
  fotoUrl: string | null;
  salasEmComum: number;
}

export interface Solicitacao {
  id: string;
  solicitante: { id: string; apelido: string; fotoUrl: string | null };
  criadoEm: string;
}

export async function listarAmigos(): Promise<Amigo[]> {
  const { data } = await api.get<Amigo[]>('/amigos');
  return data;
}

export async function listarSolicitacoes(): Promise<Solicitacao[]> {
  const { data } = await api.get<Solicitacao[]>('/amigos/solicitacoes/pendentes');
  return data;
}

export async function buscarAmigo(apelido: string): Promise<Amigo> {
  const { data } = await api.get<Amigo>('/amigos/buscar', { params: { apelido } });
  return data;
}

export async function solicitarAmizade(apelido: string): Promise<void> {
  await api.post('/amigos/solicitacoes', { apelido });
}

export async function responderSolicitacao(id: string, acao: 'aceitar' | 'recusar'): Promise<void> {
  await api.post(`/amigos/solicitacoes/${id}/${acao}`);
}
