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
const CENTER_BONUS = new Set(["d4", "e4", "d5", "e5"]);
const EXTENDED_CENTER = new Set([
  "c3", "d3", "e3", "f3",
  "c4", "d4", "e4", "f4",
  "c5", "d5", "e5", "f5",
  "c6", "d6", "e6", "f6",
]);
const PIECE_SQUARE_BONUS: Record<string, number> = {
  p: 8,
  n: 14,
  b: 12,
  r: 6,
  q: 4,
  k: 0,
};

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

function positionalScore(chess: Chess): number {
  let s = 0;
  const board = chess.board();
  for (let rank = 0; rank < board.length; rank += 1) {
    for (let file = 0; file < board[rank].length; file += 1) {
      const sq = board[rank]?.[file];
      if (!sq) continue;
      const square = `${String.fromCharCode(97 + file)}${8 - rank}`;
      let bonus = 0;
      if (CENTER_BONUS.has(square)) bonus += 18;
      else if (EXTENDED_CENTER.has(square)) bonus += 8;
      bonus += PIECE_SQUARE_BONUS[sq.type] ?? 0;
      if (sq.type === "p") {
        const advance = sq.color === "w" ? 6 - rank : rank - 1;
        bonus += Math.max(0, advance) * 3;
      }
      s += sq.color === "w" ? bonus : -bonus;
    }
  }
  return s;
}

function evaluate(chess: Chess): number {
  const activity = chess.moves().length * 2;
  const signedActivity = chess.turn() === "w" ? activity : -activity;
  return materialScore(chess) + positionalScore(chess) + signedActivity;
}

function orderedMoves(chess: Chess) {
  const moves = chess.moves({ verbose: true }) as any[];
  return moves.sort((a, b) => {
    const ca =
      (a.captured ? PIECE_VALUE[a.captured] - PIECE_VALUE[a.piece] / 10 : 0) +
      (a.isPromotion ? 800 : 0) +
      (a.san?.includes("+") ? 40 : 0) +
      (CENTER_BONUS.has(a.to) ? 25 : EXTENDED_CENTER.has(a.to) ? 10 : 0);
    const cb =
      (b.captured ? PIECE_VALUE[b.captured] - PIECE_VALUE[b.piece] / 10 : 0) +
      (b.isPromotion ? 800 : 0) +
      (b.san?.includes("+") ? 40 : 0) +
      (CENTER_BONUS.has(b.to) ? 25 : EXTENDED_CENTER.has(b.to) ? 10 : 0);
    return cb - ca;
  });
}

function alphaBeta(chess: Chess, depth: number, alpha: number, beta: number, sign: 1 | -1): number {
  if (depth === 0 || chess.isGameOver()) {
    let s = evaluate(chess);
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

  const threshold = Math.max(6, Math.floor(level.randomness / 12));
  const candidateMoves = moves.filter((m) => {
    chess.move({ from: m.from, to: m.to, promotion: m.promotion });
    const score = alphaBeta(chess, depth - 1, -Infinity, Infinity, (-sign) as (1 | -1));
    chess.undo();
    return Math.abs(score - bestScore) <= threshold;
  });

  const pool = candidateMoves.length > 0 ? candidateMoves : bestMoves;
  const chosen = pickRandom && pool.length > 1 ? pool[Math.floor(Math.random() * pool.length)] : pool[0];
  return {
    uci: chosen.from + chosen.to + (chosen.promotion ?? ""),
    san: chosen.san,
    bestMove: chosen.from + chosen.to,
    evaluationCp: bestScore,
    depthReached: depth,
    timeMs: Date.now() - start,
  };
}
