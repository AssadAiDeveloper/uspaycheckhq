import { calculateAnnualSalaryExample, calculatePaycheck } from "@/lib/engine/calculator";
import type { StateCode } from "@/lib/engine/state";
import type { FilingStatus } from "@/lib/engine/federal";

export const EXAMPLE_SALARY_TIERS = [40000, 60000, 80000, 100000, 150000] as const;

/** Common hourly wage rates people actually search for, e.g. "$20 an hour is how much after taxes". */
export const EXAMPLE_HOURLY_RATES = [15, 18, 20, 25, 30, 40] as const;

export interface SalaryTierExample {
  annualSalary: number;
  annualNetPay: number;
  biweeklyNetPay: number;
  effectiveTaxRate: number;
}

/**
 * Computes take-home pay across a fixed set of common salary tiers for a
 * given state — genuinely distinct numeric content per state page (not just
 * templated text), and directly useful for "$X salary after taxes in
 * [state]"-style search queries.
 */
export function buildSalaryTierExamples(
  stateCode: StateCode,
  filingStatus: FilingStatus = "single"
): SalaryTierExample[] {
  return EXAMPLE_SALARY_TIERS.map((annualSalary) => {
    const breakdown = calculateAnnualSalaryExample(
      stateCode,
      annualSalary,
      filingStatus
    );
    return {
      annualSalary,
      annualNetPay: breakdown.annualized.netPay,
      biweeklyNetPay: breakdown.netPay,
      effectiveTaxRate: breakdown.effectiveTaxRate,
    };
  });
}

export interface HourlyWageExample {
  hourlyRate: number;
  annualGross: number;
  annualNetPay: number;
  weeklyNetPay: number;
}

/**
 * Computes take-home pay for common hourly wage rates, assuming a standard
 * 40-hour week (2,080 hours/year) — targets high-volume long-tail searches
 * like "$20 an hour is how much a year after taxes in Texas".
 */
export function buildHourlyWageExamples(
  stateCode: StateCode,
  filingStatus: FilingStatus = "single"
): HourlyWageExample[] {
  const HOURS_PER_WEEK = 40;
  const WEEKS_PER_YEAR = 52;

  return EXAMPLE_HOURLY_RATES.map((hourlyRate) => {
    const annualGross = hourlyRate * HOURS_PER_WEEK * WEEKS_PER_YEAR;
    const breakdown = calculatePaycheck({
      stateCode,
      filingStatus,
      payFrequency: "weekly",
      grossPayPerPeriod: hourlyRate * HOURS_PER_WEEK,
    });
    return {
      hourlyRate,
      annualGross,
      annualNetPay: breakdown.annualized.netPay,
      weeklyNetPay: breakdown.netPay,
    };
  });
}

export interface FilingStatusComparison {
  annualSalary: number;
  single: { annualNetPay: number; effectiveTaxRate: number };
  marriedJoint: { annualNetPay: number; effectiveTaxRate: number };
}

/**
 * Compares take-home pay between Single and Married Filing Jointly at a
 * representative salary — targets "married filing jointly paycheck
 * calculator [state]" and "single vs married taxes [state]" searches.
 */
export function buildFilingStatusComparison(
  stateCode: StateCode,
  annualSalary: number = 75000
): FilingStatusComparison {
  const single = calculateAnnualSalaryExample(stateCode, annualSalary, "single");
  const marriedJoint = calculateAnnualSalaryExample(
    stateCode,
    annualSalary,
    "marriedJoint"
  );
  return {
    annualSalary,
    single: {
      annualNetPay: single.annualized.netPay,
      effectiveTaxRate: single.effectiveTaxRate,
    },
    marriedJoint: {
      annualNetPay: marriedJoint.annualized.netPay,
      effectiveTaxRate: marriedJoint.effectiveTaxRate,
    },
  };
}
