"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Chrome } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loginWithPassword(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setError(j.error === "invalid_credentials" ? "Email ou senha incorretos." : "Erro ao entrar.");
        return;
      }
      router.push("/lobby");
      router.refresh();
    } catch {
      setError("Erro de rede.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl bg-bg-card border border-line p-8 text-center space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Acessar o Rookary</h1>
        <p className="text-ink-soft text-sm mt-1">Entre com Google, email e senha, ou siga como convidado para uma partida rápida.</p>
      </div>

      <Button
        onClick={() => signIn("google", { callbackUrl: "/lobby" })}
        size="lg"
        className="w-full"
      >
        <Chrome className="h-5 w-5" /> Entrar com Google
      </Button>

      <div className="flex items-center gap-3 text-xs text-ink-soft">
        <span className="flex-1 h-px bg-line" />
        <span>ou</span>
        <span className="flex-1 h-px bg-line" />
      </div>

      <form onSubmit={loginWithPassword} className="space-y-3 text-left">
        <label className="block">
          <span className="block text-sm text-ink-soft mb-1">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full rounded-md bg-bg border border-line px-3 py-2 text-ink focus:outline-none focus:border-accent"
          />
        </label>
        <label className="block">
          <span className="block text-sm text-ink-soft mb-1">Senha</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            minLength={1}
            className="w-full rounded-md bg-bg border border-line px-3 py-2 text-ink focus:outline-none focus:border-accent"
          />
        </label>
        {error && <p className="text-bad text-sm">{error}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? "Entrando..." : "Entrar"}
        </Button>
      </form>

      <p className="text-xs text-ink-soft">
        Não tem conta? <a className="text-accent underline" href="/register">Criar conta</a>
      </p>

      <div className="flex items-center gap-3 text-xs text-ink-soft">
        <span className="flex-1 h-px bg-line" />
        <span>ou</span>
        <span className="flex-1 h-px bg-line" />
      </div>

      <form action="/api/auth/guest" method="POST">
        <Button type="submit" variant="secondary" size="lg" className="w-full">
          Entrar como convidado
        </Button>
      </form>
      <p className="text-[11px] text-ink-soft">
        Sessão temporária, sem histórico persistente.
      </p>
    </div>
  );
}
