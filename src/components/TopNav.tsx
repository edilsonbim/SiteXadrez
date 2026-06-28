import Link from "next/link";
import { ChessIcon } from "./icons/ChessIcon";
import { AuthButton } from "./AuthButton";

export function TopNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-bg/70 backdrop-blur-xl">
      <div className="container mx-auto flex items-center justify-between gap-4 py-4">
        <Link href="/" className="flex items-center gap-3 text-ink">
          <span className="grid h-12 w-12 place-items-center rounded-[1.1rem] bg-gradient-to-br from-accent/20 to-white/5 border border-white/10 shadow-glow">
            <span className="relative grid h-8 w-8 place-items-center rounded-full border border-accent/40 bg-bg/80">
              <ChessIcon className="h-5 w-5 text-accent" />
            </span>
          </span>
          <div className="leading-tight">
            <span className="block text-[1.05rem] font-semibold tracking-[0.34em] uppercase">Rookary</span>
            <span className="block text-[10px] text-ink-soft tracking-[0.42em] uppercase">Chess Platform</span>
          </div>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm text-ink-soft">
          <Link className="hover:text-accent" href="/lobby">Mesa</Link>
          <Link className="hover:text-accent" href="/leaderboard">Ranking</Link>
          <Link className="hover:text-accent" href="/profile">Conta</Link>
        </nav>
        <AuthButton />
      </div>
    </header>
  );
}
