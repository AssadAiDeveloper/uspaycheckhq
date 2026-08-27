"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calculator as CalculatorIcon,
  Wallet,
  MapPin,
  Users,
  CalendarClock,
  DollarSign,
  PiggyBank,
  HeartPulse,
  MinusCircle,
  ChevronDown,
} from "lucide-react";
import { calculatePaycheck } from "@/lib/engine/calculator";
import type {
  FilingStatus,
  PayFrequency,
  StateCode,
} from "@/lib/engine/calculator";
import { getAllStates } from "@/lib/engine/state";
import { stateCodeToSlug } from "@/lib/utils/slug";
import PaycheckSummaryCard from "@/components/PaycheckSummaryCard";
import TaxBreakdownTable from "@/components/TaxBreakdownTable";
import AdSlotPlaceholder from "@/components/AdSlotPlaceholder";
import DownloadResultsButton from "@/components/DownloadResultsButton";

const ALL_STATES = getAllStates().sort((a, b) => a.name.localeCompare(b.name));

const PAY_FREQUENCY_OPTIONS: { value: PayFrequency; label: string }[] = [
  { value: "weekly", label: "Weekly (52/yr)" },
  { value: "biweekly", label: "Biweekly (26/yr)" },
  { value: "semimonthly", label: "Semimonthly (24/yr)" },
  { value: "monthly", label: "Monthly (12/yr)" },
  { value: "annually", label: "Annually (1/yr)" },
];

const FILING_STATUS_OPTIONS: { value: FilingStatus; label: string }[] = [
  { value: "single", label: "Single" },
  { value: "marriedJoint", label: "Married filing jointly" },
  { value: "marriedSeparate", label: "Married filing separately" },
  { value: "headOfHousehold", label: "Head of household" },
];

interface PaycheckCalculatorProps {
  /** Pre-selects a state, used by the [state]/page.tsx pSEO route. */
  defaultStateCode?: StateCode;
}

