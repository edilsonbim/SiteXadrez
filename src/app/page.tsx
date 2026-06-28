import { RatingBadge } from "@/components/ui/RatingBadge";
import { engineForRating } from "@/lib/chess/types";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/server/auth";
import { Button } from "@/components/ui/Button";

export default async function Home() {
  const session = await safeAuth();
  const userId = (session?.user as any)?.id as string | undefined;
  const me = userId ? await safeUser(userId) : null;
  const online = await safeOnlineCount();

  return (
    <div className="space-y-8 enter-rise">
      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-ink-soft animate-float-slow">
            <span className="h-2 w-2 rounded-full bg-accent shadow-glow" />
            Edição atual
          </div>
          <h1 className="max-w-3xl font-display text-5xl leading-[0.95] tracking-tight text-ink md:text-6xl">
            Rookary Chess com leitura clara, torneio sério e navegação direta.
          </h1>
          <p className="max-w-2xl text-base md:text-lg leading-8 text-ink-soft">
            Uma mesa de xadrez com acabamento clássico, transições suaves e leitura visual de alto contraste.
          </p>
          <div className="flex flex-wrap gap-3">
            {me ? (
              <>
                <Link href="/lobby"><Button size="lg">Jogue agora</Button></Link>
                <Link href="/profile"><Button variant="secondary" size="lg">Minha conta</Button></Link>
              </>
            ) : (
              <Link href="/login"><Button size="lg">Jogue agora</Button></Link>
            )}
          </div>
        </div>
        <div className="panel-glass rounded-[2rem] p-6 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-ink-soft">Mesa ativa</p>
              <p className="mt-1 font-display text-2xl text-ink">Torneio</p>
            </div>
            {me ? <RatingBadge rating={me.rating} /> : <span className="text-ink-soft">entre para ver seu rating</span>}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Stat title="Partidas ativas" value={online.toString()} />
            <Stat title="IA padrão" value={me ? engineForRating(me.rating).label : "Disponível"} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <FeatureCard title="Mesa" body="Superfície escura, leve brilho de madeira e contraste alto." />
        <FeatureCard title="Entrada" body="Botão único para entrar no fluxo sem ruído visual." />
        <FeatureCard title="Torneio" body="Dados de jogo e rating em uma leitura rápida e elegante." />
      </section>
    </div>
  );
}

async function safeAuth() {
  try {
    return await auth();
  } catch {
    return null;
  }
}

async function safeUser(userId: string) {
  try {
    return await prisma.user.findUnique({ where: { id: userId } });
  } catch {
    return null;
  }
}

async function safeOnlineCount() {
  try {
    return await prisma.game.count({ where: { status: "IN_PROGRESS" } });
  } catch {
    return 0;
  }
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
      <p className="text-[11px] uppercase tracking-[0.24em] text-ink-soft">{title}</p>
      <p className="mt-2 font-display text-xl text-ink">{value}</p>
    </div>
  );
}

function FeatureCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-bg-card/80 p-5">
      <h3 className="font-display text-xl text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-ink-soft">{body}</p>
    </div>
  );
}
