import type { Metadata } from "next";
import Link from "next/link";
import PaycheckCalculator from "@/components/PaycheckCalculator";
import AdSlotPlaceholder from "@/components/AdSlotPlaceholder";
import StatesGrid from "@/components/StatesGrid";
import { getAllStates } from "@/lib/engine/state";
import { stateCodeToSlug } from "@/lib/utils/slug";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const POPULAR_STATE_CODES = [
  "CA",
  "TX",
  "NY",
  "FL",
  "IL",
  "PA",
  "OH",
  "GA",
  "NC",
  "WA",
  "AZ",
  "CO",
] as const;

export default function HomePage() {
  const allStates = getAllStates().sort((a, b) => a.name.localeCompare(b.name));
  const popularStates = allStates.filter((s) =>
    (POPULAR_STATE_CODES as readonly string[]).includes(s.code)
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="print:hidden mb-1 text-xl font-semibold text-[var(--color-ink-900)]">
        Free US Paycheck Calculator — All 50 States (2026)
      </h1>
      <p className="print:hidden mb-6 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
        Estimate your take-home pay after federal tax, FICA, and state
        withholding — salary or hourly, weekly or biweekly, for any US state.
      </p>

      <PaycheckCalculator defaultStateCode="CA" />

      <section id="states" className="print:hidden mt-12 scroll-mt-20">
        <h2 className="text-base font-semibold text-[var(--color-ink-900)]">
          Paycheck calculators by state
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Every state has its own income tax rules — jump straight to your
          state for pre-filled brackets, minimum wage, and a dedicated FAQ.
        </p>

        <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
          Popular states
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {popularStates.map((s) => (
            <Link
              key={s.code}
              href={`/${stateCodeToSlug(s.code)}`}
              className="rounded-[var(--radius-control)] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:border-emerald-600 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
            >
              {s.name}
            </Link>
          ))}
        </div>

        <p className="mt-6 text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
          All 50 states + DC
        </p>
        <div className="mt-2">
          <StatesGrid />
        </div>
      </section>

      <div className="print:hidden mt-8">
        <AdSlotPlaceholder variant="bottom-banner" />
      </div>
    </div>
  );
}
