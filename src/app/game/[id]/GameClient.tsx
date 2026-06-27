"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import { Board } from "@/components/chess/Board";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { RatingBadge } from "@/components/ui/RatingBadge";
import { io, Socket } from "socket.io-client";
import { MoveList } from "@/components/chess/MoveList";
import { GameClock } from "@/components/chess/GameClock";
import { Crown, Landmark } from "lucide-react";

interface Me { id: string; name: string; image: string | null }

interface SidePlayer { id: string; name: string; image: string | null; rating: number }
interface MoveDTO { ply: number; san: string; uci: string; fenAfter: string; whiteTime: number; blackTime: number }

export function GameClient({ gameId, me }: { gameId: string; me: Me }) {
  const [fen, setFen] = useState("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
  const [pgn, setPgn] = useState("");
  const [result, setResult] = useState<"ONGOING" | "WHITE_WIN" | "BLACK_WIN" | "DRAW">("ONGOING");
  const [white, setWhite] = useState<SidePlayer | null>(null);
  const [black, setBlack] = useState<SidePlayer | null>(null);
  const [moves, setMoves] = useState<MoveDTO[]>([]);
  const [whiteTime, setWhiteTime] = useState(600);
  const [blackTime, setBlackTime] = useState(600);
  const [side, setSide] = useState<"w" | "b" | "spectator">("spectator");
  const [mode, setMode] = useState<"PVP" | "PVE">("PVE");
  const [aiThinking, setAiThinking] = useState(false);
  const [theme, setTheme] = useState<"classic" | "arena">("classic");
  const [connectionNote, setConnectionNote] = useState<string>("Conectando...");
  const socketRef = useRef<Socket | null>(null);

  const chess = useMemo(() => new Chess(fen), [fen]);
  const turn = chess.turn();

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/games/${gameId}`).then((r) => r.json()).then((j) => {
      if (cancelled || !j.game) return;
      setFen(j.game.fen); setPgn(j.game.pgn); setResult(j.game.result);
      setWhite(j.game.white); setBlack(j.game.black); setMoves(j.game.moves);
      setWhiteTime(j.game.whiteTime); setBlackTime(j.game.blackTime);
      setMode(j.game.mode);
      setConnectionNote("Conectado");
      if (j.game.whiteId === me.id) setSide("w");
      else if (j.game.blackId === me.id) setSide("b");
      else setSide("spectator");
    });
    return () => { cancelled = true; };
  }, [gameId, me.id]);

  useEffect(() => {
    if (mode !== "PVP") return;
    const s = io(process.env.NEXT_PUBLIC_SOCKET_URL ?? "/", {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 3000,
    });
    socketRef.current = s;
    s.on("connect", () => setConnectionNote("Conectado"));
    s.on("disconnect", () => setConnectionNote("Reconectando..."));
    s.on("reconnect", () => {
      setConnectionNote("Conectado");
      s.emit("join", { gameId });
    });
    s.emit("join", { gameId });
    s.on("move", (payload: any) => {
      if (!payload?.ok) return;
      setFen(payload.game.fen); setPgn(payload.game.pgn); setResult(payload.game.result);
      setMoves((m) => [...m, payload.move]);
      setWhiteTime(payload.move.whiteTime); setBlackTime(payload.move.blackTime);
    });
    return () => { s.emit("leave", { gameId }); s.disconnect(); };
  }, [gameId, mode]);

  async function reconnect() {
    setConnectionNote("Reconectando...");
    const res = await fetch(`/api/games/${gameId}`);
    if (!res.ok) {
      setConnectionNote("Falha ao reconectar");
      return;
    }
    const json = await res.json();
    if (!json.game) {
      setConnectionNote("Partida indisponível");
      return;
    }
    setFen(json.game.fen);
    setPgn(json.game.pgn);
    setResult(json.game.result);
    setWhite(json.game.white);
    setBlack(json.game.black);
    setMoves(json.game.moves);
    setWhiteTime(json.game.whiteTime);
    setBlackTime(json.game.blackTime);
    setMode(json.game.mode);
    if (socketRef.current) {
      socketRef.current.emit("leave", { gameId });
      socketRef.current.emit("join", { gameId });
    }
    setConnectionNote("Conectado");
  }

  async function sendMove(uci: string) {
    const res = await fetch(`/api/games/${gameId}/move`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ uci }) });
    const json = await res.json();
    if (!res.ok) return;
    setFen(json.fen); setPgn(json.pgn); setResult(json.result);
    setMoves((m) => [...m, { ...json.move }]);
    if (mode === "PVE" && json.result === "ONGOING") {
      setAiThinking(true);
      const ai = await fetch(`/api/games/${gameId}/ai-move`, { method: "POST" });
      const aiJson = await ai.json();
      if (ai.ok && aiJson.result) {
        setFen(aiJson.fen); setPgn(aiJson.pgn); setResult(aiJson.result);
        setMoves((m) => [...m, { ...aiJson.move }]);
      }
      setAiThinking(false);
    }
    if (json.result !== "ONGOING") {
      await fetch(`/api/games/${gameId}/finalize`, { method: "POST" });
    }
  }

  return (
    <div className={`grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] enter-rise ${theme === "classic" ? "theme-classic" : "theme-arena"}`}>
      <Card className="overflow-hidden">
        <CardHeader className={`flex items-center justify-between ${theme === "classic" ? "bg-amber-950/30" : "bg-slate-900/80"}`}>
          <div className="flex items-center gap-3">
            <CardTitle>Partida {gameId.slice(0, 6)}</CardTitle>
            <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-ink-soft">{mode}</span>
            {result !== "ONGOING" && <span className="rounded-full border border-accent/30 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-accent">Finalizada</span>}
          </div>
          <div className="flex items-center gap-3">
            {side !== "spectator" && <span className="text-xs text-ink-soft">Você joga de {side === "w" ? "brancas" : "pretas"}</span>}
            <span className="text-xs text-ink-soft">{connectionNote}</span>
            <Button variant="secondary" size="sm" onClick={reconnect}>Reconectar</Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-5">
          <div className={`mb-4 flex items-center gap-2 rounded-2xl border p-2 ${theme === "classic" ? "border-amber-200/10 bg-amber-950/20" : "border-slate-600/30 bg-slate-950/30"}`}>
            <Button
              type="button"
              variant={theme === "classic" ? "primary" : "ghost"}
              size="sm"
              className="h-8 w-8 rounded-full px-0"
              aria-label="Madeira e marfim"
              title="Madeira e marfim"
              onClick={() => setTheme("classic")}
            >
              <Landmark className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={theme === "arena" ? "primary" : "ghost"}
              size="sm"
              className="h-8 w-8 rounded-full px-0"
              aria-label="Arena de torneio"
              title="Arena de torneio"
              onClick={() => setTheme("arena")}
            >
              <Crown className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)_220px] xl:items-start">
            <SideHud
              label="Preta"
              player={black}
              clock={<GameClock seconds={blackTime} active={turn === "b" && result === "ONGOING"} />}
              active={turn === "b" && result === "ONGOING"}
            />
            <div className="space-y-3">
              <div className={`rounded-2xl border p-2 md:p-3 ${theme === "classic" ? "border-amber-200/10 bg-amber-950/20" : "border-slate-600/30 bg-slate-950/30"}`}>
                <Board fen={fen} side={side} onMove={(uci) => sendMove(uci)} disabled={result !== "ONGOING" || side === "spectator" || turn !== side || aiThinking} />
              </div>
              <div className="flex flex-wrap items-center gap-2 justify-between">
                <div className="text-xs uppercase tracking-[0.24em] text-ink-soft">
                  {result === "ONGOING" ? (aiThinking ? "IA calculando" : "Turno em andamento") : "Partida encerrada"}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(pgn)}>Copiar PGN</Button>
                  <Button variant="secondary" size="sm" onClick={() => location.assign("/lobby")}>Voltar à mesa</Button>
                </div>
              </div>
            </div>
            <SideHud
              label="Branca"
              player={white}
              clock={<GameClock seconds={whiteTime} active={turn === "w" && result === "ONGOING"} />}
              active={turn === "w" && result === "ONGOING"}
            />
          </div>
        </CardContent>
      </Card>
      <Card className="overflow-hidden">
        <CardHeader className={theme === "classic" ? "bg-amber-950/30" : "bg-slate-900/80"}>
          <CardTitle>HUD de torneio</CardTitle>
          <p className="text-xs uppercase tracking-[0.22em] text-ink-soft mt-1">Lances, estado e controle</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <MiniStat label="Modo" value={mode} />
            <MiniStat label="Estado" value={result === "ONGOING" ? "Em jogo" : "Encerrada"} />
            <MiniStat label="Peças" value={`${moves.length}`} />
            <MiniStat label="Turno" value={turn === "w" ? "Brancas" : "Pretas"} />
          </div>
            <div className={`rounded-2xl border p-4 ${theme === "classic" ? "border-amber-200/10 bg-amber-950/20" : "border-slate-600/30 bg-slate-950/30"}`}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-display text-lg text-ink">Lances</h3>
                {aiThinking && <span className="text-xs text-accent">IA pensando</span>}
              </div>
              <MoveList moves={moves} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SideHud({ label, player, clock, active }: { label: string; player: SidePlayer | null; clock: React.ReactNode; active: boolean }) {
  return (
    <div className={`rounded-3xl border p-4 transition-all duration-200 ${active ? "border-accent/40 bg-accent/5 shadow-glow" : "border-white/10 bg-white/5"}`}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-[0.24em] text-ink-soft">{label}</span>
        {clock}
      </div>
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-line flex items-center justify-center overflow-hidden border border-white/10">
          {player?.image ? <img src={player.image} alt="" className="h-full w-full object-cover" /> : (player?.name?.[0] ?? "?")}
        </div>
        <div>
          <p className="text-sm font-medium text-ink">{player?.name ?? "Aguardando"}</p>
          {player && <RatingBadge rating={player.rating} className="mt-1" />}
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <p className="text-[10px] uppercase tracking-[0.22em] text-ink-soft">{label}</p>
      <p className="mt-1 text-sm font-display text-ink">{value}</p>
    </div>
  );
}
