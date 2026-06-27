import { Chess, Move as CjMove } from "chess.js";
import type { MoveRecord, Side, GameResultKind } from "./types";

export interface ApplyResult {
  ok: boolean;
  reason?: string;
  move?: MoveRecord;
  result?: GameResultKind;
}

export class ChessEngine {
  private chess: Chess;
  constructor(fen?: string) {
    this.chess = fen ? new Chess(fen) : new Chess();
  }

  static fromFen(fen: string) { return new ChessEngine(fen); }

  fen(): string { return this.chess.fen(); }
  pgn(): string { return this.chess.pgn(); }
  turn(): Side { return this.chess.turn(); }
  history(): string[] { return this.chess.history(); }
  moveNumber(): number { return this.chess.moveNumber(); }
  isGameOver(): boolean { return this.chess.isGameOver(); }
  inCheck(): boolean { return this.chess.inCheck(); }
  inCheckmate(): boolean { return this.chess.isCheckmate(); }
  inStalemate(): boolean { return this.chess.isStalemate(); }
  inDraw(): boolean { return this.chess.isDraw(); }
  inThreefold(): boolean { return this.chess.isThreefoldRepetition(); }
  insufficientMaterial(): boolean { return this.chess.isInsufficientMaterial(); }

  legalMoves(square?: string): CjMove[] {
    return this.chess.moves({ square: square as any, verbose: true }) as unknown as CjMove[];
  }

  resultKind(): GameResultKind {
    if (this.chess.isCheckmate()) return this.chess.turn() === "b" ? "WHITE_WIN" : "BLACK_WIN";
    if (this.chess.isDraw() || this.chess.isStalemate() || this.chess.isThreefoldRepetition() || this.chess.isInsufficientMaterial())
      return "DRAW";
    return "ONGOING";
  }

  applyMove(args: { from: string; to: string; promotion?: string }, ctx: { ply: number; whiteTime: number; blackTime: number; byUserId?: string | null }): ApplyResult {
    try {
      const result = this.chess.move({ from: args.from, to: args.to, promotion: (args.promotion ?? "q") as any });
      if (!result) return { ok: false, reason: "illegal_move" };
      const ply = ctx.ply + 1;
      const rec: MoveRecord = {
        ply,
        san: result.san,
        uci: result.from + result.to + (result.promotion ?? ""),
        fenAfter: this.chess.fen(),
        whiteTime: ctx.whiteTime,
        blackTime: ctx.blackTime,
        byUserId: ctx.byUserId ?? null,
      };
      return { ok: true, move: rec, result: this.resultKind() };
    } catch (e: any) {
      return { ok: false, reason: e?.message ?? "invalid_move" };
    }
  }

  applyUci(uci: string, ctx: { ply: number; whiteTime: number; blackTime: number; byUserId?: string | null }): ApplyResult {
    if (uci.length < 4) return { ok: false, reason: "bad_uci" };
    const from = uci.slice(0, 2);
    const to = uci.slice(2, 4);
    const promotion = uci.length === 5 ? uci[4] : undefined;
    return this.applyMove({ from, to, promotion }, ctx);
  }

  parseUciToSquares(uci: string) {
    if (uci.length < 4) return null;
    return { from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci.length === 5 ? uci[4] : "q" };
  }
}
