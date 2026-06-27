"use client";

import { useEffect, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";

export function AuthButton() {
  const { data, status } = useSession();
  const [rating, setRating] = useState<number | null>(null);
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/me").then((r) => r.json()).then((j) => setRating(j?.user?.rating ?? null));
  }, [status]);
  if (status === "loading") return <span className="text-xs text-ink-soft">...</span>;
  if (!data?.user) {
    return <Button onClick={() => signIn("google")} size="sm">Entrar</Button>;
  }
  return (
    <div className="flex items-center gap-2">
      {rating !== null && <span className="text-xs text-ink-soft tabular-nums">{Math.round(rating)}</span>}
      <img src={data.user.image ?? ""} alt="" className="h-7 w-7 rounded-full border border-line" />
      <Button variant="ghost" size="sm" onClick={() => signOut()}>Sair</Button>
    </div>
  );
}
