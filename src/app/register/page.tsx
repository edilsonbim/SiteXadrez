"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        if (j.error === "email_taken") setError("Esse email já tem conta.");
        else setError("Verifique os campos (senha: mínimo 8 caracteres).");
        return;
      }
      // Auto-login após cadastro
      const lr = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!lr.ok) {
        router.push("/login");
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
    <div className="mx-auto max-w-md space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Criar conta</CardTitle>
          <p className="text-ink-soft text-sm">Salve seu rating e histórico.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <Field label="Nome" value={name} onChange={setName} maxLength={32} required />
            <Field label="Email" type="email" value={email} onChange={setEmail} maxLength={120} required />
            <Field
              label="Senha"
              type="password"
              value={password}
              onChange={setPassword}
              minLength={8}
              maxLength={128}
              required
            />
            {error && <p className="text-bad text-sm">{error}</p>}
            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy ? "Criando..." : "Criar conta"}
            </Button>
          </form>
          <p className="text-xs text-ink-soft mt-4 text-center">
            Já tem conta? <a className="text-accent underline" href="/login">Entrar</a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label, value, onChange, type = "text", ...rest
}: {
  label: string;
  value: string;
  onChange: React.Dispatch<React.SetStateAction<string>>;
  type?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "type">) {
  return (
    <label className="block">
      <span className="block text-sm text-ink-soft mb-1">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md bg-bg border border-line px-3 py-2 text-ink focus:outline-none focus:border-accent"
        {...rest}
      />
    </label>
  );
}
