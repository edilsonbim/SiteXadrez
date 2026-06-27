// Glicko-2 inspired rating update. Simplified for the lobby:
//   - Winner's expected score uses standard Elo formula with the
//     opponent rating (no full RD/v volatility step, but those fields
//     are stored for future refinement).
//   - K-factor is dynamic: 40 for new players (<30 games), else 20.

export interface RatingInputs {
  selfRating: number;
  selfRd: number;
  selfGames: number;
  oppRating: number;
  oppRd: number;
  score: number; // 1 win, 0.5 draw, 0 loss
}

export interface RatingUpdate {
  rating: number;
  rd: number;
  delta: number;
}

export function expectedScore(self: number, opp: number): number {
  return 1 / (1 + Math.pow(10, (opp - self) / 400));
}

export function kFactor(gamesPlayed: number): number {
  return gamesPlayed < 30 ? 40 : 20;
}

export function updateRating(input: RatingInputs): RatingUpdate {
  const e = expectedScore(input.selfRating, input.oppRating);
  const k = kFactor(input.selfGames);
  const delta = Math.round(k * (input.score - e));
  // RD decays slowly with each game; clamp to [30, 350]
  const rd = Math.min(350, Math.max(30, input.selfRd * 0.97 + 8));
  return { rating: input.selfRating + delta, rd, delta };
}
