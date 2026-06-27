# Rookary Chess

Xadrez online com autenticacao Google, partidas contra IA com nivel ajustado ao rating e partidas PvP via matchmaking.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS 3
- Prisma + SQLite (dev) / Postgres (prod)
- Auth.js v5 (NextAuth) com Google OAuth
- chess.js para regras/FEN/PGN/SAN
- Stockfish (npm) com fallback heuristico
- Socket.io para PvP em tempo real
- Zod para validacao
- Vitest (unit) + Playwright (e2e)

## Pre-requisitos

- Node.js 20+
- Conta Google Cloud com OAuth Client (Web application) — opcional para autenticacao, o app sobe sem ela em modo demo.

## Setup

```bash
npm install
cp .env.example .env
npx prisma migrate dev --name init
npx prisma db seed
npm run dev          # sobe o Next.js sem socket
npm run dev:server   # sobe o servidor customizado com Socket.io
```

Abra http://localhost:3000.

## Variaveis de ambiente

| Variavel | Descricao |
|---|---|
| `DATABASE_URL` | URL Prisma (`file:./dev.db` no dev). |
| `NEXTAUTH_URL` / `AUTH_URL` | URL publica da aplicacao. |
| `NEXTAUTH_SECRET` / `AUTH_SECRET` | Segredo para sessoes. |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Credenciais Google OAuth. |
| `INITIAL_RATING` | Rating inicial de novos jogadores (padrao 1200). |
| `STOCKFISH_DEPTH_DEFAULT` | Profundidade default da IA. |
| `NEXT_PUBLIC_SOCKET_URL` | URL do servidor Socket.io. |

## Comandos

- `npm run dev` — Next.js com fast refresh.
- `npm run dev:server` — servidor customizado com Socket.io.
- `npm run build && npm run start` — build de producao.
- `npm run typecheck` — TypeScript.
- `npm run lint` — ESLint.
- `npm run test` — Vitest.
- `npm run test:e2e` — Playwright.
- `npm run prisma:seed` — popula 5 usuarios demo.

## Como funciona o rating

- Novos jogadores comecam com `INITIAL_RATING` (1200 padrao).
- Cada partida atualiza o rating com formula tipo Elo: `delta = K * (score - expected)`.
- `K=40` para jogadores com menos de 30 jogos, `K=20` depois.
- O historico de rating fica em `RatingHistory` com motivo (`game_win`, `game_loss`, `game_draw`, `initial`).

## Niveis de IA

A dificuldade da IA e derivada do rating do jogador (`src/lib/chess/types.ts`):

| Nivel | Faixa | Depth | Skill | Randomness |
|---|---|---|---|---|
| Peao | <900 | 1 | 0 | 250 |
| Cavalo | 900-1099 | 4 | 4 | 150 |
| Bispo | 1100-1299 | 7 | 8 | 90 |
| Torre | 1300-1499 | 10 | 12 | 50 |
| Dama | 1500-1799 | 14 | 16 | 20 |
| Rei | 1800+ | 18 | 20 | 0 |

A IA usa o pacote `stockfish` (WASM/Node). Quando a engine nao inicializa, cai para o fallback heuristico (`src/lib/ai/heuristic.ts`).

## Estrutura

```
prisma/
  schema.prisma       # User, Game, Move, RatingHistory
src/
  app/                # Next.js App Router (rotas, pages)
  components/         # UI e tabuleiro
  lib/
    chess/            # engine.ts, types.ts (regras)
    ai/               # stockfish.ts, heuristic.ts
    rating/           # elo.ts
    matchmaking/      # queue.ts
    prisma.ts         # singleton
  server/             # auth.ts, games.ts, socket.ts
scripts/
  dev-server.mjs      # Next + Socket.io
tests/
  chess-engine.test.ts
  ai-heuristic.test.ts
  rating-elo.test.ts
  matchmaking.test.ts
  e2e/home.spec.ts
```

## API

| Metodo | Path | Descricao |
|---|---|---|
| GET  | `/api/me` | Usuario logado + rating |
| POST | `/api/games` | Cria partida PvE |
| GET  | `/api/games/[id]` | Detalhes da partida |
| POST | `/api/games/[id]/move` | Envia lance (UCI) |
| POST | `/api/games/[id]/ai-move` | Solicita lance da IA |
| POST | `/api/games/[id]/finalize` | Aplica rating |
| POST | `/api/matchmaking/join` | Entra na fila |
| POST | `/api/matchmaking/leave` | Sai da fila |
| GET  | `/api/leaderboard` | Top 25 jogadores |
| *    | `/api/auth/[...nextauth]` | Auth.js v5 |

## Deploy

Veja `docs/DEPLOY.md`. SQLite funciona para hobby; em escala troque para Postgres editando `prisma/schema.prisma` e rodando `prisma migrate deploy`.
