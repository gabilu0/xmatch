import { api } from './api';

export interface Perfil {
  id: string;
  apelido: string;
  fotoUrl: string | null;
}

export async function obterPerfil(): Promise<Perfil> {
  const { data } = await api.get<Perfil>('/usuarios/me');
  return data;
}

export async function atualizarApelido(apelido: string): Promise<Perfil> {
  const { data } = await api.patch<Perfil>('/usuarios/me', { apelido });
  return data;
}

export async function enviarFoto(foto: File): Promise<Perfil> {
  const formulario = new FormData();
  formulario.append('foto', foto);
  const { data } = await api.post<Perfil>('/usuarios/me/foto', formulario);
  return data;
}
