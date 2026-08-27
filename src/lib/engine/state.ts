import stateData from "@/lib/data/stateBrackets.json";
import { calculateProgressiveTax, PAY_PERIODS_PER_YEAR } from "@/lib/engine/federal";
import type { FilingStatus, PayFrequency, TaxBracket } from "@/lib/engine/federal";

export type StateCode = keyof typeof stateData.states;

export interface SpecialPayrollTax {
  id: string;
  label: string;
  rate: number;
  wageCap?: number | null;
  annualDollarCap?: number;
  weeklyDollarCap?: number;
  verified: boolean;
}

export interface StateWithholdingInput {
  stateCode: StateCode;
  grossPay: number;
  payFrequency: PayFrequency;
  filingStatus: FilingStatus;
  preTaxDeductions?: number;
  /** Year-to-date wages already subject to each capped special payroll tax, keyed by tax id. */
  ytdSpecialPayrollWages?: Record<string, number>;
}

export interface SpecialPayrollTaxResult extends SpecialPayrollTax {
  taxPerPeriod: number;
}

export interface StateWithholdingResult {
  stateName: string;
  hasIncomeTax: boolean;
  annualTaxableWages: number;
  annualStateTax: number;
  stateTaxPerPeriod: number;
  marginalRate: number;
  /**
   * State INCOME TAX effective rate only — deliberately excludes special
   * payroll taxes (SDI/PFL/FAMLI/WA Cares, returned separately below in
   * `specialPayrollTaxes`). Do not sum this with another domain's
   * income-tax-only rate to produce an "effective tax rate" — use
   * PaycheckBreakdown.effectiveTaxRate from calculator.ts instead.
   */
  incomeTaxEffectiveRate: number;
  standardDeductionApplied: number;
  exemptionApplied: number;
  specialPayrollTaxes: SpecialPayrollTaxResult[];
  totalSpecialPayrollTaxPerPeriod: number;
  notes?: string;
}

type FilingBracketKey = "single" | "marriedJoint";

/** Maps the app-wide FilingStatus onto the two bracket sets most US states publish. */
function toStateFilingKey(filingStatus: FilingStatus, hohUsesSingle: boolean): FilingBracketKey {
  if (filingStatus === "marriedJoint") return "marriedJoint";
  if (filingStatus === "headOfHousehold" && !hohUsesSingle) return "marriedJoint"; // rare case; default handled by caller
  return "single";
}

function resolveDeductionAmount(
  amounts: { single?: number; marriedJoint?: number; headOfHousehold?: number } | undefined,
  filingStatus: FilingStatus,
  fallbackKey: FilingBracketKey
): number {
  if (!amounts) return 0;
  if (filingStatus === "headOfHousehold" && amounts.headOfHousehold !== undefined) {
    return amounts.headOfHousehold;
  }
  return amounts[fallbackKey] ?? 0;
}

/**
 * Computes a single special payroll tax (SDI / PFL / FAMLI / WA Cares, etc.)
 * for the current pay period, respecting wage caps expressed either as an
 * annual wage ceiling, an annual dollar-contribution ceiling, or a weekly
 * dollar ceiling (as used by a couple of small state TDI programs).
 */
function calculateSpecialPayrollTax(
  tax: SpecialPayrollTax,
  grossPay: number,
  payFrequency: PayFrequency,
  ytdWages: number
): SpecialPayrollTaxResult {
  const periodsPerYear = PAY_PERIODS_PER_YEAR[payFrequency];

  if (tax.weeklyDollarCap !== undefined) {
    const weeklyEquivalentGross = (grossPay * periodsPerYear) / 52;
    const weeklyTax = Math.min(weeklyEquivalentGross * tax.rate, tax.weeklyDollarCap);
    return { ...tax, taxPerPeriod: (weeklyTax * 52) / periodsPerYear };
  }

  if (tax.annualDollarCap !== undefined) {
    const annualGross = grossPay * periodsPerYear;
    const uncappedAnnualTax = annualGross * tax.rate;
    const annualTax = Math.min(uncappedAnnualTax, tax.annualDollarCap);
    return { ...tax, taxPerPeriod: annualTax / periodsPerYear };
  }

  if (tax.wageCap) {
    const remainingRoom = Math.max(0, tax.wageCap - ytdWages);
    const taxableThisPeriod = Math.min(grossPay, remainingRoom);
    return { ...tax, taxPerPeriod: taxableThisPeriod * tax.rate };
  }

  // No cap at all (e.g., CA SDI, WA Cares).
  return { ...tax, taxPerPeriod: grossPay * tax.rate };
}

