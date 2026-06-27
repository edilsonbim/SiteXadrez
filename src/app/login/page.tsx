import { signIn } from "@/server/auth";
import { Button } from "@/components/ui/Button";
import { Chrome } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md rounded-2xl bg-bg-card border border-line p-8 text-center space-y-6">
      <h1 className="text-2xl font-semibold">Entrar no Xadrez Lobby</h1>
      <p className="text-ink-soft">Use sua conta Google. Ao entrar pela primeira vez, voce recebe um rating inicial.</p>
      <form
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: "/lobby" });
        }}
      >
        <Button type="submit" size="lg" className="w-full">
          <Chrome className="h-5 w-5" /> Entrar com Google
        </Button>
      </form>
    </div>
  );
}
