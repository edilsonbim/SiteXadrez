import "./globals.css";
import type { Metadata } from "next";
import { Inter, Cinzel } from "next/font/google";
import { TopNav } from "@/components/TopNav";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const cinzel = Cinzel({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "Rookary Chess",
  description: "Rookary Chess: xadrez online com login, IA por nivel e partidas PvP.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${cinzel.variable} dark`}>
      <body className="min-h-screen bg-bg text-ink antialiased">
        <Providers>
          <TopNav />
          <main className="container mx-auto py-6 relative z-10">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
