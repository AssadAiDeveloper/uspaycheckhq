import type { StateCode } from "@/lib/engine/state";
import { getStateMetadata } from "@/lib/engine/state";
import minimumWageData from "@/lib/data/minimumWage.json";
import stateChanges2026 from "@/lib/data/stateChanges2026.json";
import {
  buildSalaryTierExamples,
  buildHourlyWageExamples,
  buildFilingStatusComparison,
} from "@/lib/utils/salaryExamples";
import { getTopRateRank } from "@/lib/utils/taxRanking";

function formatCurrency(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function formatCurrencyCents(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatRate(rate: number): string {
  return `${(rate * 100).toFixed(2).replace(/\.00$/, "")}%`;
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

interface StateInfoSectionProps {
  stateCode: StateCode;
}

export interface StateFaq {
  question: string;
  answer: string;
}

const NO_TAX_STATE_FACTS: Record<string, string> = {
  AK: "Alaska is unusual in another way too: instead of collecting income tax, the state pays residents an annual dividend from oil revenue through the Permanent Fund Dividend program.",
  FL: "Florida's state budget leans heavily on sales tax and tourism-related revenue instead, which is part of why it's long been a popular retirement destination.",
  NV: "Nevada funds its state budget largely through gaming and tourism-related taxes rather than a wage income tax.",
  NH: "New Hampshire historically taxed only interest and dividend income (never wages), and fully repealed even that tax as of January 2025 — making it a true no-income-tax state today.",
  SD: "South Dakota also levies no corporate income tax, and its favorable trust and banking laws have made it a hub for financial services companies.",
  TN: "Tennessee eliminated its old Hall Tax on interest and dividend income back in 2021, completing its transition to a true no-wage-income-tax state.",
  TX: "Texas instead relies heavily on sales and property taxes to fund state and local government, while still running one of the largest state economies in the country.",
  WY: "Wyoming's state budget relies significantly on severance taxes from oil, gas, and coal extraction rather than taxing wages.",
};

/** Builds a one-paragraph intro whose framing genuinely differs by tax structure, not just the state name. */
function buildIntro(stateCode: StateCode): string {
  const state = getStateMetadata(stateCode);

  if (!state.hasIncomeTax) {
    const payrollNote = state.specialPayrollTax?.length
      ? ` Note that ${state.name} still withholds for ${state.specialPayrollTax
          .map((t: any) => t.label.replace(/\s*\(employee[^)]*\)/i, ""))
          .join(" and ")}, so "no income tax" doesn't mean nothing else comes out of your check.`
      : "";
    const uniqueFact =
      NO_TAX_STATE_FACTS[stateCode] ??
      `That makes ${state.name} paycheck math simpler than in most of the country.`;
    return `${state.name} is one of just eight states with no wage income tax, so your paycheck here is only reduced by federal income tax and FICA (Social Security and Medicare) — nothing is withheld for state income tax at all.${payrollNote} ${uniqueFact}`;
  }

  const { rank, totalTaxingStates, topRate } = getTopRateRank(stateCode);
  const rankLanguage =
    rank <= 5
      ? `one of the ${ordinal(rank)}-highest top marginal state income tax rates in the country`
      : rank >= totalTaxingStates - 4
        ? `one of the lowest top marginal state income tax rates among the ${totalTaxingStates} states that tax wage income`
        : `roughly in the middle of the pack nationally (${ordinal(rank)} highest of ${totalTaxingStates} taxing states)`;

  if (state.type === "flat") {
    return `${state.name} taxes wage income at a single flat rate of ${formatRate(state.flatRate)} regardless of how much you earn — no brackets to climb. That flat rate is ${rankLanguage}. Combined with federal tax and FICA, this page shows exactly what that means for your specific paycheck.`;
  }

  return `${state.name} uses a graduated income tax, meaning your rate rises in steps as your income grows, topping out at ${formatRate(topRate)} — ${rankLanguage}. Because the brackets matter as much as the top rate, the table below shows every bracket that could apply to your paycheck, not just the headline number.`;
}

export function buildStateFaqs(stateCode: StateCode): StateFaq[] {
  const state = getStateMetadata(stateCode);
  const minWage = (minimumWageData.states as any)[stateCode];
  const tiers = buildSalaryTierExamples(stateCode, "single");
  const midTier = tiers[1]; // $60,000
  const changeNote = (stateChanges2026.changes as any)[stateCode];

  const faqs: StateFaq[] = [];

  faqs.push({
    question: `Does ${state.name} have state income tax?`,
    answer: state.hasIncomeTax
      ? `Yes. ${state.name} levies a ${
          state.type === "flat" ? "flat-rate" : "graduated"
        } state income tax${
          state.type === "flat" ? ` of ${formatRate(state.flatRate)}` : ""
        } on wage income for 2026, in addition to federal income tax and FICA.`
      : `No. ${state.name} does not tax wages or salaries, so this calculator only withholds federal income tax and FICA for ${state.name} paychecks.`,
  });

  faqs.push({
    question: `How much is $${(midTier.annualSalary / 1000).toFixed(0)},000 a year after taxes in ${state.name}?`,
    answer: `A single filer earning $${midTier.annualSalary.toLocaleString()}/year in ${state.name}, paid biweekly, takes home approximately ${formatCurrency(
      midTier.annualNetPay
    )} per year (about ${formatCurrency(
      midTier.biweeklyNetPay
    )} per paycheck) — an effective tax rate of about ${formatRate(midTier.effectiveTaxRate)} once federal tax, FICA, and ${state.hasIncomeTax ? `${state.name} state tax` : "any applicable state programs"} are withheld.`,
  });

  faqs.push({
    question: `What is the minimum wage in ${state.name} in 2026?`,
    answer: minWage
      ? `The 2026 minimum wage in ${state.name} is ${formatCurrencyCents(
          minWage.rate
        )} per hour${
          minWage.secondaryRate
            ? `, though a lower rate of ${formatCurrencyCents(
                minWage.secondaryRate
              )}/hour can apply to certain employers or regions`
            : ""
        }. Working full-time (40 hours/week, 52 weeks/year) at that rate comes to about ${formatCurrency(
          minWage.rate * 40 * 52
        )}/year before taxes.${minWage.note ? ` ${minWage.note}` : ""}`
      : `The federal minimum wage of $7.25/hour applies in ${state.name}.`,
  });

  const hourlyExamples = buildHourlyWageExamples(stateCode, "single");
  const twentyPerHour = hourlyExamples.find((h) => h.hourlyRate === 20)!;
  const filingComparison = buildFilingStatusComparison(stateCode, 75000);

  faqs.push({
    question: `$20 an hour is how much a year after taxes in ${state.name}?`,
    answer: `At $20/hour full-time (40 hours/week), gross pay is ${formatCurrency(
      twentyPerHour.annualGross
    )}/year. After federal tax, FICA, and ${state.hasIncomeTax ? `${state.name} state tax` : "any applicable state programs"}, a single filer takes home approximately ${formatCurrency(
      twentyPerHour.annualNetPay
    )}/year — about ${formatCurrency(twentyPerHour.weeklyNetPay)} per week.`,
  });

  faqs.push({
    question: `Do you pay less tax if you're married in ${state.name}?`,
    answer: `On a $${(filingComparison.annualSalary / 1000).toFixed(0)},000 salary, a single filer in ${state.name} takes home about ${formatCurrency(
      filingComparison.single.annualNetPay
    )}/year (${formatRate(filingComparison.single.effectiveTaxRate)} effective tax rate), while a married couple filing jointly at the same combined income takes home about ${formatCurrency(
      filingComparison.marriedJoint.annualNetPay
    )}/year (${formatRate(filingComparison.marriedJoint.effectiveTaxRate)}). Married filing jointly usually results in a lower or equal effective tax rate, since joint brackets are wider than single brackets.`,
  });

  faqs.push({
    question: `How much tax is taken out of an hourly paycheck in ${state.name}?`,
    answer: `The percentage is the same whether you're paid hourly or salaried — what matters is your total gross pay per period, filing status, and pay frequency. Enter your hourly rate × hours worked as your "gross pay per period" above (for example, $25/hour × 80 hours for a biweekly hourly paycheck) to get an exact ${state.name} breakdown.`,
  });

  faqs.push({
    question: `What FICA taxes come out of every paycheck in ${state.name}?`,
    answer:
      "Every paycheck nationwide — including in this state — has 6.2% withheld for Social Security up to the 2026 wage base of $184,500, plus 1.45% for Medicare with no cap. Employees earning over $200,000 from one employer also owe an Additional Medicare Tax of 0.9% on the excess.",
  });

  if (state.specialPayrollTax?.length) {
    faqs.push({
      question: `Are there other payroll deductions unique to ${state.name}?`,
      answer: `Yes — ${state.name} also withholds for: ${state.specialPayrollTax
        .map((t: any) => t.label)
        .join(", ")}. These fund state disability or paid-family-leave insurance programs and are separate line items from state income tax.`,
    });
  }

  if (changeNote) {
    faqs.push({
      question: `What changed with ${state.name} income tax for 2026?`,
      answer: changeNote,
    });
  }

  faqs.push({
    question: `Does ${state.name} tax bonuses and overtime the same as regular pay?`,
    answer: `For withholding purposes, most employers treat bonuses and overtime as regular wages added to that pay period's gross pay — which is exactly how this calculator treats any amount you enter. Your actual year-end tax liability on that income is the same either way; only the withholding timing can differ slightly if your employer uses the IRS "supplemental wage" flat-rate method for bonuses.`,
  });

  return faqs;
}

export default function StateInfoSection({ stateCode }: StateInfoSectionProps) {
  const state = getStateMetadata(stateCode);
  const minWage = (minimumWageData.states as any)[stateCode];
  const faqs = buildStateFaqs(stateCode);
  const intro = buildIntro(stateCode);
  const tiers = buildSalaryTierExamples(stateCode, "single");
  const hourlyExamples = buildHourlyWageExamples(stateCode, "single");
  const filingComparison = buildFilingStatusComparison(stateCode, 75000);
  const changeNote = (stateChanges2026.changes as any)[stateCode];

  return (
    <section className="space-y-8">
      <div className="rounded-[var(--radius-card)] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <h2 className="text-base font-semibold text-[var(--color-ink-900)]">
          {state.name} paycheck &amp; tax overview
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {intro}
        </p>

        {changeNote && (
          <p className="mt-3 rounded-[var(--radius-control)] border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
            <strong>2026 update:</strong> {changeNote}
          </p>
        )}
      </div>

      <div className="rounded-[var(--radius-card)] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <h2 className="text-base font-semibold text-[var(--color-ink-900)]">
          {state.name} state tax brackets (2026, single filers)
        </h2>
        {state.hasIncomeTax ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-left text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <th className="py-2 pr-4 font-medium">Rate</th>
                  <th className="py-2 font-medium">Applies to income above</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {state.type === "flat" ? (
                  <tr>
                    <td className="tabular-figure py-2 pr-4 text-slate-700 dark:text-slate-300">
                      {formatRate(state.flatRate)}
                    </td>
                    <td className="tabular-figure py-2 text-slate-700 dark:text-slate-300">
                      {formatCurrency(state.flatRateAppliesAbove?.single ?? 0)}
                    </td>
                  </tr>
                ) : (
                  (state.brackets.single as { rate: number; min: number }[]).map(
                    (bracket) => (
                      <tr key={bracket.min}>
                        <td className="tabular-figure py-2 pr-4 text-slate-700 dark:text-slate-300">
                          {formatRate(bracket.rate)}
                        </td>
                        <td className="tabular-figure py-2 text-slate-700 dark:text-slate-300">
                          {formatCurrency(bracket.min)}
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            {state.name} has no state income tax on wages or salaries.
          </p>
        )}

        {state.standardDeduction && (
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
            2026 standard deduction:{" "}
            {formatCurrency(state.standardDeduction.single ?? 0)} (single) /{" "}
            {formatCurrency(state.standardDeduction.marriedJoint ?? 0)}{" "}
            (married filing jointly).
          </p>
        )}

        {minWage && (
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            2026 minimum wage: {formatCurrencyCents(minWage.rate)}/hour.
            {minWage.note ? ` ${minWage.note}` : ""}
          </p>
        )}

        {state.notes && (
          <p className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-3 text-xs text-slate-500 dark:text-slate-400">
            {state.notes}
          </p>
        )}
      </div>

      <div className="rounded-[var(--radius-card)] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <h2 className="text-base font-semibold text-[var(--color-ink-900)]">
          {state.name} take-home pay by salary (2026, single filer)
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Assumes biweekly pay, no pre-tax or post-tax deductions. Use the
          calculator above for your exact numbers.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-left text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <th className="py-2 pr-4 font-medium">Annual salary</th>
                <th className="py-2 pr-4 font-medium text-right">
                  Annual take-home
                </th>
                <th className="py-2 pr-4 font-medium text-right">
                  Biweekly take-home
                </th>
                <th className="py-2 font-medium text-right">
                  Effective tax rate
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {tiers.map((tier) => (
                <tr key={tier.annualSalary}>
                  <td className="tabular-figure py-2 pr-4 text-slate-700 dark:text-slate-300">
                    {formatCurrency(tier.annualSalary)}
                  </td>
                  <td className="tabular-figure py-2 pr-4 text-right text-slate-700 dark:text-slate-300">
                    {formatCurrency(tier.annualNetPay)}
                  </td>
                  <td className="tabular-figure py-2 pr-4 text-right text-slate-700 dark:text-slate-300">
                    {formatCurrency(tier.biweeklyNetPay)}
                  </td>
                  <td className="tabular-figure py-2 text-right text-slate-700 dark:text-slate-300">
                    {formatRate(tier.effectiveTaxRate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-[var(--radius-card)] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <h2 className="text-base font-semibold text-[var(--color-ink-900)]">
          {state.name} hourly wage take-home pay (2026, single filer)
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Assumes a standard 40-hour week, 52 weeks/year, paid weekly.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-left text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <th className="py-2 pr-4 font-medium">Hourly rate</th>
                <th className="py-2 pr-4 font-medium text-right">
                  Annual gross
                </th>
                <th className="py-2 pr-4 font-medium text-right">
                  Annual take-home
                </th>
                <th className="py-2 font-medium text-right">
                  Weekly take-home
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {hourlyExamples.map((ex) => (
                <tr key={ex.hourlyRate}>
                  <td className="tabular-figure py-2 pr-4 text-slate-700 dark:text-slate-300">
                    ${ex.hourlyRate}/hr
                  </td>
                  <td className="tabular-figure py-2 pr-4 text-right text-slate-700 dark:text-slate-300">
                    {formatCurrency(ex.annualGross)}
                  </td>
                  <td className="tabular-figure py-2 pr-4 text-right text-slate-700 dark:text-slate-300">
                    {formatCurrency(ex.annualNetPay)}
                  </td>
                  <td className="tabular-figure py-2 text-right text-slate-700 dark:text-slate-300">
                    {formatCurrency(ex.weeklyNetPay)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-[var(--radius-card)] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <h2 className="text-base font-semibold text-[var(--color-ink-900)]">
          Single vs. married filing jointly in {state.name}
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Compared at a ${(filingComparison.annualSalary / 1000).toFixed(0)}
          ,000 annual salary.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-left text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <th className="py-2 pr-4 font-medium">Filing status</th>
                <th className="py-2 pr-4 font-medium text-right">
                  Annual take-home
                </th>
                <th className="py-2 font-medium text-right">
                  Effective tax rate
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              <tr>
                <td className="py-2 pr-4 text-slate-700 dark:text-slate-300">
                  Single
                </td>
                <td className="tabular-figure py-2 pr-4 text-right text-slate-700 dark:text-slate-300">
                  {formatCurrency(filingComparison.single.annualNetPay)}
                </td>
                <td className="tabular-figure py-2 text-right text-slate-700 dark:text-slate-300">
                  {formatRate(filingComparison.single.effectiveTaxRate)}
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-slate-700 dark:text-slate-300">
                  Married filing jointly
                </td>
                <td className="tabular-figure py-2 pr-4 text-right text-slate-700 dark:text-slate-300">
                  {formatCurrency(filingComparison.marriedJoint.annualNetPay)}
                </td>
                <td className="tabular-figure py-2 text-right text-slate-700 dark:text-slate-300">
                  {formatRate(filingComparison.marriedJoint.effectiveTaxRate)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div id="faq" className="rounded-[var(--radius-card)] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <h2 className="text-base font-semibold text-[var(--color-ink-900)]">
          {state.name} paycheck FAQ
        </h2>
        <dl className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
          {faqs.map((faq) => (
            <div key={faq.question} className="py-4 first:pt-0 last:pb-0">
              <dt className="text-sm font-medium text-[var(--color-ink-900)]">
                {faq.question}
              </dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {faq.answer}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
