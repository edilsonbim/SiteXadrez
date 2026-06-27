import { describe, it, expect } from "vitest";
import { ChessEngine } from "@/lib/chess/engine";

describe("ChessEngine", () => {
  it("rejects illegal move", () => {
    const e = new ChessEngine();
    const r = e.applyUci("e2e5", { ply: 1, whiteTime: 600, blackTime: 600 });
    expect(r.ok).toBe(false);
  });

  it("accepts legal scholar mate", () => {
    const e = ChessEngine.fromFen("r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 4 4");
    const r = e.applyUci("f3f7", { ply: 9, whiteTime: 600, blackTime: 600 });
    expect(r.ok).toBe(true);
    expect(["WHITE_WIN","BLACK_WIN","DRAW"]).toContain(r.result);
  });

  it("detects checkmate in fool's mate", () => {
    const e = new ChessEngine();
    e.applyUci("f2f3", { ply: 1, whiteTime: 600, blackTime: 600 });
    e.applyUci("e7e5", { ply: 2, whiteTime: 600, blackTime: 600 });
    e.applyUci("g2g4", { ply: 3, whiteTime: 600, blackTime: 600 });
    const r = e.applyUci("d8h4", { ply: 4, whiteTime: 600, blackTime: 600 });
    expect(["WHITE_WIN","BLACK_WIN","DRAW"]).toContain(r.result);
  });
});


