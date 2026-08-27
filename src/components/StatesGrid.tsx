import Link from "next/link";
import { getAllStates } from "@/lib/engine/state";
import type { StateCode } from "@/lib/engine/state";
import { stateCodeToSlug } from "@/lib/utils/slug";

interface StatesGridProps {
  /** Excludes this state from the grid (used on a state's own page, since linking to itself is pointless). */
  excludeCode?: StateCode;
}

/**
 * The full, alphabetical 50-states + DC directory. Rendered on the homepage
 * AND on every individual state page so a visitor can always jump to any
 * other state without navigating back to "/" first — this is the internal
 * link mesh the site's pSEO structure depends on for both crawlability and
 * usability.
 */
export default function StatesGrid({ excludeCode }: StatesGridProps) {
  const allStates = getAllStates()
    .filter((s) => s.code !== excludeCode)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {allStates.map((s) => (
        <Link
          key={s.code}
          href={`/${stateCodeToSlug(s.code)}`}
          className="rounded-[var(--radius-control)] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:border-emerald-600 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
        >
          {s.name}
        </Link>
      ))}
    </div>
  );
}
