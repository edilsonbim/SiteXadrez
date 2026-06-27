import { describe, it, expect } from "vitest";
import { pickHeuristicMove } from "@/lib/ai/heuristic";
import { engineForRating } from "@/lib/chess/types";

describe("AI heuristic", () => {
  it("returns a legal move from the initial position", () => {
    const level = engineForRating(1200);
    const out = pickHeuristicMove("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", level);
    expect(out.uci).toMatch(/^[a-h][1-8][a-h][1-8][qrbn]?$/);
  });
  it("captures a hanging queen with Qxf1 when available", () => {
    const fen = "rnb1kbnr/pppppppp/8/8/8/8/PPPP1PPP/RNBQ1qNK w KQkq - 0 1";
    const level = engineForRating(1500);
    const out = pickHeuristicMove(fen, level);
    // The black queen on f1 can be captured by Qxf1. Heuristic should prefer
    // this capture over a quiet pawn push.
    expect(out.uci).toBe("d1f1");
  });
});
