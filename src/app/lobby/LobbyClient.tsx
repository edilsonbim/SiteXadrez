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
  const [queueJoinedAt, setQueueJoinedAt] = useState<number | null>(null);
  const [queueFallbackAt, setQueueFallbackAt] = useState<number | null>(null);
  const [queueElapsed, setQueueElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [matched, setMatched] = useState<string | null>(null);
  const [timeControl, setTimeControl] = useState<5 | 10 | 15>(10);

  const engine = engineForRating(user.rating);

  async function startVsAI() {
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/games", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ initialTime: timeControl * 60, increment: 0 }) });
      const json = await safeJson(res);
      if (!res.ok) {
        if (json.error === "production_database_missing") {
          throw new Error("Mesa solo indisponível na produção sem banco configurado.");
        }
        throw new Error(json.error ?? "erro");
      }
      router.push(`/game/${json.gameId}?mode=pve`);
    } catch (e: any) { setError(e.message ?? "erro"); }
    finally { setBusy(false); }
  }

  async function joinQueue() {
    setQueueing(true); setError(null);
    const tick = async () => {
      try {
        const res = await fetch("/api/matchmaking/join", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ initialTime: timeControl * 60, increment: 0 }) });
        const json = await safeJson(res);
        if (json.matched) {
          setMatched(json.gameId);
          setQueueing(false);
          setQueueJoinedAt(null);
          setQueueFallbackAt(null);
          router.push(`/game/${json.gameId}?mode=pvp`);
          return true;
        }
        if (json.joinedAt) setQueueJoinedAt(json.joinedAt);
        if (json.fallbackAt) setQueueFallbackAt(json.fallbackAt);
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

  useEffect(() => {
    if (!queueing || !queueJoinedAt) return;
    setQueueElapsed(Math.max(0, Math.floor((Date.now() - queueJoinedAt) / 1000)));
    const timer = setInterval(() => {
      setQueueElapsed(Math.max(0, Math.floor((Date.now() - queueJoinedAt) / 1000)));
    }, 1000);
    return () => clearInterval(timer);
  }, [queueing, queueJoinedAt]);

  useEffect(() => () => { if (queueing) fetch("/api/matchmaking/leave", { method: "POST" }); }, [queueing]);

  return (
    <div className="space-y-6 enter-rise">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>Mesas</CardTitle>
            <p className="text-ink-soft text-sm">Escolha o ritmo da partida e entre direto no jogo.</p>
          </div>
          <RatingBadge rating={user.rating} />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-[0.22em] text-ink-soft mr-2">Relógio</span>
            {[15, 10, 5].map((mins) => (
              <Button
                key={mins}
                type="button"
                variant={timeControl === mins ? "primary" : "secondary"}
                size="sm"
                onClick={() => setTimeControl(mins as 5 | 10 | 15)}
              >
                {mins} min
              </Button>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-white/5 p-5 border border-white/10 space-y-3">
            <h3 className="font-display text-xl text-ink">Mesa solo</h3>
            <p className="text-sm text-ink-soft">Cor inicial aleatória contra o motor. Nível: <b className="text-ink">{engine.label}</b>. Tempo {timeControl} min.</p>
            <Button onClick={startVsAI} disabled={busy}>{busy ? "Criando..." : "Jogar agora"}</Button>
          </div>
          <div className="rounded-2xl bg-white/5 p-5 border border-white/10 space-y-3">
            <h3 className="font-display text-xl text-ink">Mesa PvP</h3>
            <p className="text-sm text-ink-soft">Matchmaking por rating com janela progressiva. Tempo {timeControl} min.</p>
            <Button onClick={joinQueue} variant="secondary" disabled={queueing} className={queueing ? "queue-button queue-button--active" : ""}>
              <span className="queue-button__label">{queueing ? "Procurando" : "Entrar na fila"}</span>
              {queueing && <span className="queue-button__dots" aria-hidden="true"><span>.</span><span>.</span><span>.</span></span>}
            </Button>
            {queueing && (
              <div className="queue-panel rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-ink-soft space-y-1">
                <p className="text-ink">Você está na fila</p>
                <p>Tempo aguardando: {queueElapsed}s <span className="queue-panel__pulse" aria-hidden="true">●</span></p>
                {queueFallbackAt && (
                  <p>Fallback para IA em até {Math.max(0, Math.ceil((queueFallbackAt - Date.now()) / 1000))}s</p>
                )}
              </div>
            )}
          </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Níveis de IA</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {ENGINES.map((e) => (
            <div key={e.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
              <div className="flex items-center justify-between"><b className="text-ink">{e.label}</b><span className="text-ink-soft">{e.minRating}+</span></div>
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

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { error: text || "bad_response" };
  }
}
