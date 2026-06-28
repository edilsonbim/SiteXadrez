import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { RatingBadge } from "@/components/ui/RatingBadge";
import { Button } from "@/components/ui/Button";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const me = await safeUser((session.user as any).id, session.user);
  if (!me) redirect("/login");
  const isGuest = me.isGuest;

  // Guest: simple landing card explaining the limitations, with a CTA
  // to register. No rating, no history — those would not persist past
  // the guest session anyway.
  if (isGuest) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Conta temporária ativa</CardTitle>
            <p className="text-ink-soft text-sm">
              Seu acesso atual é temporário. As partidas casuais continuam funcionando, mas o histórico não é permanente.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-ink">
              <b>{me.name}</b> · {me.email}
            </p>
            <ul className="text-sm text-ink-soft list-disc pl-5 space-y-1">
              <li>Partidas contra IA continuam disponíveis.</li>
              <li>Partidas PVP casuais não atualizam rating.</li>
              <li>Para histórico completo, crie um perfil permanente.</li>
            </ul>
            <div className="flex gap-2 pt-2">
              <Link href="/register" className="inline-flex h-10 items-center rounded-md bg-accent px-4 text-sm font-medium text-black hover:bg-accent-soft">
                Criar conta
              </Link>
              <Link href="/lobby">
                <Button variant="secondary">Ir para a mesa</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
        <CardHeader><CardTitle>Partidas recentes</CardTitle></CardHeader>
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
                  <span className={won ? "text-good" : draw ? "text-ink-soft" : "text-bad"}>{won ? "vitória" : draw ? "empate" : "derrota"}</span>
                  <span className="text-ink-soft">{new Date(g.updatedAt).toLocaleDateString("pt-BR")}</span>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Histórico de rating</CardTitle></CardHeader>
        <CardContent>
          {history.length === 0 && <p className="text-ink-soft text-sm">Sem histórico.</p>}
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
        <Link href="/lobby"><Button variant="secondary">Voltar à mesa</Button></Link>
      </div>
    </div>
  );
}

async function safeUser(id: string, sessionUser: any) {
  try {
    const me = await prisma.user.findUnique({ where: { id } });
    if (me) return me;
  } catch {
    // fall through to session-only view
  }

  return {
    id,
    name: sessionUser.name ?? "Jogador",
    email: sessionUser.email ?? "sem-email",
    image: sessionUser.image ?? null,
    isGuest: sessionUser.isGuest === true,
    rating: sessionUser.rating ?? 1200,
    rd: 350,
    volatility: 0.06,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    draws: 0,
  } as any;
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md bg-bg p-3 border border-line">
      <p className="text-ink-soft text-xs uppercase tracking-wide">{label}</p>
      <p className="text-ink text-lg tabular-nums">{value}</p>
    </div>
  );
}
