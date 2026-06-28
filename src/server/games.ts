// Server-side game service. Persists via Prisma, drives clocks, validates
// moves server-authoritatively, and applies rating updates at game end.

import { prisma } from "@/lib/prisma";
import { ChessEngine } from "@/lib/chess/engine";
import { engineForRating } from "@/lib/chess/types";
import { pickAiMove } from "@/lib/ai/stockfish";
import { updateRating } from "@/lib/rating/elo";
import { randomBytes } from "node:crypto";

type ResultKind = "WHITE_WIN" | "BLACK_WIN" | "DRAW";

export async function createPveGame(opts: { userId: string; initialTime?: number; increment?: number }) {
  const user = await prisma.user.findUnique({ where: { id: opts.userId } });
  if (!user) throw new Error("user_not_found");
  const engine = engineForRating(user.rating);
  const t = opts.initialTime ?? 600;
  const humanPlaysWhite = Math.random() < 0.5;
  return prisma.game.create({
    data: {
      mode: "PVE",
      status: "IN_PROGRESS",
      whiteId: humanPlaysWhite ? user.id : null,
      blackId: humanPlaysWhite ? null : user.id,
      initialTime: t,
      increment: opts.increment ?? 0,
      whiteTime: t,
      blackTime: t,
      aiLevel: engine.depth,
      fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    },
  });
}

export async function createPvpGameFor(opts: { whiteId: string; blackId: string; initialTime: number; increment: number }) {
  return prisma.game.create({
    data: {
      mode: "PVP",
      status: "IN_PROGRESS",
      whiteId: opts.whiteId,
      blackId: opts.blackId,
      initialTime: opts.initialTime,
      increment: opts.increment,
      whiteTime: opts.initialTime,
      blackTime: opts.initialTime,
    },
  });
}

const BOT_NAMES = [
  "Orion Vale",
  "Lyra Crown",
  "Mavrik Stone",
  "Selene Noir",
  "Cassian Holt",
  "Ada Mercer",
  "Viktor Rune",
  "Noa Voss",
  "Elara Finch",
  "Aster Quill",
  "Iris Vale",
  "Dorian Crest",
];

async function ensureBotPlayer(rating: number) {
  const baseName = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
  const email = `bot-${baseName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Math.max(1000, Math.round(rating))}@rookary.bot`;
  return prisma.user.upsert({
    where: { email },
    update: {
      name: baseName,
      rating: Math.max(800, Math.min(2600, Math.round(rating))),
      rd: 180,
      volatility: 0.03,
      isGuest: false,
    },
    create: {
      email,
      name: baseName,
      rating: Math.max(800, Math.min(2600, Math.round(rating))),
      rd: 180,
      volatility: 0.03,
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      passwordHash: randomBytes(16).toString("hex"),
    },
  });
}

export async function createPvpFallbackAiGame(opts: { userId: string; rating: number; initialTime: number; increment: number }) {
  const bot = await ensureBotPlayer(opts.rating);
  return prisma.game.create({
    data: {
      mode: "PVP",
      status: "IN_PROGRESS",
      whiteId: opts.rating >= bot.rating ? opts.userId : bot.id,
      blackId: opts.rating >= bot.rating ? bot.id : opts.userId,
      initialTime: opts.initialTime,
      increment: opts.increment,
      whiteTime: opts.initialTime,
      blackTime: opts.initialTime,
    },
  });
}

