import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { RatingBadge } from "@/components/ui/RatingBadge";
import { Button } from "@/components/ui/Button";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const me = await prisma.user.findUnique({ where: { id: (session.user as any).id } });
  if (!me) redirect("/login");
  const history = await prisma.ratingHistory.findMany({ where: { userId: me.id }, orderBy: { createdAt: "desc" }, take: 25 });
  const recent = await prisma.game.findMany({
    where: { OR: [{ whiteId: me.id }, { blackId: me.id }] },
    orderBy: { updatedAt: "desc" },
    take: 10,
    include: { white: true, black: true },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>{me.name ?? me.email}</CardTitle>
            <p className="text-ink-soft text-sm">{me.email}</p>
          </div>
          <RatingBadge rating={me.rating} />
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
          <Stat label="Rating" value={Math.round(me.rating)} />
          <Stat label="RD" value={Math.round(me.rd)} />
          <Stat label="Partidas" value={me.gamesPlayed} />
          <Stat label="V / D / E" value={`${me.wins} / ${me.losses} / ${me.draws}`} />
          <Stat label="Winrate" value={`${me.gamesPlayed ? Math.round((me.wins / me.gamesPlayed) * 100) : 0}%`} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Ultimas partidas</CardTitle></CardHeader>
        <CardContent>
          {recent.length === 0 && <p className="text-ink-soft text-sm">Sem partidas ainda.</p>}
          <ul className="divide-y divide-line">
            {recent.map((g) => {
              const opp = g.whiteId === me.id ? g.black : g.white;
              const color = g.whiteId === me.id ? "brancas" : "pretas";
              const won = g.winnerId === me.id;
              const draw = g.result === "DRAW";
              return (
                <li key={g.id} className="py-2 flex items-center justify-between text-sm">
                  <span className="text-ink-soft">{g.mode === "PVE" ? "vs IA" : `vs ${opp?.name ?? "?"}`} ({color})</span>
                  <span className={won ? "text-good" : draw ? "text-ink-soft" : "text-bad"}>{won ? "vitoria" : draw ? "empate" : "derrota"}</span>
                  <span className="text-ink-soft">{new Date(g.updatedAt).toLocaleDateString("pt-BR")}</span>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Variacao de rating</CardTitle></CardHeader>
        <CardContent>
          {history.length === 0 && <p className="text-ink-soft text-sm">Sem historico.</p>}
          <ul className="space-y-1 text-sm font-mono">
            {history.map((h) => (
              <li key={h.id} className="flex justify-between">
                <span className="text-ink-soft">{new Date(h.createdAt).toLocaleString("pt-BR")}</span>
                <span className="text-ink">{Math.round(h.rating)}</span>
                <span className={h.delta > 0 ? "text-good" : h.delta < 0 ? "text-bad" : "text-ink-soft"}>{h.delta > 0 ? "+" : ""}{h.delta}</span>
                <span className="text-ink-soft">{h.reason}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div>
        <Button variant="secondary" onClick={() => location.assign("/lobby")}>Voltar ao lobby</Button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md bg-bg p-3 border border-line">
      <p className="text-ink-soft text-xs uppercase tracking-wide">{label}</p>
      <p className="text-ink text-lg tabular-nums">{value}</p>
    </div>
  );
}
