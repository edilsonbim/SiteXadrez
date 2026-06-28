// Standalone Socket.io server for PvP live games.
// Runs on its own port (default 3001) so it can use tsx without colliding
// with Next.js's AsyncLocalStorage runtime. The Next.js dev server (port
// 3000) handles pages, API routes, auth, and Prisma. The browser connects
// to this server via NEXT_PUBLIC_SOCKET_URL.
//
// Run with: npm run dev:server

import { createServer } from "node:http";
import { Server } from "socket.io";
import { attachSocket } from "../src/server/socket.ts";

const port = parseInt(process.env.SOCKET_PORT || "3001", 10);
const allowedOrigin = process.env.NEXT_PUBLIC_SOCKET_URL || `http://localhost:${port}`;

const server = createServer();
const io = new Server(server, {
  cors: { origin: allowedOrigin },
});

attachSocket(io);

server.listen(port, () => {
  console.log(`[socket] ready on ${allowedOrigin}`);
});