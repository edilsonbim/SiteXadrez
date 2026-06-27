# Deploy

## Opcao 1: Hobby / single-node (SQLite + Node custom server)

Roda tudo em um unico VPS (Hetzner, DigitalOcean, OVH).

1. Build:
   ```bash
   npm ci
   npx prisma migrate deploy
   npm run build
   ```
2. Process manager (PM2):
   ```bash
   pm2 start scripts/dev-server.mjs --name xadrez --time
   ```
   Em prod: `NODE_ENV=production` e `AUTH_SECRET` forte.
3. Nginx como reverse proxy para `localhost:3000` com HTTPS (certbot).

## Opcao 2: Vercel (Next.js) + Postgres gerenciado

- Vercel: faca deploy do app Next.js normalmente. Configure envs no painel.
- Socket.io precisa de servidor proprio. Suba `scripts/dev-server.mjs` em Railway/Render/Fly.
- Banco: troque `provider = "sqlite"` para `provider = "postgresql"` em `prisma/schema.prisma` e use `DATABASE_URL=postgres://...`.
- Atualize `next.config.mjs` removendo `serverComponentsExternalPackages` se nao precisar.

## Opcao 3: Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build
EXPOSE 3000
CMD ["node", "scripts/dev-server.mjs"]
```

Banco: volume montado em `/app/prisma/dev.db` ou `DATABASE_URL` apontando para Postgres externo.

## Variaveis obrigatorias em prod

- `DATABASE_URL`
- `AUTH_SECRET` (32+ chars, gere com `openssl rand -hex 32`)
- `NEXTAUTH_URL`
- `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`
- `NEXT_PUBLIC_SOCKET_URL` (aponta para o servidor Socket.io)

## Observacoes

- Stockfish WASM roda dentro do Node, sem dependencia externa.
- Em escala, mover o Stockfish para um worker dedicado (fila BullMQ ou servico separado) reduz latencia da UI.
- Adicionar Redis na fila de matchmaking quando houver mais de 1 instancia Node.
