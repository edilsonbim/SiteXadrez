# Arquitetura

## Visao geral

```
        +-------------------+
        |     Next.js App   |
        |  (App Router)     |
        +---------+---------+
                  |
        +---------v---------+        +------------------+
        |   Auth.js v5      |<------>| Google OAuth     |
        |  (Prisma adapter) |        +------------------+
        +---------+---------+
                  |
        +---------v---------+
        |     Prisma ORM    |
        +---------+---------+
                  |
        +---------v---------+
        |  SQLite (dev)     |
        |  Postgres (prod)  |
        +-------------------+

   Cliente HTTP/REST (UI)   <---------->   /api/games/* (server routes)

   PvP tempo real: Socket.io (scripts/dev-server.mjs) faz relay de lances
   entre os dois jogadores e re-aplica via games.playMove() server-side.
```

## Fluxo: criar partida PvE

1. UI (lobby) -> POST /api/games
2. server/games.createPveGame(): cria Game.mode=PVE, fen inicial, derive AI level do rating
3. UI redireciona para /game/[id]?mode=pve
4. Jogador move: POST /api/games/[id]/move com UCI
5. Server: playMove valida FEN/turn/promotion e persiste Move + atualiza Game
6. UI detecta result=ONGOING e chama POST /api/games/[id]/ai-move
7. Server: pickAiMove roda Stockfish (ou heuristic) e devolve UCI + SAN
8. UI aplica estado. Quando result!=ONGOING, chama finalize -> atualiza rating.

## Fluxo: matchmaking PvP

1. UI chama POST /api/matchmaking/join (com controle)
2. matchmaking/queue.tryMatch: encontra oponente na janela (100..600)
3. Se achar, cria Game.mode=PVP com white/black ordenados por rating
4. Os 2 clientes conectam ao Socket.io, entram em `game:<id>`
5. Cada lance passa por socket `move` -> playMove -> broadcast para o room
6. Desconexao nao finaliza o jogo; jogador pode reconectar pelo mesmo cookie.

## Autoridade do servidor

- Toda regra de xadrez roda server-side (playMove). Cliente envia apenas UCI.
- Rating e clock sao derivados do estado persistido, nao confiavel no cliente.
- IA roda no servidor, cliente apenas exibe.

## Camadas

- `lib/chess/*` — regras puras, sem IO.
- `lib/ai/*` — adaptadores de engine (Stockfish + heuristica).
- `lib/rating/*` — funcao pura de atualizacao de rating.
- `lib/matchmaking/*` — fila em memoria.
- `server/*` — integracao com Prisma, Auth.js, Socket.io.
- `app/api/*` — handlers HTTP finos.
- `components/chess/*` — UI interativa (board, moves, clock).
