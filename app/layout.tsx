import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./performance/performance.css";
export const metadata: Metadata = {
  title: "Performance — Seu próximo nível",
  description: "Seu treino, seu ritmo. Treinos, séries, descanso e evolução em uma experiência feita para o mobile.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  appleWebApp: { capable: true, statusBarStyle: "black", title: "Performance" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#000000" };
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="pt-BR"><body>{children}</body></html>;}
