// Server-side game service. Persists via Prisma, drives clocks, validates
// moves server-authoritatively, and applies rating updates at game end.

import { prisma } from "@/lib/prisma";
import { ChessEngine } from "@/lib/chess/engine";
import { engineForRating } from "@/lib/chess/types";
import { pickAiMove } from "@/lib/ai/stockfish";
import { updatePvpRatingByRule, updateRatingForOutcome } from "@/lib/rating/elo";

type ResultKind = "WHITE_WIN" | "BLACK_WIN" | "DRAW";
type ClockState = { whiteTime: number; blackTime: number; expiredSide: "w" | "b" | null };
type ActiveGameLookup = { id: string; mode: string } | null;

export function getClockState(game: { fen: string; whiteTime: number; blackTime: number; updatedAt: Date }): ClockState {
  const turn = game.fen.split(" ")[1] === "b" ? "b" : "w";
  const elapsed = Math.max(0, Math.floor((Date.now() - game.updatedAt.getTime()) / 1000));
  const whiteTime = turn === "w" ? Math.max(0, game.whiteTime - elapsed) : game.whiteTime;
  const blackTime = turn === "b" ? Math.max(0, game.blackTime - elapsed) : game.blackTime;
  const expiredSide = whiteTime <= 0 ? "w" : blackTime <= 0 ? "b" : null;
  return { whiteTime, blackTime, expiredSide };
}

async function finishByTimeout(gameId: string, loserSide: "w" | "b") {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      white: { select: { id: true, rating: true, rd: true, gamesPlayed: true, wins: true, losses: true, draws: true, isGuest: true } },
      black: { select: { id: true, rating: true, rd: true, gamesPlayed: true, wins: true, losses: true, draws: true, isGuest: true } },
    },
  });
  if (!game || game.status !== "IN_PROGRESS") return null;
  const updated = await prisma.game.update({
    where: { id: gameId },
    data: {
      status: "FINISHED",
      result: loserSide === "w" ? "BLACK_WIN" : "WHITE_WIN",
      winnerId: loserSide === "w" ? game.blackId : game.whiteId,
    },
  });
  await finalizeRating(updated.id);
  return updated;
}

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

export async function playMove(opts: { gameId: string; userId: string | null; side: "w" | "b"; uci: string }) {
  const game = await prisma.game.findUnique({ where: { id: opts.gameId }, include: { moves: true } });
  if (!game) return { ok: false, reason: "not_found" as const };
  if (game.status !== "IN_PROGRESS") return { ok: false, reason: "finished" as const };
  const clockState = getClockState(game);
  if (clockState.expiredSide) {
    await finishByTimeout(game.id, clockState.expiredSide);
    return { ok: false, reason: "timeout" as const };
  }
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
  const clockState = getClockState(game);
  if (clockState.expiredSide) {
    await finishByTimeout(game.id, clockState.expiredSide);
    return { ok: false, reason: "timeout" as const };
  }
  const humanUserId = game.whiteId ?? game.blackId;
  if (!humanUserId) return { ok: false, reason: "no_user" as const };
  const user = await prisma.user.findUnique({ where: { id: humanUserId } });
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
  const existingEntries = await prisma.ratingHistory.count({ where: { gameId: game.id } });
  if (existingEntries > 0) return { ok: true, skipped: "already_applied" as const };
  const updates: Array<Promise<any>> = [];
  if (game.mode === "PVE" && game.white) {
    // PvE never counts guest rating: if the human is a guest, skip.
    if (!game.white.isGuest) {
      const w = game.white;
      const outcome = game.result === "WHITE_WIN" ? "win" : game.result === "DRAW" ? "draw" : "loss";
      const u = updateRatingForOutcome({ selfRating: w.rating, selfRd: w.rd, selfGames: w.gamesPlayed, oppRating: engineForRating(w.rating).minRating + 200, oppRd: 200, outcome });
      updates.push(prisma.user.update({ where: { id: w.id }, data: { rating: u.rating, rd: u.rd, gamesPlayed: w.gamesPlayed + 1, wins: w.wins + (outcome === "win" ? 1 : 0), losses: w.losses + (outcome === "loss" ? 1 : 0), draws: w.draws + (outcome === "draw" ? 1 : 0) } }));
      updates.push(prisma.ratingHistory.create({ data: { userId: w.id, gameId: game.id, rating: u.rating, rd: u.rd, delta: u.delta, reason: outcome === "win" ? "game_win" : outcome === "loss" ? "game_loss" : "game_draw" } }));
    }
  }
  if (game.mode === "PVP" && game.white && game.black) {
    // Casual match if either side is a guest: no rating changes, no history.
    if (game.white.isGuest || game.black.isGuest) {
      return { ok: true, casual: true };
    }
    const w = game.white, b = game.black;
    const whiteOutcome = game.result === "WHITE_WIN" ? "win" : game.result === "DRAW" ? "draw" : "loss";
    const blackOutcome = game.result === "BLACK_WIN" ? "win" : game.result === "DRAW" ? "draw" : "loss";
    const uw = updatePvpRatingByRule({ selfRating: w.rating, selfRd: w.rd, selfGames: w.gamesPlayed, oppRating: b.rating, oppRd: b.rd, outcome: whiteOutcome });
    const ub = updatePvpRatingByRule({ selfRating: b.rating, selfRd: b.rd, selfGames: b.gamesPlayed, oppRating: w.rating, oppRd: w.rd, outcome: blackOutcome });
    updates.push(prisma.user.update({ where: { id: w.id }, data: { rating: uw.rating, rd: uw.rd, gamesPlayed: w.gamesPlayed + 1, wins: w.wins + (whiteOutcome === "win" ? 1 : 0), losses: w.losses + (whiteOutcome === "loss" ? 1 : 0), draws: w.draws + (whiteOutcome === "draw" ? 1 : 0) } }));
    updates.push(prisma.user.update({ where: { id: b.id }, data: { rating: ub.rating, rd: ub.rd, gamesPlayed: b.gamesPlayed + 1, wins: b.wins + (blackOutcome === "win" ? 1 : 0), losses: b.losses + (blackOutcome === "loss" ? 1 : 0), draws: b.draws + (blackOutcome === "draw" ? 1 : 0) } }));
    updates.push(prisma.ratingHistory.create({ data: { userId: w.id, gameId: game.id, rating: uw.rating, rd: uw.rd, delta: uw.delta, reason: whiteOutcome === "win" ? "game_win" : whiteOutcome === "loss" ? "game_loss" : "game_draw" } }));
    updates.push(prisma.ratingHistory.create({ data: { userId: b.id, gameId: game.id, rating: ub.rating, rd: ub.rd, delta: ub.delta, reason: blackOutcome === "win" ? "game_win" : blackOutcome === "loss" ? "game_loss" : "game_draw" } }));
  }
  await Promise.all(updates);
  return { ok: true };
}

export async function finalizeTimeout(gameId: string, loserSide: "w" | "b") {
  return finishByTimeout(gameId, loserSide);
}

export async function getActiveGameForUser(userId: string): Promise<ActiveGameLookup> {
  const candidate = await prisma.game.findFirst({
    where: {
      status: "IN_PROGRESS",
      OR: [{ whiteId: userId }, { blackId: userId }],
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      mode: true,
      status: true,
      fen: true,
      whiteTime: true,
      blackTime: true,
      updatedAt: true,
    },
  });

  if (!candidate) return null;

  const clockState = getClockState(candidate);
  if (clockState.expiredSide) {
    await finalizeTimeout(candidate.id, clockState.expiredSide);
    return null;
  }

  return { id: candidate.id, mode: candidate.mode };
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
