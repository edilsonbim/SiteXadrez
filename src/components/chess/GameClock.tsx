"use client";

import { useEffect, useState } from "react";

export function GameClock({ seconds, active }: { seconds: number; active: boolean }) {
  const [s, setS] = useState(seconds);
  useEffect(() => setS(seconds), [seconds]);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setS((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(id);
  }, [active]);
  const mm = Math.floor(s / 60).toString().padStart(2, "0");
  const ss = (s % 60).toString().padStart(2, "0");
  return (
    <span className={`tabular-nums text-lg px-3 py-1.5 rounded-full border ${active ? "border-accent text-accent shadow-glow" : "border-white/10 text-ink-soft"} transition-all duration-200`}>
      {mm}:{ss}
    </span>
  );
}
