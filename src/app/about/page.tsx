import type { Metadata } from "next";
import Link from "next/link";
import { Mail } from "lucide-react";
import { getAllStates } from "@/lib/engine/state";
import { stateCodeToSlug } from "@/lib/utils/slug";

export const metadata: Metadata = {
  title: "About & Methodology",
  description:
    "How USPaycheckHQ calculates federal, state, and FICA payroll withholding for 2026 — data sources, assumptions, and limitations.",
  alternates: { canonical: "/about" },
};

const POPULAR_STATE_CODES = ["CA", "TX", "NY", "FL", "WA", "IL"] as const;

export default function AboutPage() {
  // Dynamic month, computed at generation time — the site rebuilds
  // periodically as data is reviewed, so this naturally stays current
  // without a hardcoded string to remember to update. The "2026" tax year
  // itself stays fixed here since that's the actual dataset this page
  // describes, independent of the calendar date.
  const currentMonth = new Date().toLocaleString("en-US", { month: "long" });

  const allStates = getAllStates();
  const popularStates = POPULAR_STATE_CODES.map(
    (code) => allStates.find((s) => s.code === code)!
  ).filter(Boolean);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-[var(--color-ink-900)]">
        About USPaycheckHQ
      </h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Last updated: {currentMonth} 2026 · Federal and state parameters
        reviewed for the 2026 tax year
      </p>

      <div className="mt-8 space-y-10 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        <section>
          <h2 className="text-lg font-semibold text-[var(--color-ink-900)]">
            What this calculator does
          </h2>
          <p className="mt-3">
            USPaycheckHQ estimates take-home pay for W-2 employees in any
            US state. Enter a gross pay amount, pay frequency, filing status,
            and state, and the calculator returns an itemized breakdown:
            federal income tax, Social Security, Medicare, state income tax
            (where applicable), and state-mandated payroll programs such as
            disability or paid-family-leave insurance.
          </p>
          <p className="mt-3">
            Every calculation runs entirely in your browser. No paycheck
            data you enter is transmitted to our servers, logged, or stored —
            see our{" "}
            <Link
              href="/privacy"
              className="text-emerald-700 underline hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              Privacy Policy
            </Link>{" "}
            for details.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--color-ink-900)]">
            Data sources
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <strong>Federal income tax brackets, standard deductions, and
              AMT parameters</strong> — IRS Revenue Procedure 2025-32 (the
              2026 inflation-adjusted figures released under the One Big
              Beautiful Bill Act).
            </li>
            <li>
              <strong>Social Security and Medicare (FICA)</strong> — the
              Social Security Administration&apos;s 2026 contribution and
              benefit base announcement ($184,500 wage base) and IRS Topic
              751 for the Additional Medicare Tax.
            </li>
            <li>
              <strong>State income tax brackets, standard deductions, and
              exemptions</strong> — Tax Foundation, &quot;State Individual
              Income Tax Rates and Brackets, 2026&quot; (published February
              2026), cross-checked against individual state Department of
              Revenue guidance where noted.
            </li>
            <li>
              <strong>State payroll programs</strong> (SDI, PFL, FAMLI, WA
              Cares) — each program&apos;s administering state agency (EDD,
              NJ DOL, NY WCB, CO FAMLI Division, MA DFML, WA ESD).
            </li>
            <li>
              <strong>Minimum wage rates</strong> — U.S. Department of Labor
              Consolidated Minimum Wage Table.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--color-ink-900)]">
            Methodology &amp; assumptions
          </h2>
          <p className="mt-3">
            Federal and state withholding are estimated by annualizing your
            entered gross pay, applying the relevant standard deduction, then
            applying that jurisdiction&apos;s progressive or flat tax
            brackets to the result, and dividing back down to a per-period
            figure. This mirrors how annual tax liability is actually
            computed, and is the standard approach used by consumer-facing
            paycheck estimators.
          </p>
          <p className="mt-3">
            It is <em>not</em> identical to the IRS Publication 15-T
            percentage-method tables that employers&apos; payroll systems use
            for per-paycheck withholding, which apply a separate annualized
            wage-bracket schedule and account for Form W-4 elections in more
            detail. For most taxpayers claiming the standard deduction with
            no unusual credits, the two approaches produce very similar
            results — but this tool is an <strong>estimate</strong>, not a
            substitute for your employer&apos;s payroll calculation or a
            filed tax return.
          </p>
          <p className="mt-3">
            The <strong>Effective Tax Rate</strong> shown is total mandatory
            withholding (federal income tax + Social Security + Medicare +
            state income tax + any state payroll programs) divided by gross
            pay. It intentionally excludes voluntary pre-tax and post-tax
            deductions (401(k) contributions, HSA contributions, wage
            garnishments, etc.), since those are not taxes.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--color-ink-900)]">
            Known limitations
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <strong>Local and city income taxes are not included</strong> —
              for example, New York City and Yonkers surtaxes, Ohio and
              Pennsylvania municipal income taxes, and Maryland county
              &quot;piggyback&quot; taxes. If you live or work in one of
              these jurisdictions, your actual take-home pay will be lower
              than this estimate.
            </li>
            <li>
              Head-of-household state tax brackets are not separately
              published by most states; where a state doesn&apos;t define
              its own schedule, we apply the single-filer brackets as a
              standard approximation.
            </li>
            <li>
              A small number of state payroll program rates for the 2026
              calendar year (notably Rhode Island TDI and Washington PFML)
              were not yet officially published at the time of our last data
              review and are therefore omitted rather than estimated.
            </li>
            <li>
              This tool assumes standard W-2 employment. It does not model
              self-employment tax, itemized deductions, the Alternative
              Minimum Tax, tax credits beyond a simple dependent-credit
              input, or multi-state work situations.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--color-ink-900)]">
            How often is this updated?
          </h2>
          <p className="mt-3">
            Federal brackets, FICA limits, and most state brackets adjust
            annually every January. We review and update every figure on this
            site at the start of each tax year, and again whenever a state
            enacts a rate change with a within-year effective date (as
            several states did for 2026 — see the Georgia, Ohio, and South
            Carolina pages for examples of mid-year and phased-in rate
            changes).
          </p>
        </section>

        <section className="rounded-[var(--radius-card)] border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-800/60">
          <h2 className="text-base font-semibold text-[var(--color-ink-900)]">
            Not tax, legal, or financial advice
          </h2>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            USPaycheckHQ is an independent educational tool. It is not
            affiliated with the IRS, the Social Security Administration, or
            any state tax agency. For guidance specific to your situation,
            consult a licensed CPA, tax attorney, or your employer&apos;s
            payroll department.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--color-ink-900)]">
            Explore paycheck calculators by state
          </h2>
          <p className="mt-3">
            Every state has its own tax brackets, standard deductions, and
            payroll programs. Jump straight to one of the most-visited state
            pages below, or browse the full 50-state directory from the
            homepage.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {popularStates.map((s) => (
              <Link
                key={s.code}
                href={`/${stateCodeToSlug(s.code)}`}
                className="rounded-[var(--radius-control)] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-center text-sm text-slate-700 dark:text-slate-300 hover:border-emerald-600 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
              >
                {s.name}
              </Link>
            ))}
          </div>
          <Link
            href="/#states"
            className="mt-3 inline-block text-sm font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            View all 50 states + DC →
          </Link>
        </section>

        <section className="border-t border-slate-200 dark:border-slate-800 pt-8">
          <h2 className="text-lg font-semibold text-[var(--color-ink-900)]">
            Questions or Feedback?
          </h2>
          <p className="mt-3">
            Found a figure that looks off, have a data source we should
            check, or just want to say hello? We&apos;d genuinely like to
            hear from you — every report helps us keep this tool accurate.
          </p>
          <a
            href="mailto:support@uspaycheckhq.com"
            className="mt-4 inline-flex items-center gap-2 rounded-[var(--radius-control)] border border-emerald-600 bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 hover:border-emerald-700"
          >
            <Mail className="h-4 w-4" aria-hidden />
            support@uspaycheckhq.com
          </a>
        </section>
      </div>
    </div>
  );
}
