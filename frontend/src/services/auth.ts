import axios from 'axios';
import { api } from './api';

export interface UsuarioAutenticado {
  id: string;
  apelido: string;
}

export interface RespostaAutenticacao {
  accessToken: string;
  usuario: UsuarioAutenticado;
}

interface CredenciaisLogin {
  apelido: string;
  senha: string;
}

interface DadosCadastro extends CredenciaisLogin {
  email: string;
}

export async function entrar(
  credenciais: CredenciaisLogin,
): Promise<RespostaAutenticacao> {
  const { data } = await api.post<RespostaAutenticacao>(
    '/auth/login',
    credenciais,
  );
  return data;
}

export async function cadastrar(
  dados: DadosCadastro,
): Promise<RespostaAutenticacao> {
  const { data } = await api.post<RespostaAutenticacao>(
    '/auth/cadastro',
    dados,
  );
  return data;
}

export function iniciarLoginGoogle(): void {
  const apiUrl = import.meta.env.VITE_API_URL;
  window.location.assign(new URL('/auth/google', apiUrl).toString());
}

export function obterMensagemErro(
  erro: unknown,
  mensagemPadrao: string,
): string {
  if (!axios.isAxiosError(erro)) {
    return mensagemPadrao;
  }

  const mensagem = erro.response?.data?.message;
  if (Array.isArray(mensagem)) {
    return mensagem.join(' ');
  }

  return typeof mensagem === 'string' ? mensagem : mensagemPadrao;
}
