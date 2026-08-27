import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import Script from "next/script";
import { Wallet } from "lucide-react";
import ThemeProvider from "@/components/ThemeProvider";
import ThemeToggle from "@/components/ThemeToggle";
import HeaderNav from "@/components/HeaderNav";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://uspaycheckhq.com"),
  title: {
    default:
      "USPaycheckHQ — Free US Paycheck & Salary Calculator (All 50 States)",
    template: "%s | USPaycheckHQ",
  },
  description:
    "Calculate your exact take-home pay for any US state in seconds. Free federal, state, FICA, salary, and hourly paycheck calculator covering all 50 states, updated for 2026 tax brackets.",
  openGraph: {
    type: "website",
    siteName: "USPaycheckHQ",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
  verification: {
    <meta name="google-site-verification" content="googlea2cefaf54c271783"/>
<meta name="google-site-verification" content="1ddA7QWRzhtNYKopCS3PCi8MLdN2ubA3JLM8ZFfX8Yk"/>
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen flex flex-col">
        {/* Google tag (gtag.js) — loaded with next/script for optimal
            loading (doesn't block initial page render/hydration). */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-QTJFBG4S8D"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-QTJFBG4S8D');
          `}
        </Script>

        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-white dark:focus:bg-slate-900 focus:px-3 focus:py-2 focus:rounded-md focus:border focus:border-slate-300 dark:focus:border-slate-700"
          >
            Skip to content
          </a>

          <header className="print:hidden sticky top-0 z-40 border-b border-slate-800 bg-[var(--color-brand-navy)]">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex h-14 items-center justify-between">
                <Link
                  href="/"
                  className="flex items-center gap-2.5 text-white font-semibold tracking-tight"
                >
                  <span
                    aria-hidden
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-emerald-950"
                  >
                    <Wallet className="h-4.5 w-4.5" strokeWidth={2.25} />
                  </span>
                  <span className="text-[15px] leading-none">
                    USPaycheck<span className="text-emerald-400">HQ</span>
                  </span>
                </Link>
                <div className="flex items-center gap-4">
                  <HeaderNav />
                  <div className="h-5 w-px bg-slate-700" aria-hidden />
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </header>

          <main id="main-content" className="flex-1">
            {children}
          </main>

          <footer className="print:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <p className="max-w-2xl text-sm text-slate-500 dark:text-slate-400">
                  USPaycheckHQ provides free paycheck estimates for
                  informational purposes only and is not tax, legal, or
                  financial advice. Figures reflect 2026 federal and state tax
                  parameters and are approximations of actual payroll
                  withholding — always verify your withholding with your
                  employer&apos;s payroll provider or a licensed tax
                  professional.
                </p>
                <nav
                  aria-label="Footer"
                  className="flex shrink-0 flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500 dark:text-slate-400"
                >
                  <Link
                    href="/about"
                    className="hover:text-emerald-700 dark:hover:text-emerald-400"
                  >
                    Methodology
                  </Link>
                  <Link
                    href="/privacy"
                    className="hover:text-emerald-700 dark:hover:text-emerald-400"
                  >
                    Privacy Policy
                  </Link>
                  <Link
                    href="/"
                    className="hover:text-emerald-700 dark:hover:text-emerald-400"
                  >
                    Calculator
                  </Link>
                </nav>
              </div>
              <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
                © {new Date().getFullYear()} USPaycheckHQ. All rights reserved.
              </p>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
