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

## Opcao 2: Vercel (Next.js) + Neon (Postgres)

Fluxo recomendado para producao do Rookary:

1. Suba o projeto no Vercel conectando o repositorio GitHub.
2. Crie um banco no Neon e use a `DATABASE_URL` fornecida por ele.
3. Configure as envs no painel da Vercel:
   - `DATABASE_URL`
   - `NEXTAUTH_URL`
   - `NEXTAUTH_SECRET`
   - `AUTH_SECRET`
   - `AUTH_GOOGLE_ID`
   - `AUTH_GOOGLE_SECRET`
   - `AUTH_TRUST_HOST=true`
   - `INITIAL_RATING`
   - `K_FACTOR_NEW`
   - `K_FACTOR_ESTABLISHED`
   - `NEXT_PUBLIC_SOCKET_URL`
4. Rode `prisma migrate deploy` no banco Neon antes do primeiro deploy.
5. Faça deploy do app.

Importante:
- O app Next.js roda muito bem na Vercel.
- PvP em tempo real com Socket.io nao roda dentro da Vercel como servidor persistente. O servidor de socket precisa ficar em outro host Node longo prazo, como Render, Fly.io ou Railway.
- Se quiser somente PvE e login/conta/ranking, Vercel + Neon basta.

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
- `AUTH_TRUST_HOST=true`
- `INITIAL_RATING`
- `K_FACTOR_NEW`
- `K_FACTOR_ESTABLISHED`

## Observacoes

- Stockfish WASM roda dentro do Node, sem dependencia externa.
- Em escala, mover o Stockfish para um worker dedicado (fila BullMQ ou servico separado) reduz latencia da UI.
- Adicionar Redis na fila de matchmaking quando houver mais de 1 instancia Node.
