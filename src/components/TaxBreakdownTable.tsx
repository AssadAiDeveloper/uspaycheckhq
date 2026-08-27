import type { PaycheckBreakdown } from "@/lib/engine/calculator";
import { PAY_PERIODS_PER_YEAR } from "@/lib/engine/federal";

function formatCurrency(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

interface TaxBreakdownTableProps {
  breakdown: PaycheckBreakdown;
}

interface LineItem {
  label: string;
  perPeriod: number;
  rate?: string;
}

export default function TaxBreakdownTable({
  breakdown,
}: TaxBreakdownTableProps) {
  const periodsPerYear = PAY_PERIODS_PER_YEAR[breakdown.input.payFrequency];

  const federalItems: LineItem[] = [
    {
      label: "Federal income tax",
      perPeriod: breakdown.federal.incomeTax,
      rate: `${formatPercent(breakdown.federal.marginalRate)} marginal`,
    },
    { label: "Social Security (6.2%)", perPeriod: breakdown.federal.socialSecurity },
    { label: "Medicare (1.45%)", perPeriod: breakdown.federal.medicare },
    ...(breakdown.federal.additionalMedicare > 0
      ? [{ label: "Additional Medicare (0.9%)", perPeriod: breakdown.federal.additionalMedicare }]
      : []),
  ];

  const stateItems: LineItem[] = breakdown.state.hasIncomeTax
    ? [
        {
          label: `${breakdown.state.stateName} income tax`,
          perPeriod: breakdown.state.incomeTax,
          rate: breakdown.state.marginalRate
            ? `${formatPercent(breakdown.state.marginalRate)} marginal`
            : undefined,
        },
      ]
    : [];

  const specialItems: LineItem[] = breakdown.state.specialPayrollTaxes.map(
    (tax) => ({
      label: tax.label,
      perPeriod: tax.taxPerPeriod,
      rate: `${formatPercent(tax.rate)}`,
    })
  );

  return (
    <div className="rounded-[var(--radius-card)] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="border-b border-slate-200 dark:border-slate-800 px-5 py-3">
        <h2 className="text-sm font-semibold text-[var(--color-ink-900)]">
          Itemized tax breakdown
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-left text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <th className="px-5 py-2 font-medium">Item</th>
              <th className="px-5 py-2 font-medium text-right">
                Per pay period
              </th>
              <th className="px-5 py-2 font-medium text-right">Annual</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            <SectionHeader label="Federal" />
            {federalItems.map((item) => (
              <ItemRow key={item.label} item={item} periodsPerYear={periodsPerYear} />
            ))}

            {stateItems.length > 0 && (
              <>
                <SectionHeader label="State income tax" />
                {stateItems.map((item) => (
                  <ItemRow
                    key={item.label}
                    item={item}
                    periodsPerYear={periodsPerYear}
                  />
                ))}
              </>
            )}

            {specialItems.length > 0 && (
              <>
                <SectionHeader label="State payroll programs" />
                {specialItems.map((item) => (
                  <ItemRow
                    key={item.label}
                    item={item}
                    periodsPerYear={periodsPerYear}
                  />
                ))}
              </>
            )}

            <tr className="bg-slate-50 dark:bg-slate-800/60">
              <td className="px-5 py-3 text-sm font-semibold text-[var(--color-ink-900)]">
                Total taxes &amp; deductions
              </td>
              <td className="tabular-figure px-5 py-3 text-right text-sm font-semibold text-[var(--color-ink-900)]">
                {formatCurrency(breakdown.totalTaxesAndDeductions)}
              </td>
              <td className="tabular-figure px-5 py-3 text-right text-sm font-semibold text-[var(--color-ink-900)]">
                {formatCurrency(breakdown.totalTaxesAndDeductions * periodsPerYear)}
              </td>
            </tr>
            <tr className="bg-emerald-50 dark:bg-emerald-950/40">
              <td className="px-5 py-3 text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                Net pay
              </td>
              <td className="tabular-figure px-5 py-3 text-right text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                {formatCurrency(breakdown.netPay)}
              </td>
              <td className="tabular-figure px-5 py-3 text-right text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                {formatCurrency(breakdown.annualized.netPay)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {breakdown.state.notes && (
        <p className="border-t border-slate-100 dark:border-slate-800 px-5 py-3 text-xs text-slate-500 dark:text-slate-400">
          {breakdown.state.notes}
        </p>
      )}
    </div>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <tr>
      <td
        colSpan={3}
        className="bg-white dark:bg-slate-900 px-5 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500"
      >
        {label}
      </td>
    </tr>
  );
}

function ItemRow({
  item,
  periodsPerYear,
}: {
  item: LineItem;
  periodsPerYear: number;
}) {
  return (
    <tr>
      <td className="px-5 py-2 text-slate-700 dark:text-slate-300">
        {item.label}
        {item.rate && (
          <span className="ml-2 text-xs text-slate-400 dark:text-slate-500">{item.rate}</span>
        )}
      </td>
      <td className="tabular-figure px-5 py-2 text-right text-slate-700 dark:text-slate-300">
        {formatCurrency(item.perPeriod)}
      </td>
      <td className="tabular-figure px-5 py-2 text-right text-slate-700 dark:text-slate-300">
        {formatCurrency(item.perPeriod * periodsPerYear)}
      </td>
    </tr>
  );
}
