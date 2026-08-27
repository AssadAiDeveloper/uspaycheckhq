import type { PaycheckBreakdown } from "@/lib/engine/calculator";
import NetPayDonutChart from "@/components/NetPayDonutChart";

function formatCurrency(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

const FREQUENCY_LABEL: Record<string, string> = {
  weekly: "per week",
  biweekly: "per paycheck (biweekly)",
  semimonthly: "per paycheck (semimonthly)",
  monthly: "per month",
  annually: "per year",
};

interface PaycheckSummaryCardProps {
  breakdown: PaycheckBreakdown;
}

export default function PaycheckSummaryCard({
  breakdown,
}: PaycheckSummaryCardProps) {
  const frequencyLabel =
    FREQUENCY_LABEL[breakdown.input.payFrequency] ?? "per period";
  const takeHomePct =
    breakdown.grossPay > 0 ? breakdown.netPay / breakdown.grossPay : 0;

  return (
    <div className="rounded-[var(--radius-card)] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="border-b border-slate-200 dark:border-slate-800 px-5 py-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Net Pay — {frequencyLabel}
        </p>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="tabular-figure text-3xl font-semibold text-emerald-700 dark:text-emerald-400 sm:text-4xl">
            {formatCurrency(breakdown.netPay)}
          </span>
          <span className="tabular-figure rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            {formatPercent(takeHomePct)} of gross
          </span>
        </div>

        <div className="mt-4">
          <NetPayDonutChart
            takeHomeFraction={takeHomePct}
            netPayLabel="take-home pay"
          />
        </div>
      </div>

      {/* Gross Pay -> Pre-Tax -> Taxes -> Post-Tax -> Net Pay hierarchy */}
      <dl className="divide-y divide-slate-100 dark:divide-slate-800">
        <Row label="Gross pay" value={breakdown.grossPay} />
        {breakdown.retirement401kDeduction > 0 && (
          <Row
            label="401(k) / 403(b) retirement"
            value={-breakdown.retirement401kDeduction}
            muted
          />
        )}
        {breakdown.section125Deduction > 0 && (
          <Row
            label="HSA / FSA / pre-tax premiums"
            value={-breakdown.section125Deduction}
            muted
          />
        )}
        <Row
          label="Federal income tax"
          value={-breakdown.federal.incomeTax}
          muted
        />
        <Row
          label="Social Security + Medicare"
          value={-(breakdown.federal.socialSecurity + breakdown.federal.medicare + breakdown.federal.additionalMedicare)}
          muted
        />
        {breakdown.state.hasIncomeTax && (
          <Row
            label={`${breakdown.state.stateName} state tax`}
            value={-breakdown.state.incomeTax}
            muted
          />
        )}
        {breakdown.state.totalSpecialPayrollTax > 0 && (
          <Row
            label="State payroll programs (SDI/PFL/FAMLI)"
            value={-breakdown.state.totalSpecialPayrollTax}
            muted
          />
        )}
        <Row
          label="Post-tax deductions"
          value={-breakdown.postTaxDeductions}
          muted
        />
        <div className="flex items-center justify-between px-5 py-3 bg-slate-50 dark:bg-slate-800/60">
          <dt className="text-sm font-semibold text-[var(--color-ink-900)]">
            Net pay
          </dt>
          <dd className="tabular-figure text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            {formatCurrency(breakdown.netPay)}
          </dd>
        </div>
      </dl>

      <div className="grid grid-cols-2 gap-px bg-slate-100 dark:bg-slate-800">
        <div className="bg-white dark:bg-slate-900 px-3 py-3 sm:px-5">
          <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Annual net pay
          </p>
          <p className="tabular-figure text-base font-semibold text-[var(--color-ink-900)] sm:text-lg">
            {formatCurrency(breakdown.annualized.netPay)}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 px-3 py-3 sm:px-5">
          <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Effective tax rate
          </p>
          <p className="tabular-figure text-base font-semibold text-[var(--color-ink-900)] sm:text-lg">
            {formatPercent(breakdown.effectiveTaxRate)}
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: number;
  muted?: boolean;
}) {
  const isNegative = value < 0;
  return (
    <div className="flex items-start justify-between gap-3 px-5 py-2.5">
      <dt className="min-w-0 flex-1 text-sm text-slate-600 dark:text-slate-300">
        {label}
      </dt>
      <dd
        className={`tabular-figure shrink-0 text-sm font-medium ${
          isNegative
            ? "text-slate-500 dark:text-slate-400"
            : muted
              ? "text-slate-600 dark:text-slate-300"
              : "text-[var(--color-ink-900)]"
        }`}
      >
        {isNegative ? "−" : ""}
        {formatCurrency(Math.abs(value))}
      </dd>
    </div>
  );
}
