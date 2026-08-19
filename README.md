# xMatch

Placar de rivalidade entre amigos gamers, organizado em salas privadas por jogo, onde cada grupo define suas próprias regras de vitória. Substitui o grupo de WhatsApp com placar manual.

## Estrutura do repositório

```
xmatch/
├── frontend/    ← React + TypeScript + Vite (PWA)
└── backend/     ← NestJS + TypeScript + TypeORM + PostgreSQL
```

Estrutura definida em `fase3_arquitetura_completa`.

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React + TypeScript + Vite, PWA |
| Backend | NestJS + TypeScript |
| Banco | PostgreSQL + TypeORM |
| Auth | Google OAuth + JWT |
| Notificações | Firebase Cloud Messaging |
| Upload de imagens | Cloudinary |
| Deploy | Vercel (frontend) + Railway (backend + banco) |

## Como rodar localmente

### Backend

```bash
cd backend
cp .env.example .env   # preencher DATABASE_URL, JWT_SECRET, etc.
npm install
npm run migration:run
npm run start:dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Planejamento

O desenvolvimento segue 6 sprints — ver `fase4_planejamento`. Marco de cada sprint define o critério de avanço, não um prazo fixo.

1. **Fundação** — backend + autenticação (atual)
2. **Salas e Amigos**
3. **Jogos**
4. **Partidas e Placar**
5. **Frontend**
6. **Polimento e Lançamento**

## Documentação de produto

As decisões de produto, requisitos e arquitetura completa estão documentadas nas fases 0 a 4 do projeto (fora deste repositório).
