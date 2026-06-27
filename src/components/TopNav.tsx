import Link from "next/link";
import { ChessIcon } from "./icons/ChessIcon";
import { AuthButton } from "./AuthButton";

export function TopNav() {
  return (
    <header className="border-b border-line bg-bg-soft/80 backdrop-blur sticky top-0 z-40">
      <div className="container mx-auto flex items-center justify-between gap-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-ink">
          <ChessIcon className="h-7 w-7 text-accent" />
          <span className="text-lg font-semibold tracking-tight">Xadrez Lobby</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm text-ink-soft">
          <Link className="hover:text-accent" href="/lobby">Lobby</Link>
          <Link className="hover:text-accent" href="/leaderboard">Leaderboard</Link>
          <Link className="hover:text-accent" href="/profile">Perfil</Link>
        </nav>
        <AuthButton />
      </div>
    </header>
  );
}
