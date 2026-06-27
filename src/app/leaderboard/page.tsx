import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { RatingBadge } from "@/components/ui/RatingBadge";
import { ensureDemoPlayers } from "@/server/demo-players";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  await ensureDemoPlayers();
  const top = await prisma.user.findMany({
    where: { isGuest: false },
    orderBy: [{ rating: "desc" }],
    take: 50,
    select: { id: true, name: true, image: true, rating: true, gamesPlayed: true, wins: true, losses: true, draws: true },
  });
  return (
      <Card>
        <CardHeader><CardTitle>Ranking Rookary</CardTitle></CardHeader>
      <CardContent>
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
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.onerror = null;
                        target.style.display = "none";
                      }}
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
      </CardContent>
    </Card>
  );
}
