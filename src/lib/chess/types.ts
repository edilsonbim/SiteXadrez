// Chess core types and constants used across server/client.

export type Side = "w" | "b";
export type PieceSymbol = "p" | "n" | "b" | "r" | "q" | "k";

export interface SquareIndex {
  from: number;
  to: number;
  promotion?: Exclude<PieceSymbol, "p" | "k">;
}

export interface MoveRecord {
  ply: number;
  san: string;
  uci: string;
  fenAfter: string;
  whiteTime: number;
  blackTime: number;
  byUserId?: string | null;
}

export type GameResultKind = "WHITE_WIN" | "BLACK_WIN" | "DRAW" | "ONGOING";

export interface EngineLevel {
  id: string;
  label: string;
  description: string;
  minRating: number;
  maxRating: number;
  depth: number;
  skillLevel: number;
  randomness: number;
  moveTimeMs: number;
}

export const ENGINES: EngineLevel[] = [
  { id: "pawn",   label: "Peao",   description: "Iniciante, comete erros bobos.",         minRating: 0,    maxRating: 899,  depth: 1,  skillLevel: 0,  randomness: 250, moveTimeMs: 60 },
  { id: "knight", label: "Cavalo", description: "Brincalhao, ainda perde material.",      minRating: 900,  maxRating: 1099, depth: 4,  skillLevel: 4,  randomness: 150, moveTimeMs: 120 },
  { id: "bishop", label: "Bispo",  description: "Solido, conhece aberturas basicas.",     minRating: 1100, maxRating: 1299, depth: 7,  skillLevel: 8,  randomness: 90,  moveTimeMs: 220 },
  { id: "rook",   label: "Torre",  description: "Tatico, joga finais limpos.",            minRating: 1300, maxRating: 1499, depth: 10, skillLevel: 12, randomness: 50,  moveTimeMs: 380 },
  { id: "queen",  label: "Dama",   description: "Posicional, calcula variantes longas.",  minRating: 1500, maxRating: 1799, depth: 14, skillLevel: 16, randomness: 20,  moveTimeMs: 700 },
  { id: "king",   label: "Rei",    description: "Brutal, motor completo.",               minRating: 1800, maxRating: 9999, depth: 18, skillLevel: 20, randomness: 0,   moveTimeMs: 1400 },
];

export const INITIAL_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export function engineForRating(rating: number): EngineLevel {
  for (const e of ENGINES) if (rating >= e.minRating && rating <= e.maxRating) return e;
  return ENGINES[ENGINES.length - 1];
}

export function clampRatingDelta(delta: number): number {
  if (!Number.isFinite(delta)) return 0;
  if (delta > 400) return 400;
  if (delta < -400) return -400;
  return Math.round(delta);
}
