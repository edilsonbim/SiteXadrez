"use client";

import { useEffect, useMemo, useState } from "react";
import { Chess } from "chess.js";

const FILES = ["a","b","c","d","e","f","g","h"];

function squareName(idx: number) { return FILES[idx % 8] + (8 - Math.floor(idx / 8)); }
function squareIndex(name: string) { return FILES.indexOf(name[0]) + (8 - parseInt(name[1], 10)) * 8; }

const UNICODE: Record<string, string> = {
  K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙",
  k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟",
};

export function Board({ fen, side, onMove, disabled }: { fen: string; side: "w" | "b" | "spectator"; onMove: (uci: string) => void; disabled?: boolean }) {
  const chess = useMemo(() => new Chess(fen), [fen]);
  const [selected, setSelected] = useState<number | null>(null);
  const [legalTargets, setLegalTargets] = useState<number[]>([]);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => { setSelected(null); setLegalTargets([]); }, [fen]);

  const pieces = chess.board().flatMap((row, r) => row.map((sq, f) => ({ sq, idx: r * 8 + f })));

  function handleSquareClick(idx: number) {
    if (disabled) return;
    const name = squareName(idx);
    const piece = chess.get(name as any);
    if (selected === null) {
      if (piece && piece.color === (side === "spectator" ? chess.turn() : side)) {
        setSelected(idx);
        const moves = chess.moves({ square: name as any, verbose: true }) as any[];
        setLegalTargets(moves.map((m: any) => squareIndex(m.to)));
      }
      return;
    }
    if (legalTargets.includes(idx)) {
      const from = squareName(selected);
      const to = squareName(idx);
      const m = chess.moves({ square: from as any, verbose: true }) as any[];
      const mv = m.find((x: any) => x.to === to);
      const uci = from + to + (mv?.promotion ?? "");
      onMove(uci);
      setSelected(null); setLegalTargets([]);
      return;
    }
    if (piece && piece.color === (side === "spectator" ? chess.turn() : side)) {
      setSelected(idx);
      const moves = chess.moves({ square: name as any, verbose: true }) as any[];
      setLegalTargets(moves.map((m: any) => squareIndex(m.to)));
      return;
    }
    setSelected(null); setLegalTargets([]);
  }

  const orderedIdx = flipped ? [...Array(64).keys()].reverse() : [...Array(64).keys()];

  return (
    <div className="grid grid-cols-[auto_1fr] gap-2">
      <div className="flex flex-col justify-between text-xs text-ink-soft py-1 select-none">
        {Array.from({ length: 8 }, (_, i) => 8 - i).map((n) => <span key={n}>{n}</span>)}
      </div>
      <div>
        <div className="grid grid-cols-8 rounded-md overflow-hidden border border-line">
          {orderedIdx.map((idx) => {
            const isLight = (Math.floor(idx / 8) + (idx % 8)) % 2 === 0;
            const piece = pieces.find((p) => p.idx === idx)?.sq;
            const isSelected = selected === idx;
            const isLegal = legalTargets.includes(idx);
            return (
              <button
                key={idx}
                onClick={() => handleSquareClick(idx)}
                aria-label={squareName(idx)}
                className={[
                  "relative aspect-square flex items-center justify-center text-4xl leading-none transition-colors",
                  isLight ? "square-light text-black" : "square-dark text-white",
                  isSelected ? "square-selected" : "",
                  isLegal ? "after:absolute after:h-3 after:w-3 after:rounded-full after:bg-accent/70" : "",
                ].join(" ")}
                disabled={disabled}
              >
                {piece && (
                  <span className="piece">{UNICODE[piece.color === "w" ? piece.type.toUpperCase() : piece.type]}</span>
                )}
                {(idx % 8 === 0) && <span className={`absolute left-1 top-0 text-[10px] ${isLight ? "text-black/60" : "text-white/70"}`}>{8 - Math.floor(idx / 8)}</span>}
                {(idx < 8) && <span className={`absolute right-1 bottom-0 text-[10px] ${isLight ? "text-black/60" : "text-white/70"}`}>{FILES[idx % 8]}</span>}
              </button>
            );
          })}
        </div>
        <button className="text-xs text-ink-soft mt-2 underline" onClick={() => setFlipped((f) => !f)}>Girar tabuleiro</button>
      </div>
    </div>
  );
}
