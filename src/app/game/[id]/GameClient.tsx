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
      if (j.game.whiteId === me.id) setSide("w");
      else if (j.game.blackId === me.id) setSide("b");
      else setSide("spectator");
    });
    return () => { cancelled = true; };
  }, [gameId, me.id]);

  useEffect(() => {
    if (mode !== "PVP") return;
    const s = io(process.env.NEXT_PUBLIC_SOCKET_URL ?? "/", { transports: ["websocket"] });
    socketRef.current = s;
    s.emit("join", { gameId });
    s.on("move", (payload: any) => {
      if (!payload?.ok) return;
      setFen(payload.game.fen); setPgn(payload.game.pgn); setResult(payload.game.result);
      setMoves((m) => [...m, payload.move]);
      setWhiteTime(payload.move.whiteTime); setBlackTime(payload.move.blackTime);
    });
    return () => { s.emit("leave", { gameId }); s.disconnect(); };
  }, [gameId, mode]);

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
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle>Partida {gameId.slice(0, 6)}</CardTitle>
            <span className="text-xs text-ink-soft uppercase">{mode}</span>
            {result !== "ONGOING" && <span className="text-xs text-accent">FINALIZADA</span>}
          </div>
          {side !== "spectator" && (
            <span className="text-xs text-ink-soft">Voce joga de {side === "w" ? "brancas" : "pretas"}</span>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            <PlayerBar player={black} clock={<GameClock seconds={blackTime} active={turn === "b" && result === "ONGOING"} />} />
            <Board fen={fen} side={side} onMove={(uci) => sendMove(uci)} disabled={result !== "ONGOING" || side === "spectator" || turn !== side || aiThinking} />
            <PlayerBar player={white} clock={<GameClock seconds={whiteTime} active={turn === "w" && result === "ONGOING"} />} />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Lances</CardTitle></CardHeader>
        <CardContent>
          <MoveList moves={moves} />
          {aiThinking && <p className="text-xs text-ink-soft mt-3">IA pensando...</p>}
          <div className="mt-4 flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(pgn)}>Copiar PGN</Button>
            <Button variant="secondary" size="sm" onClick={() => location.assign("/lobby")}>Sair</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PlayerBar({ player, clock }: { player: SidePlayer | null; clock: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-bg p-3 border border-line">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-line flex items-center justify-center text-xs uppercase">
          {player?.image ? <img src={player.image} alt="" className="h-8 w-8 rounded-full" /> : (player?.name?.[0] ?? "?")}
        </div>
        <div>
          <p className="text-sm font-medium text-ink">{player?.name ?? "aguardando"}</p>
          {player && <RatingBadge rating={player.rating} className="mt-1" />}
        </div>
      </div>
      {clock}
    </div>
  );
}
