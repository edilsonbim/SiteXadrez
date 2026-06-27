// Custom Next.js server with Socket.io for PvP live games.
// Run with: node scripts/dev-server.mjs
import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import { attachSocket } from "../src/server/socket.ts";

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT || "3000", 10);
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => handle(req, res));
  const io = new Server(server, { cors: { origin: "*" } });
  attachSocket(io);
  server.listen(port, () => {
    console.log(`[chess] ready on http://localhost:${port}`);
  });
});
