import type { Metadata } from "next";
import { Source_Sans_3 } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const sans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-source",
});

export const metadata: Metadata = {
  title: "CardFit — RBC Card Explorer",
  description: "Compare current RBC personal credit cards for a spending profile. Independent portfolio prototype.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${sans.variable} font-sans antialiased`}>
        <header className="border-b border-line bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
            <Link href="/" className="flex items-center gap-3">
              <span className="h-8 w-1.5 rounded-full bg-gold" aria-hidden />
              <span>
                <span className="block text-lg font-semibold leading-none text-navy">CardFit</span>
                <span className="text-sm text-muted">RBC card explorer</span>
              </span>
            </Link>
            <nav className="flex gap-4 text-sm font-semibold text-navy">
              <Link href="/">Compare</Link>
              <Link href="/sources/">Sources</Link>
            </nav>
          </div>
        </header>
        {children}
        <footer className="mx-auto max-w-6xl px-4 py-8 text-sm leading-6 text-muted" data-testid="footer">
          Independent portfolio prototype. Not affiliated with RBC. Estimates depend on spending, redemption assumptions, and current product terms; approval is assessed by the issuer.
        </footer>
      </body>
    </html>
  );
}