export default function PaycheckCalculator({
  defaultStateCode = "CA",
}: PaycheckCalculatorProps) {
  const router = useRouter();
  // stateCode always mirrors the page's URL (via the `key={stateCode}` remount
  // on [state]/page.tsx) — changing it now navigates to that state's full
  // page instead of mutating local state, so this is a plain constant.
  const stateCode = defaultStateCode;
  const [filingStatus, setFilingStatus] = useState<FilingStatus>("single");
  const [payFrequency, setPayFrequency] = useState<PayFrequency>("biweekly");
  const [grossPayInput, setGrossPayInput] = useState<string>("2500");
  const [retirement401kInput, setRetirement401kInput] = useState<string>("0");
  const [section125Input, setSection125Input] = useState<string>("0");
  const [postTaxInput, setPostTaxInput] = useState<string>("0");

  const grossPay = Math.max(0, parseFloat(grossPayInput) || 0);
  const retirement401k = Math.max(0, parseFloat(retirement401kInput) || 0);
  const section125 = Math.max(0, parseFloat(section125Input) || 0);
  const postTax = Math.max(0, parseFloat(postTaxInput) || 0);

  // Client-side-only recalculation keeps Interaction to Next Paint low —
  // no network round trip on every keystroke.
  const breakdown = useMemo(
    () =>
      calculatePaycheck({
        stateCode,
        filingStatus,
        payFrequency,
        grossPayPerPeriod: grossPay,
        retirement401kDeduction: retirement401k,
        section125Deduction: section125,
        postTaxDeductions: postTax,
      }),
    [
      stateCode,
      filingStatus,
      payFrequency,
      grossPay,
      retirement401k,
      section125,
      postTax,
    ]
  );

  const selectedState = ALL_STATES.find((s) => s.code === stateCode);
  const filingStatusLabel =
    FILING_STATUS_OPTIONS.find((o) => o.value === filingStatus)?.label ??
    filingStatus;
  const payFrequencyLabel =
    PAY_FREQUENCY_OPTIONS.find((o) => o.value === payFrequency)?.label ??
    payFrequency;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px] print:block">
      {/* Print-only header: shown solely inside the "Download results (PDF)"
          print output, since the interactive form below is hidden there. */}
      <div className="print-only col-span-full mb-2">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-emerald-950"
          >
            <Wallet className="h-4.5 w-4.5" strokeWidth={2.25} />
          </span>
          <span className="text-lg font-semibold text-slate-900">
            USPaycheck<span className="text-emerald-600">HQ</span>
          </span>
        </div>
        <h1 className="mt-3 text-xl font-semibold text-slate-900">
          {selectedState?.name ?? "US"} Paycheck Calculator
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Generated {new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}{" "}
          · {filingStatusLabel} · {payFrequencyLabel} · Gross pay per period:{" "}
          {grossPay.toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
          })}
          {retirement401k > 0 &&
            ` · 401(k): ${retirement401k.toLocaleString("en-US", { style: "currency", currency: "USD" })}`}
          {section125 > 0 &&
            ` · HSA/FSA: ${section125.toLocaleString("en-US", { style: "currency", currency: "USD" })}`}
          {postTax > 0 &&
            ` · Post-tax deductions: ${postTax.toLocaleString("en-US", { style: "currency", currency: "USD" })}`}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Estimate only — not tax or legal advice. See uspaycheckhq.com/about
          for methodology.
        </p>
      </div>

      <div className="space-y-6">
        {/* Input form — hidden from the printed/downloaded results, since
            it's inputs rather than output. */}
        <div className="print:hidden rounded-[var(--radius-card)] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span
              aria-hidden
              className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
            >
              <CalculatorIcon className="h-4.5 w-4.5" strokeWidth={2} />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-ink-900)]">
                US Paycheck Calculator
              </h2>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                2026 federal, state &amp; FICA withholding —{" "}
                {selectedState?.name ?? "all 50 states"}
                {selectedState && !selectedState.hasIncomeTax
                  ? " (no state income tax)"
                  : ""}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="State" icon={<MapPin className="h-3.5 w-3.5" />}>
              <SelectWrapper>
                <select
                  value={stateCode}
                  onChange={(e) => {
                    const newCode = e.target.value as StateCode;
                    // Navigate to that state's dedicated page — this updates
                    // the ENTIRE page (tax bracket table, salary examples,
                    // FAQs, meta tags), not just the calculator's numbers,
                    // since those sections are tied to the URL, not just the
                    // calculator's internal state.
                    router.push(`/${stateCodeToSlug(newCode)}`);
                  }}
                  className={SELECT_CLASS}
                  aria-label="State"
                >
                  {ALL_STATES.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.name}
                      {!s.hasIncomeTax ? " (no income tax)" : ""}
                    </option>
                  ))}
                </select>
              </SelectWrapper>
            </Field>

            <Field
              label="Filing status"
              icon={<Users className="h-3.5 w-3.5" />}
            >
              <SelectWrapper>
                <select
                  value={filingStatus}
                  onChange={(e) =>
                    setFilingStatus(e.target.value as FilingStatus)
                  }
                  className={SELECT_CLASS}
                  aria-label="Filing status"
                >
                  {FILING_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </SelectWrapper>
            </Field>

            <Field
              label="Pay frequency"
              icon={<CalendarClock className="h-3.5 w-3.5" />}
            >
              <SelectWrapper>
                <select
                  value={payFrequency}
                  onChange={(e) =>
                    setPayFrequency(e.target.value as PayFrequency)
                  }
                  className={SELECT_CLASS}
                  aria-label="Pay frequency"
                >
                  {PAY_FREQUENCY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </SelectWrapper>
            </Field>

            <Field
              label="Gross pay per period"
              icon={<DollarSign className="h-3.5 w-3.5" />}
            >
              <CurrencyInput value={grossPayInput} onChange={setGrossPayInput} />
            </Field>
          </div>

          <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Pre-tax &amp; post-tax deductions (optional)
            </p>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              <Field
                label="401(k) / 403(b) retirement"
                icon={<PiggyBank className="h-3.5 w-3.5" />}
                hint="Lowers federal & state tax — still subject to FICA"
              >
                <CurrencyInput
                  value={retirement401kInput}
                  onChange={setRetirement401kInput}
                />
              </Field>

              <Field
                label="HSA / FSA / pre-tax premiums"
                icon={<HeartPulse className="h-3.5 w-3.5" />}
                hint="Lowers federal, state tax & FICA"
              >
                <CurrencyInput
                  value={section125Input}
                  onChange={setSection125Input}
                />
              </Field>

              <Field
                label="Post-tax deductions"
                icon={<MinusCircle className="h-3.5 w-3.5" />}
              >
                <CurrencyInput value={postTaxInput} onChange={setPostTaxInput} />
              </Field>
            </div>
          </div>
        </div>

        <AdSlotPlaceholder variant="top-banner" />

        <TaxBreakdownTable breakdown={breakdown} />
      </div>

      <div className="space-y-6">
        <PaycheckSummaryCard breakdown={breakdown} />
        <DownloadResultsButton />
        <AdSlotPlaceholder variant="sidebar" className="lg:sticky lg:top-20" />
      </div>
    </div>
  );
}

const SELECT_CLASS =
  "w-full appearance-none rounded-[var(--radius-control)] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 pl-3 pr-9 text-sm text-[var(--color-ink-900)] transition-colors focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600";

function SelectWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-slate-500"
      />
    </div>
  );
}

function Field({
  label,
  icon,
  hint,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
        {icon && (
          <span aria-hidden className="text-slate-400 dark:text-slate-500">
            {icon}
          </span>
        )}
        {label}
      </span>
      {children}
      {hint && (
        <span className="mt-1 block text-[11px] leading-snug text-slate-400 dark:text-slate-500">
          {hint}
        </span>
      )}
    </label>
  );
}

function CurrencyInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-400 dark:text-slate-500">
        $
      </span>
      <input
        type="number"
        inputMode="decimal"
        min={0}
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="tabular-figure w-full rounded-[var(--radius-control)] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 pl-7 pr-3 text-sm text-[var(--color-ink-900)] transition-colors focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
      />
    </div>
  );
}
