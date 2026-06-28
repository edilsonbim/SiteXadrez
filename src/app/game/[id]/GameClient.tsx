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
import { Crown, Landmark, Medal, Skull, Handshake, Flag } from "lucide-react";

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
  const [pieceStyle, setPieceStyle] = useState<"classic" | "carved" | "metal">("classic");
  const [connectionNote, setConnectionNote] = useState<string>("Conectando...");
  const [promotion, setPromotion] = useState<{ from: string; to: string; side: "w" | "b" } | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const boardShellRef = useRef<HTMLDivElement | null>(null);
  const autoAiMoveRef = useRef(false);

  const chess = useMemo(() => new Chess(fen), [fen]);
  const turn = chess.turn();
  const boardOrientation: "w" | "b" = side === "b" ? "b" : "w";
  const lastMove = moves.length ? (() => {
    const uci = moves[moves.length - 1]?.uci ?? "";
    return uci.length >= 4 ? { from: uci.slice(0, 2), to: uci.slice(2, 4) } : null;
  })() : null;
  const finished = result !== "ONGOING";

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
      autoAiMoveRef.current = false;
    });
    return () => { cancelled = true; };
  }, [gameId, me.id]);

  useEffect(() => {
    if (mode !== "PVE" || result !== "ONGOING") return;
    if (side === "spectator") return;
    const aiTurn = side === "w" ? "b" : "w";
    if (turn !== aiTurn) return;
    if (aiThinking || autoAiMoveRef.current) return;
    autoAiMoveRef.current = true;
    setAiThinking(true);
    (async () => {
      try {
        const ai = await fetch(`/api/games/${gameId}/ai-move`, { method: "POST" });
        const aiJson = await ai.json().catch(() => ({}));
        if (ai.ok && aiJson.result) {
          setFen(aiJson.fen); setPgn(aiJson.pgn); setResult(aiJson.result);
          setMoves((m) => [...m, { ...aiJson.move }]);
        }
      } finally {
        setAiThinking(false);
        autoAiMoveRef.current = false;
      }
    })();
  }, [aiThinking, gameId, mode, result, side, turn]);

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

  useEffect(() => {
    if (result !== "ONGOING") return;
    const timeoutSide = whiteTime <= 0 ? "w" : blackTime <= 0 ? "b" : null;
    if (!timeoutSide) return;
    setResult(timeoutSide === "w" ? "BLACK_WIN" : "WHITE_WIN");
    fetch(`/api/games/${gameId}/finalize`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ timeoutSide }),
    });
  }, [blackTime, gameId, result, whiteTime]);

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

  async function commitMove(move: { from: string; to: string; promotion?: "q" | "r" | "b" | "n" }) {
    const isPromotion = isPawnPromotionMove(fen, move.from, move.to, side);
    if (isPromotion && !move.promotion) {
      setPromotion({ from: move.from, to: move.to, side: side === "spectator" ? (chess.turn() as "w" | "b") : side });
      return;
    }
    await sendMove(move.from + move.to + (move.promotion ?? ""));
  }

  async function resign() {
    if (!confirm("Deseja realmente desistir desta partida?")) return;
    const res = await fetch(`/api/games/${gameId}/resign`, { method: "POST" });
    if (!res.ok) return;
    const json = await res.json();
    if (json?.game) {
      setResult(json.game.result);
    }
  }

  return (
    <div className={`grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px] enter-rise ${theme === "classic" ? "theme-classic" : "theme-arena"}`}>
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
          <div className={`mb-4 flex flex-wrap items-center gap-2 rounded-2xl border p-2 ${theme === "classic" ? "border-amber-200/10 bg-amber-950/20" : "border-slate-600/30 bg-slate-950/30"}`}>
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
            <span className="mx-1 h-6 w-px bg-white/10" />
            <Button type="button" variant={pieceStyle === "classic" ? "primary" : "ghost"} size="sm" onClick={() => setPieceStyle("classic")}>Clássico</Button>
            <Button type="button" variant={pieceStyle === "carved" ? "primary" : "ghost"} size="sm" onClick={() => setPieceStyle("carved")}>Talhado</Button>
            <Button type="button" variant={pieceStyle === "metal" ? "primary" : "ghost"} size="sm" onClick={() => setPieceStyle("metal")}>Metal</Button>
          </div>
          <div className="grid gap-4 xl:grid-cols-[180px_minmax(0,1fr)_180px] xl:items-start">
            <SideHud label="Preta" player={black} active={turn === "b" && result === "ONGOING"} />
            <div className="space-y-3">
              <div ref={boardShellRef} className={`relative rounded-2xl border p-2 md:p-4 ${theme === "classic" ? "border-amber-200/10 bg-amber-950/20" : "border-slate-600/30 bg-slate-950/30"}`}>
                <div className="pointer-events-none absolute left-4 right-4 top-4 z-20 flex items-start justify-between gap-3">
                  <div className="pointer-events-auto">
                    <GameClock seconds={blackTime} active={turn === "b" && result === "ONGOING"} />
                  </div>
                  <div className="pointer-events-auto">
                    <GameClock seconds={whiteTime} active={turn === "w" && result === "ONGOING"} />
                  </div>
                </div>
                <Board
                  fen={fen}
                  side={side}
                  orientation={boardOrientation}
                  onMove={(move) => commitMove(move)}
                  disabled={result !== "ONGOING" || side === "spectator" || turn !== side || aiThinking}
                  pieceStyle={pieceStyle}
                  lastMove={lastMove}
                  onFullscreen={() => {
                    const el = boardShellRef.current;
                    if (el?.requestFullscreen) el.requestFullscreen();
                  }}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2 justify-between">
                <div className="text-xs uppercase tracking-[0.24em] text-ink-soft">
                  {result === "ONGOING" ? (aiThinking ? "IA calculando" : "Turno em andamento") : "Tempo esgotado = derrota"}
                </div>
                <div className="flex gap-2">
                  {result === "ONGOING" && side !== "spectator" && (
                    <Button variant="secondary" size="sm" onClick={resign} className="gap-2">
                      <Flag className="h-4 w-4" />
                      Desistir
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(pgn)}>Copiar PGN</Button>
                  <Button variant="secondary" size="sm" onClick={() => location.assign("/lobby")}>Voltar à mesa</Button>
                </div>
              </div>
            </div>
            <SideHud label="Branca" player={white} active={turn === "w" && result === "ONGOING"} />
          </div>
        </CardContent>
      </Card>
      {finished && <ResultOverlay result={result} />}
      {promotion && (
        <PromotionModal
          side={promotion.side}
          onChoose={async (piece) => {
            const next = promotion;
            setPromotion(null);
            await sendMove(next.from + next.to + piece);
          }}
          onCancel={() => setPromotion(null)}
        />
      )}
      <Card className="overflow-hidden">
        <CardHeader className={theme === "classic" ? "bg-amber-950/30" : "bg-slate-900/80"}>
          <CardTitle>HUD de torneio</CardTitle>
          <p className="text-xs uppercase tracking-[0.22em] text-ink-soft mt-1">Lances, estado e controle</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <MiniStat label="Modo" value={mode} />
            <MiniStat label="Estado" value={result === "ONGOING" ? "Em jogo" : "Derrota por tempo / fim"} />
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

function isPawnPromotionMove(fen: string, from: string, to: string, side: "w" | "b" | "spectator") {
  const board = fen.split(" ")[0].split("/");
  const piece = pieceAt(board, from);
  if (!piece || piece.toLowerCase() !== "p") return false;
  if (side === "w") return from[1] === "7" && to[1] === "8";
  if (side === "b") return from[1] === "2" && to[1] === "1";
  return false;
}

function pieceAt(rows: string[], square: string) {
  const file = square.charCodeAt(0) - 97;
  const rank = 8 - Number(square[1]);
  const row = rows[rank];
  if (!row) return null;
  let col = 0;
  for (const ch of row) {
    if (/\d/.test(ch)) {
      col += Number(ch);
      continue;
    }
    if (col === file) return ch;
    col += 1;
  }
  return null;
}

function PromotionModal({ side, onChoose, onCancel }: { side: "w" | "b"; onChoose: (piece: "q" | "r" | "b" | "n") => void; onCancel: () => void }) {
  const options: Array<{ piece: "q" | "r" | "b" | "n"; label: string }> = [
    { piece: "q", label: "Dama" },
    { piece: "r", label: "Torre" },
    { piece: "b", label: "Bispo" },
    { piece: "n", label: "Cavalo" },
  ];
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/70 backdrop-blur-sm">
      <div className="w-[min(92vw,420px)] rounded-[1.6rem] border border-white/10 bg-slate-950 p-5 shadow-2xl">
        <h3 className="font-display text-2xl text-ink">Promover peão</h3>
        <p className="mt-2 text-sm text-ink-soft">Escolha a nova peça para o peão {side === "w" ? "branco" : "preto"}.</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {options.map((opt) => (
            <Button key={opt.piece} onClick={() => onChoose(opt.piece)} variant="secondary">
              {opt.label}
            </Button>
          ))}
        </div>
        <div className="mt-3">
          <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
        </div>
      </div>
    </div>
  );
}

function SideHud({ label, player, active }: { label: string; player: SidePlayer | null; active: boolean }) {
  return (
    <div className={`rounded-3xl border p-4 transition-all duration-200 ${active ? "border-accent/40 bg-accent/5 shadow-glow" : "border-white/10 bg-white/5"}`}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-[0.24em] text-ink-soft">{label}</span>
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

function ResultOverlay({ result }: { result: "WHITE_WIN" | "BLACK_WIN" | "DRAW" }) {
  const title = result === "DRAW" ? "Empate" : result === "WHITE_WIN" ? "Vitória das brancas" : "Vitória das pretas";
  const subtitle = result === "DRAW" ? "Partida equilibrada até o fim." : result === "WHITE_WIN" ? "Brancas vencem." : "Pretas vencem.";
  const Icon = result === "DRAW" ? Handshake : result === "WHITE_WIN" ? Medal : Skull;
  const tone =
    result === "DRAW"
      ? {
          shell: "border-white/15 bg-slate-950",
          icon: "text-ink-soft",
          accent: "text-ink",
        }
      : result === "WHITE_WIN"
        ? {
            shell: "border-emerald-300/35 bg-emerald-950/85",
            icon: "text-emerald-300",
            accent: "text-emerald-200",
          }
        : {
            shell: "border-rose-300/35 bg-rose-950/85",
            icon: "text-rose-300",
            accent: "text-rose-200",
          };
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className={`w-[min(92vw,520px)] rounded-[2rem] border p-8 text-center shadow-2xl ${tone.shell}`}>
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full border border-white/10 bg-white/5">
          <Icon className={`h-8 w-8 ${tone.icon}`} />
        </div>
        <h2 className={`font-display text-3xl ${tone.accent}`}>{title}</h2>
        <p className="mt-2 text-sm text-ink-soft">{subtitle}</p>
      </div>
    </div>
  );
}
