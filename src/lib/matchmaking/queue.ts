// Matchmaking queue: only matches players actively searching and within
// the configured rating window.

export interface QueueEntry {
  userId: string;
  rating: number;
  joinedAt: number;
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

const MATCH_WINDOW = 200;

export function tryMatch(entry: QueueEntry): QueueEntry | null {
  const best = WAITING
    .map((e) => ({ entry: e, diff: Math.abs(e.rating - entry.rating) }))
    .filter((x) => x.entry.userId !== entry.userId && x.diff <= MATCH_WINDOW)
    .sort((a, b) => a.diff - b.diff)[0];
  if (!best) return null;
  dequeue(best.entry.userId);
  return best.entry;
}
