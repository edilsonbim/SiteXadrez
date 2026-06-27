import type { EngineLevel } from "../chess/types";

export interface AiMoveRequest {
  fen: string;
  level: EngineLevel;
  signal?: AbortSignal;
}

export interface AiMoveResponse {
  uci: string;
  san: string;
  bestMove: string;
  ponder?: string;
  evaluationCp?: number;
  depthReached: number;
  nodes?: number;
  timeMs: number;
}

import { Chess } from "chess.js";

const PIECE_VALUE: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

function materialScore(chess: Chess): number {
  let s = 0;
  const board = chess.board();
  for (const row of board) {
    for (const sq of row) {
      if (!sq) continue;
      const v = PIECE_VALUE[sq.type] ?? 0;
      s += sq.color === "w" ? v : -v;
    }
  }
  return s;
}

function orderedMoves(chess: Chess) {
  const moves = chess.moves({ verbose: true }) as any[];
  return moves.sort((a, b) => {
    const ca = a.captured ? PIECE_VALUE[a.captured] - PIECE_VALUE[a.piece] / 10 : 0;
    const cb = b.captured ? PIECE_VALUE[b.captured] - PIECE_VALUE[b.piece] / 10 : 0;
    return cb - ca;
  });
}

function alphaBeta(chess: Chess, depth: number, alpha: number, beta: number, sign: 1 | -1): number {
  if (depth === 0 || chess.isGameOver()) {
    let s = materialScore(chess);
    if (chess.isCheckmate()) s = sign === 1 ? -99999 : 99999;
    if (chess.isDraw() || chess.isStalemate()) s = 0;
    return sign * s;
  }
  const moves = orderedMoves(chess);
  if (sign === 1) {
    let best = -Infinity;
    for (const m of moves) {
      chess.move({ from: m.from, to: m.to, promotion: m.promotion });
      const v = alphaBeta(chess, depth - 1, alpha, beta, (-1) as -1);
      chess.undo();
      if (v > best) best = v;
      if (best > alpha) alpha = best;
      if (alpha >= beta) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const m of moves) {
      chess.move({ from: m.from, to: m.to, promotion: m.promotion });
      const v = alphaBeta(chess, depth - 1, alpha, beta, 1 as 1);
      chess.undo();
      if (v < best) best = v;
      if (best < beta) beta = best;
      if (alpha >= beta) break;
    }
    return best;
  }
}

export function pickHeuristicMove(fen: string, level: EngineLevel): AiMoveResponse {
  const start = Date.now();
  const chess = new Chess(fen);
  const sign: 1 | -1 = chess.turn() === "w" ? 1 : -1;
  const depth = Math.min(Math.max(level.depth, 1), 4);
  const moves = orderedMoves(chess);
  if (moves.length === 0) return { uci: "0000", san: "", bestMove: "0000", depthReached: 0, timeMs: 0 };

  const pickRandom = Math.random() * 100 < level.randomness / 5;
  let bestScore: number = sign === 1 ? -Infinity : Infinity;
  let bestMoves: any[] = [];

  for (const m of moves) {
    chess.move({ from: m.from, to: m.to, promotion: m.promotion });
    const score = alphaBeta(chess, depth - 1, -Infinity, Infinity, (-sign) as (1 | -1));
    chess.undo();
    if (sign === 1 ? score > bestScore : score < bestScore) {
      bestScore = score;
      bestMoves = [m];
    } else if (score === bestScore) {
      bestMoves.push(m);
    }
  }

  const chosen = pickRandom && bestMoves.length > 1 ? bestMoves[Math.floor(Math.random() * bestMoves.length)] : bestMoves[0];
  return {
    uci: chosen.from + chosen.to + (chosen.promotion ?? ""),
    san: chosen.san,
    bestMove: chosen.from + chosen.to,
    evaluationCp: bestScore,
    depthReached: depth,
    timeMs: Date.now() - start,
  };
}