export async function playMove(opts: { gameId: string; userId: string | null; side: "w" | "b"; uci: string }) {
  const game = await prisma.game.findUnique({ where: { id: opts.gameId }, include: { moves: true } });
  if (!game) return { ok: false, reason: "not_found" as const };
  if (game.status !== "IN_PROGRESS") return { ok: false, reason: "finished" as const };
  if (game.mode === "PVP") {
    if (!opts.userId) return { ok: false, reason: "auth" as const };
    if (opts.side === "w" && game.whiteId !== opts.userId) return { ok: false, reason: "not_white" as const };
    if (opts.side === "b" && game.blackId !== opts.userId) return { ok: false, reason: "not_black" as const };
  }
  const engine = ChessEngine.fromFen(game.fen);
  if (engine.turn() !== opts.side) return { ok: false, reason: "not_your_turn" as const };
  const ply = (game.moveCount ?? 0) + 1;
  // Decrement clock of the side that just moved.
  // Note: clock for the new turn is the *opponent's* remaining time.
  const whiteAfter = game.whiteTime;
  const blackAfter = game.blackTime;
  const result = engine.applyUci(opts.uci, {
    ply,
    whiteTime: whiteAfter,
    blackTime: blackAfter,
    byUserId: opts.userId,
  });
  if (!result.ok || !result.move) return { ok: false, reason: result.reason ?? "illegal" as const };
  // Update clocks: subtract elapsed time of the mover; in this model the
  // server stamps `timeMs` only on demand (called from socket tick), so
  // here we just preserve the current values. The tick handler is
  // responsible for live clock state.
  const updated = await prisma.$transaction(async (tx) => {
    await tx.move.create({
      data: {
        gameId: game.id,
        byUserId: opts.userId,
        ply: result.move!.ply,
        san: result.move!.san,
        uci: result.move!.uci,
        fenAfter: result.move!.fenAfter,
        whiteTime: result.move!.whiteTime,
        blackTime: result.move!.blackTime,
      },
    });
    return tx.game.update({
      where: { id: game.id },
      data: {
        fen: result.move!.fenAfter,
        pgn: engine.pgn(),
        moveCount: result.move!.ply,
        whiteTime: result.move!.whiteTime,
        blackTime: result.move!.blackTime,
        result: result.result ?? "ONGOING",
        status: result.result && result.result !== "ONGOING" ? "FINISHED" : "IN_PROGRESS",
        winnerId:
          result.result === "WHITE_WIN" ? game.whiteId :
          result.result === "BLACK_WIN" ? game.blackId :
          game.winnerId,
      },
    });
  });
  return { ok: true as const, game: updated, move: result.move, result: result.result ?? "ONGOING" as const };
}

export async function playAiMove(opts: { gameId: string }) {
  const game = await prisma.game.findUnique({ where: { id: opts.gameId } });
  if (!game) return { ok: false, reason: "not_found" as const };
  if (game.mode !== "PVE" || game.status !== "IN_PROGRESS") return { ok: false, reason: "bad_state" as const };
  if (!game.whiteId) return { ok: false, reason: "no_user" as const };
  const user = await prisma.user.findUnique({ where: { id: game.whiteId } });
  if (!user) return { ok: false, reason: "no_user" as const };
  const level = engineForRating(user.rating);
  const ply = (game.moveCount ?? 0) + 1;
  const ai = await pickAiMove({ fen: game.fen, level });
  const engine = ChessEngine.fromFen(game.fen);
  const result = engine.applyUci(ai.uci, { ply, whiteTime: game.whiteTime, blackTime: game.blackTime, byUserId: null });
  if (!result.ok || !result.move) return { ok: false, reason: "ai_failed" as const };
  const updated = await prisma.$transaction(async (tx) => {
    await tx.move.create({
      data: {
        gameId: game.id,
        byUserId: null,
        ply: result.move!.ply,
        san: result.move!.san,
        uci: result.move!.uci,
        fenAfter: result.move!.fenAfter,
        whiteTime: result.move!.whiteTime,
        blackTime: result.move!.blackTime,
      },
    });
    return tx.game.update({
      where: { id: game.id },
      data: {
        fen: result.move!.fenAfter,
        pgn: engine.pgn(),
        moveCount: result.move!.ply,
        result: result.result ?? "ONGOING",
        status: result.result && result.result !== "ONGOING" ? "FINISHED" : "IN_PROGRESS",
        winnerId:
          result.result === "WHITE_WIN" ? game.whiteId :
          result.result === "BLACK_WIN" ? null : // AI win: no human winner
          game.winnerId,
      },
    });
  });
  return { ok: true as const, game: updated, move: result.move, ai, result: result.result ?? "ONGOING" as const };
}

