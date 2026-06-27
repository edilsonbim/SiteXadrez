// Stockfish bridge. Uses the WASM bundle from the `stockfish` package when
// the runtime supports it; otherwise falls back to the pure-JS heuristic
// engine (src/lib/ai/heuristic.ts).

import type { AiMoveRequest, AiMoveResponse } from "./heuristic";
import { pickHeuristicMove } from "./heuristic";
import { Chess } from "chess.js";

let stockfishSingleton: any = null;
let loadAttempted = false;
let loadFailed = false;

async function tryLoad(): Promise<any> {
  if (stockfishSingleton) return stockfishSingleton;
  if (loadFailed || loadAttempted) return null;
  loadAttempted = true;
  try {
    const mod: any = await import("stockfish/src/stockfish-nnue-16.js");
    const factory = mod?.default ?? mod;
    if (typeof factory !== "function") { loadFailed = true; return null; }
    stockfishSingleton = await new Promise((resolve, reject) => {
      try {
        const engine: any = factory();
        const ready = () => resolve(engine);
        engine.onmessage = (msg: string) => {
          if (typeof msg === "string" && msg.startsWith("uciok")) ready();
        };
        engine.postMessage("uci");
        setTimeout(() => reject(new Error("sf-timeout")), 4000);
      } catch (e) { reject(e); }
    });
    return stockfishSingleton;
  } catch {
    loadFailed = true;
    return null;
  }
}

function uciToSan(fen: string, uci: string): string {
  try {
    const c = new Chess(fen);
    const from = uci.slice(0, 2);
    const to = uci.slice(2, 4);
    const promotion = uci.length === 5 ? uci[4] : undefined;
    return c.move({ from, to, promotion } as any)?.san ?? uci;
  } catch { return uci; }
}

async function askStockfish(req: AiMoveRequest): Promise<AiMoveResponse | null> {
  const engine = await tryLoad();
  if (!engine) return null;
  return new Promise<AiMoveResponse | null>((resolve) => {
    const start = Date.now();
    let bestMove = "";
    let ponder: string | undefined;
    let evaluationCp: number | undefined;
    let depthReached = 0;
    const timer = setTimeout(() => { engine.onmessage = null; resolve(null); }, Math.max(req.level.moveTimeMs * 2, 1500));
    engine.onmessage = (msg: string) => {
      if (typeof msg !== "string") return;
      if (msg.startsWith("info") && msg.includes("depth")) {
        const d = /depth (\d+)/.exec(msg); if (d) depthReached = Math.max(depthReached, parseInt(d[1], 10));
        const s1 = /score cp (-?\d+)/.exec(msg); if (s1) evaluationCp = parseInt(s1[1], 10);
      }
      if (msg.startsWith("bestmove")) {
        clearTimeout(timer);
        const parts = msg.split(/\s+/);
        bestMove = parts[1] ?? "0000";
        ponder = parts[3];
        resolve({
          uci: bestMove,
          san: uciToSan(req.fen, bestMove),
          bestMove,
          ponder,
          evaluationCp,
          depthReached,
          timeMs: Date.now() - start,
        });
      }
    };
    try {
      engine.postMessage("ucinewgame");
      engine.postMessage(`setoption name Skill Level value ${req.level.skillLevel}`);
      engine.postMessage(`position fen ${req.fen}`);
      engine.postMessage(`go depth ${req.level.depth} movetime ${req.level.moveTimeMs}`);
    } catch {
      clearTimeout(timer); resolve(null);
    }
  });
}

export async function pickAiMove(req: AiMoveRequest): Promise<AiMoveResponse> {
  const sf = await askStockfish(req);
  if (sf) return sf;
  return pickHeuristicMove(req.fen, req.level);
}
