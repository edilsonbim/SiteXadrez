import { describe, it, expect } from "vitest";
import { enqueue, dequeue, tryMatch, snapshot, clear } from "@/lib/matchmaking/queue";

describe("Matchmaking queue", () => {
  it("matches closest within window", () => {
    clear();
    enqueue({ userId: "b", rating: 1450, joinedAt: Date.now() });
    enqueue({ userId: "c", rating: 1700, joinedAt: Date.now() });
    const opp = tryMatch({ userId: "a", rating: 1500, joinedAt: Date.now() });
    expect(opp?.userId).toBe("b");
    expect(snapshot().length).toBe(1); // "c" still waiting
  });
  it("does not match when difference exceeds window", () => {
    clear();
    enqueue({ userId: "y", rating: 2200, joinedAt: Date.now() });
    const opp = tryMatch({ userId: "x", rating: 1500, joinedAt: Date.now() });
    expect(opp).toBeNull();
  });
});