export async function finalizeRating(gameId: string) {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      white: { select: { id: true, rating: true, rd: true, gamesPlayed: true, wins: true, losses: true, draws: true, isGuest: true } },
      black: { select: { id: true, rating: true, rd: true, gamesPlayed: true, wins: true, losses: true, draws: true, isGuest: true } },
    },
  });
  if (!game || game.status !== "FINISHED") return null;
  const updates: Array<Promise<any>> = [];
  if (game.mode === "PVE" && game.white) {
    // PvE never counts guest rating: if the human is a guest, skip.
    if (!game.white.isGuest) {
      const w = game.white;
      const score = game.result === "WHITE_WIN" ? 1 : game.result === "DRAW" ? 0.5 : 0;
      const u = updateRating({ selfRating: w.rating, selfRd: w.rd, selfGames: w.gamesPlayed, oppRating: engineForRating(w.rating).minRating + 200, oppRd: 200, score });
      updates.push(prisma.user.update({ where: { id: w.id }, data: { rating: u.rating, rd: u.rd, gamesPlayed: w.gamesPlayed + 1, wins: w.wins + (score === 1 ? 1 : 0), losses: w.losses + (score === 0 ? 1 : 0), draws: w.draws + (score === 0.5 ? 1 : 0) } }));
      updates.push(prisma.ratingHistory.create({ data: { userId: w.id, gameId: game.id, rating: u.rating, rd: u.rd, delta: u.delta, reason: score === 1 ? "game_win" : score === 0 ? "game_loss" : "game_draw" } }));
    }
  }
  if (game.mode === "PVP" && game.white && game.black) {
    // Casual match if either side is a guest: no rating changes, no history.
    if (game.white.isGuest || game.black.isGuest) {
      return { ok: true, casual: true };
    }
    const w = game.white, b = game.black;
    const sw = game.result === "WHITE_WIN" ? 1 : game.result === "DRAW" ? 0.5 : 0;
    const sb = 1 - sw;
    const uw = updateRating({ selfRating: w.rating, selfRd: w.rd, selfGames: w.gamesPlayed, oppRating: b.rating, oppRd: b.rd, score: sw });
    const ub = updateRating({ selfRating: b.rating, selfRd: b.rd, selfGames: b.gamesPlayed, oppRating: w.rating, oppRd: w.rd, score: sb });
    updates.push(prisma.user.update({ where: { id: w.id }, data: { rating: uw.rating, rd: uw.rd, gamesPlayed: w.gamesPlayed + 1, wins: w.wins + (sw === 1 ? 1 : 0), losses: w.losses + (sw === 0 ? 1 : 0), draws: w.draws + (sw === 0.5 ? 1 : 0) } }));
    updates.push(prisma.user.update({ where: { id: b.id }, data: { rating: ub.rating, rd: ub.rd, gamesPlayed: b.gamesPlayed + 1, wins: b.wins + (sb === 1 ? 1 : 0), losses: b.losses + (sb === 0 ? 1 : 0), draws: b.draws + (sb === 0.5 ? 1 : 0) } }));
    updates.push(prisma.ratingHistory.create({ data: { userId: w.id, gameId: game.id, rating: uw.rating, rd: uw.rd, delta: uw.delta, reason: sw === 1 ? "game_win" : sw === 0 ? "game_loss" : "game_draw" } }));
    updates.push(prisma.ratingHistory.create({ data: { userId: b.id, gameId: game.id, rating: ub.rating, rd: ub.rd, delta: ub.delta, reason: sb === 1 ? "game_win" : sb === 0 ? "game_loss" : "game_draw" } }));
  }
  await Promise.all(updates);
  return { ok: true };
}

export async function finalizeTimeout(gameId: string, loserSide: "w" | "b") {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      white: { select: { id: true, rating: true, rd: true, gamesPlayed: true, wins: true, losses: true, draws: true, isGuest: true } },
      black: { select: { id: true, rating: true, rd: true, gamesPlayed: true, wins: true, losses: true, draws: true, isGuest: true } },
    },
  });
  if (!game || game.status !== "IN_PROGRESS") return null;
  const winnerSide = loserSide === "w" ? "b" : "w";
  const updated = await prisma.game.update({
    where: { id: gameId },
    data: {
      status: "FINISHED",
      result: loserSide === "w" ? "BLACK_WIN" : "WHITE_WIN",
      winnerId: winnerSide === "w" ? game.whiteId : game.blackId,
    },
  });
  await finalizeRating(updated.id);
  return updated;
}

export async function resignGame(opts: { gameId: string; userId: string | null }) {
  const game = await prisma.game.findUnique({
    where: { id: opts.gameId },
    include: {
      white: { select: { id: true } },
      black: { select: { id: true } },
    },
  });
  if (!game || game.status !== "IN_PROGRESS") return { ok: false, reason: "not_active" as const };
  if (!opts.userId) return { ok: false, reason: "unauthorized" as const };
  const isWhite = game.whiteId === opts.userId;
  const isBlack = game.blackId === opts.userId;
  if (!isWhite && !isBlack) return { ok: false, reason: "forbidden" as const };
  const updated = await prisma.game.update({
    where: { id: opts.gameId },
    data: {
      status: "FINISHED",
      result: isWhite ? "BLACK_WIN" : "WHITE_WIN",
      winnerId: isWhite ? game.blackId : game.whiteId,
    },
  });
  await finalizeRating(updated.id);
  return { ok: true as const, game: updated };
}
