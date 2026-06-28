import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { RatingBadge } from "@/components/ui/RatingBadge";
import { getLeaderboardPlayers } from "@/server/leaderboard";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const top = await getLeaderboardPlayers(50);
  return (
    <Card>
      <CardHeader><CardTitle>Ranking Rookary</CardTitle></CardHeader>
      <CardContent>
        {top.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-ink-soft">
            Nenhum jogador elegivel apareceu no ranking ainda.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-ink-soft text-xs uppercase">
              <tr><th className="text-left py-1">#</th><th className="text-left py-1">Jogador</th><th className="text-right py-1">Rating</th><th className="text-right py-1">Partidas</th><th className="text-right py-1">V/D/E</th></tr>
            </thead>
            <tbody>
              {top.map((u, i) => (
                <tr key={u.id} className="border-t border-line">
                  <td className="py-2 text-ink-soft">{i + 1}</td>
                  <td className="py-2 flex items-center gap-2">
                    {u.image ? (
                      <img
                        src={u.image}
                        alt={u.name ?? "Jogador"}
                        className="h-6 w-6 rounded-full object-cover bg-bg"
                      />
                    ) : (
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-line text-[10px] font-semibold text-ink-soft">
                        {(u.name?.[0] ?? "?").toUpperCase()}
                      </span>
                    )}
                    <span className="text-ink">{u.name ?? "Anonimo"}</span>
                  </td>
                  <td className="py-2 text-right"><RatingBadge rating={u.rating} /></td>
                  <td className="py-2 text-right text-ink-soft">{u.gamesPlayed}</td>
                  <td className="py-2 text-right text-ink-soft">{u.wins}/{u.losses}/{u.draws}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
