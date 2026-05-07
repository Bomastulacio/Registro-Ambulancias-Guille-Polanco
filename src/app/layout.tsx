import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Space_Mono, Doto } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import clsx from "clsx";
import ThemeToggle from "@/components/ThemeToggle";
import NavLinks from "@/components/NavLinks";
import PWARegister from "@/components/PWARegister";
import InstallBanner from "@/components/InstallBanner";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const doto = Doto({
  variable: "--font-doto",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Registro de Ambulancias",
  description: "Registro de viajes de ambulancia - Guille Polanco",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Ambulancias",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={clsx(
          spaceGrotesk.variable,
          spaceMono.variable,
          doto.variable,
          "antialiased bg-background text-foreground min-h-screen flex flex-col dot-grid-subtle"
        )}
      >
        <header className="border-b border-nd-border-visible sticky top-0 bg-background/90 backdrop-blur z-50">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-baseline gap-4 justify-between w-full md:w-auto">
              <div className="flex items-baseline gap-4">
                <Link href="/" className="font-doto text-text-display text-xl tracking-tight">
                  AMBULANCIAS
                </Link>
                <span className="font-mono text-text-secondary text-label tracking-widest uppercase hidden sm:inline">
                  / GUILLE POLANCO
                </span>
              </div>
              <div className="md:hidden">
                <ThemeToggle />
              </div>
            </div>
            
            <NavLinks />
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8 md:py-12">
          {children}
        </main>

        <PWARegister />
        <InstallBanner />
      </body>
    </html>
  );
}
