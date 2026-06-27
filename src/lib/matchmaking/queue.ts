// Matchmaking queue: matches a waiting player with the closest opponent
// within a rating window that grows over time (classic Elo queue).

export interface QueueEntry {
  userId: string;
  rating: number;
  joinedAt: number;
  fallbackAt: number;
}

const WAITING: QueueEntry[] = [];

export function enqueue(entry: QueueEntry) {
  const i = WAITING.findIndex((e) => e.userId === entry.userId);
  if (i !== -1) WAITING.splice(i, 1);
  WAITING.push(entry);
}

export function dequeue(userId: string) {
  const i = WAITING.findIndex((e) => e.userId === userId);
  if (i !== -1) WAITING.splice(i, 1);
}

export function snapshot(): QueueEntry[] {
  return WAITING.slice();
}

export function clear() {
  WAITING.length = 0;
}

export function getEntry(userId: string) {
  return WAITING.find((e) => e.userId === userId) ?? null;
}

const BASE_WINDOW = 100;
const WINDOW_PER_SECOND = 15;
const MAX_WINDOW = 600;

export function tryMatch(entry: QueueEntry): QueueEntry | null {
  // Caller (entry) is NOT in the queue yet; we only inspect existing entries.
  const waited = Math.floor((Date.now() - entry.joinedAt) / 1000);
  const win = Math.min(MAX_WINDOW, BASE_WINDOW + waited * WINDOW_PER_SECOND);
  const best = WAITING
    .map((e) => ({ entry: e, diff: Math.abs(e.rating - entry.rating) }))
    .filter((x) => x.diff <= win)
    .sort((a, b) => a.diff - b.diff)[0];
  if (!best) return null;
  dequeue(best.entry.userId);
  return best.entry;
}

export function shouldFallback(entry: QueueEntry, now = Date.now()) {
  return now >= entry.fallbackAt;
}