/**
 * Calculates state income tax withholding plus any state-mandated special
 * payroll taxes (SDI / PFL / FAMLI / long-term care) for a single pay period.
 */
export function calculateStateWithholding(
  input: StateWithholdingInput
): StateWithholdingResult {
  const {
    stateCode,
    grossPay,
    payFrequency,
    filingStatus,
    preTaxDeductions = 0,
    ytdSpecialPayrollWages = {},
  } = input;

  const state = stateData.states[stateCode] as any;
  const periodsPerYear = PAY_PERIODS_PER_YEAR[payFrequency];
  const annualGross = Math.max(0, grossPay - preTaxDeductions) * periodsPerYear;

  const specialPayrollTaxes: SpecialPayrollTaxResult[] = (state.specialPayrollTax ?? []).map(
    (tax: SpecialPayrollTax) =>
      calculateSpecialPayrollTax(
        tax,
        Math.max(0, grossPay - preTaxDeductions),
        payFrequency,
        ytdSpecialPayrollWages[tax.id] ?? 0
      )
  );
  const totalSpecialPayrollTaxPerPeriod = specialPayrollTaxes.reduce(
    (sum, t) => sum + t.taxPerPeriod,
    0
  );

  if (!state.hasIncomeTax) {
    return {
      stateName: state.name,
      hasIncomeTax: false,
      annualTaxableWages: 0,
      annualStateTax: 0,
      stateTaxPerPeriod: 0,
      marginalRate: 0,
      incomeTaxEffectiveRate: 0,
      standardDeductionApplied: 0,
      exemptionApplied: 0,
      specialPayrollTaxes,
      totalSpecialPayrollTaxPerPeriod,
      notes: state.notes,
    };
  }

  const hohUsesSingle = state.hohUsesSingleBrackets ?? true;
  const filingKey = toStateFilingKey(filingStatus, hohUsesSingle);

  const standardDeduction = resolveDeductionAmount(
    state.standardDeduction,
    filingStatus,
    filingKey
  );

  let exemptionDeductionAmount = 0;
  let exemptionCreditAmount = 0;
  if (state.personalExemption) {
    const exemption = state.personalExemption;
    const exemptionValue =
      filingStatus === "headOfHousehold"
        ? exemption.single ?? 0
        : exemption[filingKey] ?? 0;
    if (exemption.exemptionType === "credit") {
      exemptionCreditAmount = exemptionValue;
    } else {
      exemptionDeductionAmount = exemptionValue;
    }
  }

  let annualTaxableWages: number;
  let marginalRate = 0;
  let grossAnnualTax = 0;

  if (state.type === "flat") {
    const applyAboveThreshold =
      state.flatRateAppliesAbove?.[filingKey] ?? 0;
    annualTaxableWages = Math.max(
      0,
      annualGross - standardDeduction - exemptionDeductionAmount - applyAboveThreshold
    );
    grossAnnualTax = annualTaxableWages * state.flatRate;
    marginalRate = annualTaxableWages > 0 ? state.flatRate : 0;
  } else {
    // graduated
    const brackets: TaxBracket[] = state.brackets[filingKey] ?? state.brackets.single;
    annualTaxableWages = Math.max(
      0,
      annualGross - standardDeduction - exemptionDeductionAmount
    );
    const result = calculateProgressiveTax(annualTaxableWages, brackets);
    grossAnnualTax = result.tax;
    marginalRate = result.marginalRate;
  }

  const annualStateTax = Math.max(0, grossAnnualTax - exemptionCreditAmount);
  const stateTaxPerPeriod = annualStateTax / periodsPerYear;

  return {
    stateName: state.name,
    hasIncomeTax: true,
    annualTaxableWages,
    annualStateTax,
    stateTaxPerPeriod,
    marginalRate,
    incomeTaxEffectiveRate: annualGross > 0 ? annualStateTax / annualGross : 0,
    standardDeductionApplied: standardDeduction,
    exemptionApplied: exemptionDeductionAmount + exemptionCreditAmount,
    specialPayrollTaxes,
    totalSpecialPayrollTaxPerPeriod,
    notes: state.notes,
  };
}

export function getAllStates(): { code: StateCode; name: string; hasIncomeTax: boolean }[] {
  return Object.entries(stateData.states).map(([code, value]: [string, any]) => ({
    code: code as StateCode,
    name: value.name,
    hasIncomeTax: value.hasIncomeTax,
  }));
}

export function getStateMetadata(stateCode: StateCode) {
  return stateData.states[stateCode] as any;
}

export { stateData };
