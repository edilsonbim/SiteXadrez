import { cn } from "@/lib/utils/cn";

export function RatingBadge({ rating, className }: { rating: number; className?: string }) {
  const tier = (() => {
    if (rating >= 2400) return { name: "Super", color: "#a371f7" };
    if (rating >= 2000) return { name: "Mestre", color: "#f5b041" };
    if (rating >= 1800) return { name: "Candidato", color: "#db6d28" };
    if (rating >= 1600) return { name: "A", color: "#3fb950" };
    if (rating >= 1400) return { name: "B", color: "#58a6ff" };
    if (rating >= 1200) return { name: "C", color: "#9ba6b3" };
    if (rating >= 1000) return { name: "D", color: "#9ba6b3" };
    return { name: "E", color: "#6e7681" };
  })();
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full bg-bg px-2.5 py-1 text-xs font-medium border border-line", className)}>
      <span className="h-2 w-2 rounded-full" style={{ background: tier.color }} />
      <span className="tabular-nums text-ink">{Math.round(rating)}</span>
      <span className="text-ink-soft">{tier.name}</span>
    </span>
  );
}
