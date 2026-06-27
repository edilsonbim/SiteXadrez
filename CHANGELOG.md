# Changelog

## 0.1.0 - 2025-XX-XX

### Adicionado
- Scaffolding Next.js 14 + TypeScript + Tailwind.
- Prisma schema com User, Game, Move, RatingHistory.
- Auth.js v5 com Google OAuth; rating inicial automatico.
- chess.js para regras/FEN/PGN/SAN.
- Stockfish (npm) com fallback heuristico; 6 niveis derivados do rating.
- API REST: games, moves, ai-move, finalize, matchmaking, leaderboard.
- Socket.io em servidor customizado para PvP em tempo real.
- UI: Home, Login, Lobby, Game (board + clock + move list), Profile, Leaderboard.
- Testes Vitest (chess, AI, rating, matchmaking) + Playwright smoke.
- Docs: README, ARCHITECTURE, API, DEPLOY.
