import { describe, it, expect } from "vitest";
import { updateRating, kFactor, expectedScore } from "@/lib/rating/elo";

describe("Elo rating", () => {
  it("kFactor drops after 30 games", () => {
    expect(kFactor(0)).toBe(40);
    expect(kFactor(29)).toBe(40);
    expect(kFactor(30)).toBe(20);
    expect(kFactor(200)).toBe(20);
  });
  it("expectedScore is symmetric around equal ratings", () => {
    expect(expectedScore(1500, 1500)).toBeCloseTo(0.5, 5);
  });
  it("win against weaker opponent gives smaller delta than win vs stronger", () => {
    const vsWeaker = updateRating({ selfRating: 1500, selfRd: 200, selfGames: 50, oppRating: 1200, oppRd: 200, score: 1 });
    const vsStronger = updateRating({ selfRating: 1500, selfRd: 200, selfGames: 50, oppRating: 1800, oppRd: 200, score: 1 });
    expect(vsWeaker.delta).toBeLessThan(vsStronger.delta);
  });
  it("loss against equal opponent subtracts a few points", () => {
    const r = updateRating({ selfRating: 1500, selfRd: 200, selfGames: 50, oppRating: 1500, oppRd: 200, score: 0 });
    expect(r.delta).toBeLessThan(0);
  });
});
