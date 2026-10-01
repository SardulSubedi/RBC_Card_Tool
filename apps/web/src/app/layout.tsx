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
      <body className={`${sans.variable} flex min-h-screen flex-col font-sans antialiased`}>
        <header className="sticky top-0 z-20 border-b border-line bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-rbc" aria-hidden>
                <span className="h-3.5 w-3.5 rounded-sm bg-gold" />
              </span>
              <span className="text-lg font-semibold leading-none text-ink">
                CardFit
                <span className="ml-2 hidden text-sm font-medium text-muted sm:inline">RBC card explorer</span>
              </span>
            </Link>
            <nav className="flex items-center gap-5 text-[15px] font-semibold text-rbc">
              <Link href="/" className="hover:underline">
                Compare
              </Link>
              <Link href="/sources/" className="hover:underline">
                Sources and method
              </Link>
            </nav>
          </div>
        </header>
        <div className="flex-1">{children}</div>
        <footer className="border-t border-line bg-white" data-testid="footer">
          <div className="mx-auto max-w-6xl px-5 py-6 text-sm leading-6 text-muted">
            Independent portfolio prototype. Not affiliated with RBC. Estimates depend on spending, redemption assumptions, and current product terms; approval is assessed by the issuer.
          </div>
        </footer>
      </body>
    </html>
  );
}
