"use client";

export interface MoveDTO { ply: number; san: string; uci: string; fenAfter: string }

export function MoveList({ moves }: { moves: MoveDTO[] }) {
  if (moves.length === 0) return <p className="text-sm text-ink-soft">Sem lances ainda.</p>;
  const pairs: Array<{ num: number; w?: MoveDTO; b?: MoveDTO }> = [];
  for (let i = 0; i < moves.length; i += 2) pairs.push({ num: i / 2 + 1, w: moves[i], b: moves[i + 1] });
  return (
    <ol className="text-sm font-mono space-y-1 max-h-96 overflow-auto pr-2">
      {pairs.map((p) => (
        <li key={p.num} className="flex gap-3 rounded-xl px-2 py-1 hover:bg-white/5 transition-colors">
          <span className="w-6 text-right text-ink-soft">{p.num}.</span>
          <span className="flex-1 text-ink">{p.w?.san ?? ""}</span>
          <span className="flex-1 text-ink-soft">{p.b?.san ?? ""}</span>
        </li>
      ))}
    </ol>
  );
}
