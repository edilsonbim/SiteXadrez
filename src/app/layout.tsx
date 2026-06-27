import "./globals.css";
import type { Metadata } from "next";
import { TopNav } from "@/components/TopNav";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Xadrez Lobby",
  description: "Lobby de xadrez online com Google login, IA por nivel e partidas PvP.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="min-h-screen bg-bg text-ink antialiased">
        <Providers>
          <TopNav />
          <main className="container mx-auto py-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
