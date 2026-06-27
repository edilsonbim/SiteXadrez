# API Reference

Base URL: `http://localhost:3000`

Todas as rotas (exceto `/api/auth/*` e `/api/leaderboard`) exigem sessao Auth.js valida.

## GET /api/me

Retorna o usuario autenticado e seu rating atual.

```json
{
  "user": {
    "id": "ckxxx",
    "name": "Alice",
    "email": "alice@example.com",
    "image": "https://...",
    "rating": 1320,
    "rd": 240.5,
    "gamesPlayed": 12,
    "wins": 5,
    "losses": 4,
    "draws": 3
  }
}
```

## POST /api/games

Cria partida PvE (jogador vs IA). Body:

```json
{ "initialTime": 600, "increment": 0 }
```

Resposta 200: `{ "gameId": "ckxxx" }`. Status 400 em body invalido, 401 sem login.

## GET /api/games/[id]

Retorna a partida com `white`, `black`, `moves[]` ordenadas por ply.

## POST /api/games/[id]/move

Body: `{ "uci": "e2e4" }`. Retorna:

```json
{
  "fen": "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
  "pgn": "1. e4 e5",
  "ply": 1,
  "result": "ONGOING",
  "move": { "ply": 1, "san": "e4", "uci": "e2e4", "fenAfter": "..." }
}
```

Erros: `illegal`, `not_your_turn`, `not_white`, `not_black`, `finished`, `auth`, `not_found`.

## POST /api/games/[id]/ai-move

Roda a IA para a partida PvE atual e devolve o lance jogado.

## POST /api/games/[id]/finalize

Aplica atualizacao de rating para os jogadores quando a partida esta em `FINISHED`. Cria registros em `RatingHistory`.

## POST /api/matchmaking/join

Body: `{ "initialTime": 600, "increment": 0 }`. Retorna `{ matched: true, gameId }` se houve match, ou `{ matched: false, queued: true }`.

## POST /api/matchmaking/leave

Remove o jogador da fila.

## GET /api/leaderboard

Top 25 jogadores por rating.

## Auth.js v5

`/api/auth/signin`, `/api/auth/callback/google`, `/api/auth/signout`, `/api/auth/session` sao expostos pelo `handlers` em `src/server/auth.ts`.
