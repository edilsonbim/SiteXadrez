// Socket.io server: relays moves between opponents and triggers clock ticks.
// In production this runs as a separate Node process; locally we attach it
// to a custom Next.js server (see scripts/dev-server.mjs).

import type { Server as IOServer } from "socket.io";
import { playMove } from "./games";
import { auth as nextAuth } from "./auth";

interface JoinPayload { gameId: string }
interface MovePayload { gameId: string; uci: string }

export function attachSocket(io: IOServer) {
  io.use(async (socket, next) => {
    // Optional: accept session cookie if present. For PvP the http-only
    // session cookie is read by NextAuth; for sockets we trust the room
    // server-authoritative checks inside games.playMove().
    next();
  });

  io.on("connection", (socket) => {
    socket.on("join", async (payload: JoinPayload) => {
      if (!payload?.gameId) return;
      socket.join(`game:${payload.gameId}`);
      socket.to(`game:${payload.gameId}`).emit("peer-joined", { id: socket.id });
    });
    socket.on("leave", (payload: JoinPayload) => {
      if (!payload?.gameId) return;
      socket.leave(`game:${payload.gameId}`);
    });
    socket.on("move", async (payload: MovePayload) => {
      const session = await nextAuth();
      const userId = (session?.user as any)?.id ?? null;
      const result = await playMove({ gameId: payload.gameId, userId, side: "w", uci: payload.uci });
      io.to(`game:${payload.gameId}`).emit("move", result);
    });
    socket.on("resign", async (payload: { gameId: string }) => {
      io.to(`game:${payload.gameId}`).emit("resign", { by: socket.id });
    });
  });
}
