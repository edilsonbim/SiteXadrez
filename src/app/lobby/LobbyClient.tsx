"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { RatingBadge } from "@/components/ui/RatingBadge";
import { engineForRating, ENGINES } from "@/lib/chess/types";

interface Me { id: string; name: string; image: string | null; rating: number }

export function LobbyClient({ user }: { user: Me }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [queueing, setQueueing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matched, setMatched] = useState<string | null>(null);

  const engine = engineForRating(user.rating);

  async function startVsAI() {
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/games", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ initialTime: 600, increment: 0 }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "erro");
      router.push(`/game/${json.gameId}?mode=pve`);
    } catch (e: any) { setError(e.message ?? "erro"); }
    finally { setBusy(false); }
  }

  async function joinQueue() {
    setQueueing(true); setError(null);
    const tick = async () => {
      try {
        const res = await fetch("/api/matchmaking/join", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ initialTime: 600, increment: 0 }) });
        const json = await res.json();
        if (json.matched) { setMatched(json.gameId); router.push(`/game/${json.gameId}?mode=pvp`); return true; }
        return false;
      } catch { return false; }
    };
    const matched = await tick();
    if (matched) return;
    const interval = setInterval(async () => {
      const ok = await tick();
      if (ok) clearInterval(interval);
    }, 3000);
  }

  useEffect(() => () => { if (queueing) fetch("/api/matchmaking/leave", { method: "POST" }); }, [queueing]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>Ola, {user.name}</CardTitle>
            <p className="text-ink-soft text-sm">Pronto para a proxima?</p>
          </div>
          <RatingBadge rating={user.rating} />
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl bg-bg p-5 border border-line space-y-3">
            <h3 className="font-semibold">Partida vs IA</h3>
            <p className="text-sm text-ink-soft">Voce joga de brancas contra o motor. Nivel: <b className="text-ink">{engine.label}</b> (depth {engine.depth}, skill {engine.skillLevel}).</p>
            <Button onClick={startVsAI} disabled={busy}>{busy ? "Criando..." : "Iniciar contra IA"}</Button>
          </div>
          <div className="rounded-xl bg-bg p-5 border border-line space-y-3">
            <h3 className="font-semibold">Partida vs Jogador</h3>
            <p className="text-sm text-ink-soft">Matchmaking por rating. Janela inicial 100 pontos, expande ate 600.</p>
            <Button onClick={joinQueue} variant="secondary" disabled={queueing}>{queueing ? "Procurando oponente..." : "Entrar na fila"}</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Niveis de IA</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {ENGINES.map((e) => (
            <div key={e.id} className="rounded-lg border border-line p-3 text-sm">
              <div className="flex items-center justify-between"><b>{e.label}</b><span className="text-ink-soft">{e.minRating}+</span></div>
              <p className="text-ink-soft mt-1">{e.description}</p>
              <p className="text-xs text-ink-soft mt-2">depth {e.depth} / skill {e.skillLevel}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {error && <p className="text-bad text-sm">{error}</p>}
      {matched && <p className="text-good text-sm">Partida encontrada: {matched}</p>}
    </div>
  );
}
