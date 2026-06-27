import { RatingBadge } from "@/components/ui/RatingBadge";
import { engineForRating } from "@/lib/chess/types";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/server/auth";
import { Button } from "@/components/ui/Button";

export default async function Home() {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  const me = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;
  const online = await prisma.game.count({ where: { status: "IN_PROGRESS" } });

  return (
    <div className="space-y-10">
      <section className="grid gap-6 md:grid-cols-2 md:items-center">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Jogue xadrez online, com <span className="text-accent">rating real</span>.
          </h1>
          <p className="text-ink-soft text-lg max-w-prose">
            Entre com sua conta Google, ganhe um rating inicial e dispute partidas contra a maquina
            (com nivel ajustado ao seu rating) ou contra outros jogadores via matchmaking.
          </p>
          <div className="flex flex-wrap gap-3">
            {me ? (
              <>
                <Link href="/lobby"><Button size="lg">Abrir Lobby</Button></Link>
                <Link href="/profile"><Button variant="secondary" size="lg">Meu perfil</Button></Link>
              </>
            ) : (
              <Link href="/login"><Button size="lg">Entrar com Google</Button></Link>
            )}
          </div>
        </div>
        <div className="rounded-2xl bg-bg-card border border-line p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-ink-soft">Seu rating</span>
            {me ? <RatingBadge rating={me.rating} /> : <span className="text-ink-soft">—</span>}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-ink-soft">Partidas em andamento</span>
            <span className="text-ink tabular-nums">{online}</span>
          </div>
          {me && (
            <div className="flex items-center justify-between">
              <span className="text-ink-soft">Nivel da IA</span>
              <span className="text-ink">{engineForRating(me.rating).label}</span>
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <FeatureCard title="Vs IA" body="Motor Stockfish com profundidade e skill level ajustados automaticamente ao seu rating." />
        <FeatureCard title="Vs Players" body="Matchmaking por rating com janela que expande conforme o tempo de espera." />
        <FeatureCard title="PGN e FEN" body="Cada partida gera PGN completo, replay possivel e historico de rating por jogo." />
      </section>
    </div>
  );
}

function FeatureCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl bg-bg-card border border-line p-5">
      <h3 className="font-semibold text-ink">{title}</h3>
      <p className="text-ink-soft text-sm mt-2">{body}</p>
    </div>
  );
}
