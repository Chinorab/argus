import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Argus — l'inspection sanitaire avant l'inspecteur",
  description:
    "Photos, relevés de température, situation : Argus simule l'inspection DDPP de votre cuisine et prédit votre note Alim'confiance.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f4ef" },
    { media: "(prefers-color-scheme: dark)", color: "#131416" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <nav className="border-b border-line">
          <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
              <span aria-hidden className="inline-block h-5 w-5 rounded-full border-[3px] border-accent" />
              Argus
            </Link>
            <span className="text-xs text-ink-3">Nemotron sur Nebius Token Factory</span>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
