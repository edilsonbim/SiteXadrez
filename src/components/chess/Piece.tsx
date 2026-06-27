import { useId } from "react";
import type { PieceSymbol, Color } from "chess.js";

type PieceStyle = "classic" | "carved" | "metal";
type Props = { kind: PieceSymbol; color: Color; className?: string; styleName?: PieceStyle };

const SILHOUETTES: Record<PieceSymbol, string> = {
  p: "M50 14C56 14 60 19 60 25C60 30 57 34 54 37C57 40 60 45 60 50C60 56 56 61 50 61C44 61 40 56 40 50C40 45 43 40 46 37C43 34 40 30 40 25C40 19 44 14 50 14ZM36 64H64L68 72H32L36 64ZM30 74H70L74 84H26L30 74Z",
  r: "M31 14H69V22H63V28H58V34H42V28H37V22H31V14ZM35 34H65L63 42H37L35 34ZM33 42H67L65 60H35L33 42ZM29 60H71L75 72H25L29 60ZM25 74H75L79 84H21L25 74Z",
  n: "M35 22C40 16 48 14 56 16C62 18 67 22 69 28C70 33 68 39 63 44C61 46 58 48 55 50C59 53 61 56 61 61C61 67 57 73 50 76H29L33 66H41C43 58 46 52 51 48C47 45 44 41 43 37C41 32 42 27 45 23C48 19 32 22 35 22Z",
  b: "M50 13C56 13 60 18 60 24C60 29 57 33 54 37C57 40 59 45 59 50C59 57 56 62 50 66C44 62 41 57 41 50C41 45 43 40 46 37C43 33 40 29 40 24C40 18 44 13 50 13ZM47 21H53V31H47V21ZM35 68H65L69 84H31L35 68Z",
  q: "M38 15L43 21L50 15L57 21L62 15L66 22L61 30H39L34 22L38 15ZM32 34H68L64 45H36L32 34ZM30 45H70L66 58H34L30 45ZM26 60H74L78 72H22L26 60ZM22 74H78L82 84H18L22 74Z",
  k: "M45 13H55V20H62V26H55V34C60 38 63 44 63 51C63 61 57 69 50 69C43 69 37 61 37 51C37 44 40 38 45 34V26H38V20H45V13ZM46 13H54V24H46V13ZM34 71H66L71 84H29L34 71Z",
};

export function Piece({ kind, color, className = "", styleName = "classic" }: Props) {
  const isWhite = color === "w";
  const uid = useId().replace(/:/g, "");
  const bodyId = `${uid}-${styleName}-${isWhite ? "white" : "black"}-body`;
  const shadeId = `${uid}-${styleName}-${isWhite ? "white" : "black"}-shade`;
  const edgeId = `${uid}-${styleName}-${isWhite ? "white" : "black"}-edge`;
  const sheenId = `${uid}-${styleName}-sheen`;
  const shadowId = `${uid}-${styleName}-shadow`;

  return (
    <svg
      viewBox="0 0 100 100"
      className={`piece ${className}`}
      aria-label={`${isWhite ? "white" : "black"} ${kind}`}
      role="img"
    >
      <defs>
        <linearGradient id={bodyId} x1="12%" y1="0%" x2="88%" y2="100%">
          {styleName === "metal" ? (
            isWhite ? (
              <>
                <stop offset="0%" stopColor="#f8fbff" />
                <stop offset="34%" stopColor="#d5dfe9" />
                <stop offset="68%" stopColor="#98a5b3" />
                <stop offset="100%" stopColor="#586674" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#d7dce1" />
                <stop offset="34%" stopColor="#717a84" />
                <stop offset="68%" stopColor="#232931" />
                <stop offset="100%" stopColor="#0b0d11" />
              </>
            )
          ) : styleName === "carved" ? (
            isWhite ? (
              <>
                <stop offset="0%" stopColor="#fffdf7" />
                <stop offset="30%" stopColor="#f1deba" />
                <stop offset="68%" stopColor="#c28d56" />
                <stop offset="100%" stopColor="#7b4b27" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#5b4f46" />
                <stop offset="32%" stopColor="#2b2521" />
                <stop offset="68%" stopColor="#14100e" />
                <stop offset="100%" stopColor="#050404" />
              </>
            )
          ) : (
            isWhite ? (
              <>
                <stop offset="0%" stopColor="#fffef9" />
                <stop offset="28%" stopColor="#f2e3c0" />
                <stop offset="64%" stopColor="#c39a62" />
                <stop offset="100%" stopColor="#805027" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#7d746a" />
                <stop offset="28%" stopColor="#34312f" />
                <stop offset="66%" stopColor="#141312" />
                <stop offset="100%" stopColor="#040404" />
              </>
            )
          )}
        </linearGradient>
        <linearGradient id={shadeId} x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={isWhite ? "0.35" : "0.12"} />
          <stop offset="48%" stopColor="#ffffff" stopOpacity={isWhite ? "0.10" : "0.05"} />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.24" />
        </linearGradient>
        <linearGradient id={edgeId} x1="0%" y1="0%" x2="100%" y2="100%">
          {isWhite ? (
            <>
              <stop offset="0%" stopColor="#fff8ea" />
              <stop offset="100%" stopColor="#6a4524" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#a7a09a" />
              <stop offset="100%" stopColor="#000000" />
            </>
          )}
        </linearGradient>
        <radialGradient id={sheenId} cx="35%" cy="15%" r="70%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.42" />
          <stop offset="46%" stopColor="#ffffff" stopOpacity="0.10" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <filter id={shadowId} x="-30%" y="-30%" width="160%" height="180%">
          <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#000" floodOpacity="0.45" />
          <feDropShadow dx="0" dy="10" stdDeviation="5.5" floodColor="#000" floodOpacity="0.22" />
        </filter>
      </defs>

      <ellipse cx="50" cy="81" rx="18" ry="6" fill="#000" opacity="0.24" />
      <g filter={`url(#${shadowId})`} transform="translate(0 1)">
        <path d={SILHOUETTES[kind]} fill={`url(#${bodyId})`} stroke={`url(#${edgeId})`} strokeWidth="1.6" strokeLinejoin="round" />
        <path d={SILHOUETTES[kind]} fill={`url(#${shadeId})`} stroke="none" transform="translate(0.8 -0.8)" opacity="0.95" />
        <path d={SILHOUETTES[kind]} fill={`url(#${sheenId})`} stroke="none" transform="translate(-1.2 -1.2)" opacity="0.72" />
      </g>
    </svg>
  );
}
