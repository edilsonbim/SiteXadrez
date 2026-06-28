"use client";

import { useEffect, useMemo, useState } from "react";
import { Chess } from "chess.js";
import { Piece } from "./Piece";
import { Focus } from "lucide-react";

const FILES = ["a","b","c","d","e","f","g","h"];

function squareName(idx: number) { return FILES[idx % 8] + (8 - Math.floor(idx / 8)); }
function squareIndex(name: string) { return FILES.indexOf(name[0]) + (8 - parseInt(name[1], 10)) * 8; }

export function Board({ fen, side, orientation = "w", onMove, disabled, pieceStyle = "classic", lastMove, onFullscreen }: { fen: string; side: "w" | "b" | "spectator"; orientation?: "w" | "b"; onMove: (move: { from: string; to: string }) => void; disabled?: boolean; pieceStyle?: "classic" | "carved" | "metal"; lastMove?: { from: string; to: string } | null; onFullscreen?: () => void }) {
  const chess = useMemo(() => new Chess(fen), [fen]);
  const [selected, setSelected] = useState<number | null>(null);
  const [legalTargets, setLegalTargets] = useState<number[]>([]);
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
      onMove({ from, to });
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

  const flipped = orientation === "b";
  const orderedIdx = flipped ? [...Array(64).keys()].reverse() : [...Array(64).keys()];
  const orderedFiles = flipped ? [...FILES].reverse() : FILES;

  return (
    <div className="grid gap-3 xl:grid-cols-[auto_1fr] items-start">
      <div className="flex flex-col justify-between text-xs text-ink-soft py-2 select-none">
        {Array.from({ length: 8 }, (_, i) => 8 - i).map((n) => <span key={n}>{n}</span>)}
      </div>
      <div>
        <div className="rounded-[2rem] p-4 board-frame">
          <div className="rounded-[1.4rem] p-3 board-surface border border-white/10">
            <div className="board-shell">
              <div className="board-topbar px-2">
                <span className="board-top-spacer" aria-hidden="true" />
                <div className="board-files board-files--top text-[10px] uppercase tracking-[0.24em] text-ink-soft">
                  {orderedFiles.map((f) => <span key={f} className="leading-none">{f}</span>)}
                </div>
                <span aria-hidden="true" />
              </div>
              <div className="board-ranks" aria-hidden="true">
                {Array.from({ length: 8 }, (_, i) => 8 - i).map((n) => <span key={n} className="leading-none">{n}</span>)}
              </div>
              <div className="board-grid-wrap">
                <div className="grid grid-cols-8 overflow-hidden rounded-[1.1rem] ring-1 ring-black/35 board-grid">
              {orderedIdx.map((idx) => {
                const isLight = (Math.floor(idx / 8) + (idx % 8)) % 2 === 0;
                const piece = pieces.find((p) => p.idx === idx)?.sq;
                const isSelected = selected === idx;
                const isLegal = legalTargets.includes(idx);
                const name = squareName(idx);
                const isLastFrom = lastMove?.from === name;
                const isLastTo = lastMove?.to === name;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSquareClick(idx)}
                    aria-label={squareName(idx)}
                    className={[
                      "board-square relative aspect-square flex items-center justify-center transition-all duration-200 hover:brightness-110",
                      isLight ? "square-light" : "square-dark",
                      isSelected ? "square-selected" : "",
                      isLastFrom ? "square-last-from" : "",
                      isLastTo ? "square-last-to" : "",
                      isLegal ? "after:absolute after:h-3 after:w-3 after:rounded-full after:bg-accent/70 after:shadow-glow" : "",
                    ].join(" ")}
                    disabled={disabled}
                  >
                    {piece && <Piece kind={piece.type} color={piece.color} className="piece-appear" styleName={pieceStyle} />}
                  </button>
                );
              })}
                </div>
              </div>
              <div className="board-bottombar">
                <button className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2 py-1 text-[10px] hover:text-ink" onClick={onFullscreen} type="button">
                  <Focus className="h-3.5 w-3.5" /> Tela cheia
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="text-xs text-ink-soft mt-2">O tabuleiro gira automaticamente conforme sua cor.</div>
      </div>
    </div>
  );
}
