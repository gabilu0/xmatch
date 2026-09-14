import axios from 'axios';

// Ver fase3_arquitetura_completa: "O frontend nunca armazena dados
// sensíveis além do JWT no localStorage."
const TOKEN_KEY = 'xmatch_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function limparToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Se o token expirar/for inválido, o backend responde 401 — limpa o token
// local para forçar novo login, em vez de ficar batendo 401 repetidamente.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      limparToken();
    }
    return Promise.reject(error);
  },
);
