"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { User } from "lucide-react";

export function AuthButton() {
  const { data, status } = useSession();
  const [rating, setRating] = useState<number | null>(null);
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/me").then((r) => r.json()).then((j) => setRating(j?.user?.rating ?? null));
  }, [status]);
  if (status === "loading") return <span className="text-xs text-ink-soft">...</span>;
  if (!data?.user) {
    return (
      <Link
        href="/login"
        className="inline-flex h-8 items-center rounded-md bg-accent px-3 text-sm font-medium text-black hover:bg-accent-soft"
      >
        Entrar
      </Link>
    );
  }
  const isGuest = (data.user as any).isGuest === true;
  const image = typeof data.user.image === "string" ? data.user.image.trim() : "";
  return (
    <div className="flex items-center gap-2">
      {!isGuest && rating !== null && (
        <span className="text-xs text-ink-soft tabular-nums">{Math.round(rating)}</span>
      )}
      {isGuest ? (
        <span className="inline-flex items-center gap-1 text-xs text-ink-soft">
          <User className="h-3.5 w-3.5" /> Convidado
        </span>
      ) : image ? (
        <img
          src={image}
          alt={data.user.name ?? "Jogador"}
          className="h-7 w-7 rounded-full border border-line object-cover bg-bg"
          onError={(e) => {
            const target = e.currentTarget;
            target.onerror = null;
            target.src = "";
            target.style.display = "none";
          }}
        />
      ) : (
        <span className="grid h-7 w-7 place-items-center rounded-full border border-line bg-bg text-[11px] font-semibold text-ink-soft">
          {(data.user.name?.[0] ?? "?").toUpperCase()}
        </span>
      )}
      <button
        className="text-sm text-ink-soft hover:text-ink px-2"
        onClick={() => signOut({ callbackUrl: "/" })}
      >
        Sair
      </button>
    </div>
  );
}
