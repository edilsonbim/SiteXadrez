"use client";

const ICONS = { K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙" } as const;

export function ChessIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect x="3" y="3" width="26" height="26" rx="4" fill="currentColor" opacity="0.15" />
      <text x="16" y="22" textAnchor="middle" fontSize="20" fill="currentColor" fontFamily="serif">{ICONS.K}</text>
    </svg>
  );
}
