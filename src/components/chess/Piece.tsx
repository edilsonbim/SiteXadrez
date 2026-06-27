import { useId } from "react";
import type { PieceSymbol, Color } from "chess.js";

type Props = { kind: PieceSymbol; color: Color; className?: string };

export function Piece({ kind, color, className = "" }: Props) {
  const path = PATHS[kind];
  const isWhite = color === "w";
  const uid = useId().replace(/:/g, "");
  const bodyId = `${uid}-${isWhite ? "ivory" : "obsidian"}-body`;
  const edgeId = `${uid}-${isWhite ? "ivory" : "obsidian"}-edge`;
  const sheenId = `${uid}-sheen`;
  const shadowId = `${uid}-shadow`;

  return (
    <svg
      viewBox="0 0 100 100"
      className={`piece ${className}`}
      aria-label={`${isWhite ? "white" : "black"} ${kind}`}
      role="img"
    >
      <defs>
        <linearGradient id={bodyId} x1="0%" y1="0%" x2="0%" y2="100%">
          {isWhite ? (
            <>
              <stop offset="0%" stopColor="#fffdf8" />
              <stop offset="18%" stopColor="#f3e8d0" />
              <stop offset="52%" stopColor="#d2ba8b" />
              <stop offset="100%" stopColor="#8c6237" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#6b655d" />
              <stop offset="22%" stopColor="#302c29" />
              <stop offset="62%" stopColor="#151311" />
              <stop offset="100%" stopColor="#050505" />
            </>
          )}
        </linearGradient>
        <linearGradient id={edgeId} x1="0%" y1="0%" x2="100%" y2="100%">
          {isWhite ? (
            <>
              <stop offset="0%" stopColor="#fff8e8" />
              <stop offset="100%" stopColor="#5b3a1c" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#8c8378" />
              <stop offset="100%" stopColor="#000000" />
            </>
          )}
        </linearGradient>
        <radialGradient id={sheenId} cx="45%" cy="20%" r="65%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.46" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.10" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <filter id={shadowId} x="-30%" y="-30%" width="160%" height="180%">
          <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#000" floodOpacity="0.45" />
          <feDropShadow dx="0" dy="10" stdDeviation="5" floodColor="#000" floodOpacity="0.2" />
        </filter>
      </defs>

      <ellipse cx="50" cy="80" rx="20" ry="6" fill="#000" opacity="0.22" />
      <g filter={`url(#${shadowId})`} transform="translate(0 1)">
        <path d={path} fill={`url(#${bodyId})`} stroke={`url(#${edgeId})`} strokeWidth="1.8" strokeLinejoin="round" />
        <path d={path} fill={`url(#${sheenId})`} stroke="none" transform="translate(-1.2 -1.2)" opacity="0.9" />
      </g>
    </svg>
  );
}

const PATHS: Record<PieceSymbol, string> = {
  k: "M50 12L54 20H46L50 12ZM50 22C57 22 62 28 62 36C62 45 56 49 56 58H44C44 49 38 45 38 36C38 28 43 22 50 22ZM36 60H64L68 72H32L36 60ZM30 74H70L74 84H26L30 74Z",
  q: "M50 12L56 20L50 17L44 20L50 12ZM38 24L42 17L50 24L58 17L62 24L57 33H43L38 24ZM34 36H66L62 52H38L34 36ZM30 56H70L74 66H26L30 56ZM26 70H74L78 84H22L26 70Z",
  r: "M30 16H70V26H30V16ZM34 26H66L64 36H36L34 26ZM32 36H68L66 58H34L32 36ZM28 58H72L76 70H24L28 58ZM24 72H76L80 84H20L24 72Z",
  b: "M50 14C56 14 60 20 60 25C60 30 55 34 54 39C53 44 58 48 58 55H42C42 48 47 44 46 39C45 34 40 30 40 25C40 20 44 14 50 14ZM36 58H64L68 70H32L36 58ZM30 72H70L74 84H26L30 72Z",
  n: "M34 24C40 16 50 14 60 18C66 20 69 26 68 32C67 38 63 40 57 43C54 44 52 47 52 50V58H66L70 70H30L34 58H46V50C46 43 41 40 38 35C35 31 32 28 34 24ZM28 72H72L76 84H24L28 72Z",
  p: "M50 16C57 16 62 22 62 29C62 35 58 40 53 43C56 46 58 51 58 56H42C42 51 44 46 47 43C42 40 38 35 38 29C38 22 43 16 50 16ZM34 60H66L70 72H30L34 60ZM28 74H72L76 84H24L28 74Z",
};
