import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "Mentoría 2 · Evidencia, métricas y decisiones",
  description:
    "Tablero de la Ruta de Crecimiento Inteligente: audita la evidencia, interpreta las métricas y define el segundo ciclo de ejecución.",
};

export const viewport: Viewport = {
  themeColor: "#042433",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${sans.variable} ${mono.variable}`}>
      <body>
        <nav className="sticky top-0 z-40 border-b border-casco-700 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold text-pizarra-oscuro">📊 EAN Mentorías</h1>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Link
                href="/"
                className="rounded-lg px-3 py-2 font-medium transition hover:bg-casco-950/5"
              >
                📋 Mentoría 2
              </Link>
              <Link
                href="/prototipado"
                className="rounded-lg px-3 py-2 font-medium transition hover:bg-casco-950/5"
              >
                🚀 Prototipado
              </Link>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
