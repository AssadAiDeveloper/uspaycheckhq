import federalData from "@/lib/data/federalBrackets.json";

export type FilingStatus = "single" | "marriedJoint" | "marriedSeparate" | "headOfHousehold";

export type PayFrequency =
  | "weekly"
  | "biweekly"
  | "semimonthly"
  | "monthly"
  | "annually";

export const PAY_PERIODS_PER_YEAR: Record<PayFrequency, number> = {
  weekly: 52,
  biweekly: 26,
  semimonthly: 24,
  monthly: 12,
  annually: 1,
};

export interface TaxBracket {
  rate: number;
  min: number;
}

export interface FederalWithholdingInput {
  /** Gross wages for the current pay period. */
  grossPay: number;
  payFrequency: PayFrequency;
  filingStatus: FilingStatus;
  /** Pre-tax deductions per pay period (401k, traditional IRA, HSA, etc.) that reduce taxable wages. */
  preTaxDeductions?: number;
  /** Additional federal withholding requested per pay period on Form W-4 Step 4(c). */
  extraWithholding?: number;
  /**
   * Number of dependents multiplied by IRS credit amounts from Form W-4 Step 3,
   * expressed as an ANNUAL dollar amount that reduces annual withholding tax.
   */
  annualDependentCredits?: number;
}

export interface FederalWithholdingResult {
  annualTaxableWages: number;
  annualFederalTax: number;
  federalTaxPerPeriod: number;
  /**
   * Federal INCOME TAX effective rate only — deliberately excludes FICA
   * (Social Security / Medicare), which is calculated separately by
   * calculateFica() and is NOT part of this result. Do not sum this with
   * another domain's income-tax-only rate to produce an "effective tax
   * rate" — use PaycheckBreakdown.effectiveTaxRate from calculator.ts for
   * the correct, complete figure across federal income tax + FICA + state
   * income tax + state payroll programs.
   */
  incomeTaxEffectiveRate: number;
  marginalRate: number;
  standardDeductionApplied: number;
}

function getBracketSet(filingStatus: FilingStatus): TaxBracket[] {
  return federalData.incomeTax[filingStatus];
}

/**
 * Computes tax owed on a given amount of taxable income using progressive
 * marginal brackets (sorted ascending by `min`).
 */
export function calculateProgressiveTax(
  taxableIncome: number,
  brackets: TaxBracket[]
): { tax: number; marginalRate: number } {
  if (taxableIncome <= 0) {
    return { tax: 0, marginalRate: brackets[0]?.rate ?? 0 };
  }

  let tax = 0;
  let marginalRate = brackets[0].rate;

  for (let i = 0; i < brackets.length; i++) {
    const current = brackets[i];
    const next = brackets[i + 1];
    const bracketCeiling = next ? next.min : Infinity;

    if (taxableIncome > current.min) {
      const incomeInBracket = Math.min(taxableIncome, bracketCeiling) - current.min;
      tax += incomeInBracket * current.rate;
      marginalRate = current.rate;
    } else {
      break;
    }
  }

  return { tax, marginalRate };
}

/**
 * Approximates annualized federal income tax withholding.
 *
 * NOTE: Real-world payroll systems use the IRS Publication 15-T percentage
 * method (which differs slightly from year-end 1040 brackets due to the
 * standard withholding rate schedule and the W-4's "Step 2 checkbox" logic).
 * This function uses the simpler and more transparent "annualize gross pay,
 * subtract the standard deduction, apply year-end brackets, divide back
 * down" approach, which is standard practice for consumer-facing paycheck
 * ESTIMATORS (as opposed to IRS-compliant employer withholding software).
 */
export function calculateFederalWithholding(
  input: FederalWithholdingInput
): FederalWithholdingResult {
  const {
    grossPay,
    payFrequency,
    filingStatus,
    preTaxDeductions = 0,
    extraWithholding = 0,
    annualDependentCredits = 0,
  } = input;

  const periodsPerYear = PAY_PERIODS_PER_YEAR[payFrequency];
  const annualGross = Math.max(0, grossPay - preTaxDeductions) * periodsPerYear;

  const standardDeduction = federalData.standardDeduction[filingStatus];
  const annualTaxableWages = Math.max(0, annualGross - standardDeduction);

  const brackets = getBracketSet(filingStatus);
  const { tax: grossAnnualTax, marginalRate } = calculateProgressiveTax(
    annualTaxableWages,
    brackets
  );

  const annualFederalTax = Math.max(0, grossAnnualTax - annualDependentCredits);
  const federalTaxPerPeriod =
    annualFederalTax / periodsPerYear + extraWithholding;

  return {
    annualTaxableWages,
    annualFederalTax,
    federalTaxPerPeriod,
    incomeTaxEffectiveRate: annualGross > 0 ? annualFederalTax / annualGross : 0,
    marginalRate,
    standardDeductionApplied: standardDeduction,
  };
}

export interface FicaInput {
  grossPay: number;
  payFrequency: PayFrequency;
  filingStatus: FilingStatus;
  /** Year-to-date wages already subject to Social Security tax, before this pay period. */
  ytdSocialSecurityWages?: number;
  /** Year-to-date gross wages already paid, before this pay period (for Additional Medicare Tax threshold). */
  ytdGrossWages?: number;
}

export interface FicaResult {
  socialSecurityTax: number;
  medicareTax: number;
  additionalMedicareTax: number;
  totalFicaTax: number;
  socialSecurityWageBaseReached: boolean;
}

/**
 * Calculates Social Security (OASDI) and Medicare (including Additional
 * Medicare Tax) withholding for a single pay period, respecting YTD wages
 * already applied against the Social Security wage base and the $200,000
 * Additional Medicare Tax withholding trigger (which applies per-employer,
 * regardless of filing status, per IRS Topic 751).
 */
export function calculateFica(input: FicaInput): FicaResult {
  const {
    grossPay,
    ytdSocialSecurityWages = 0,
    ytdGrossWages = 0,
  } = input;

  const { rate: ssRate, wageBase: ssWageBase } = federalData.fica.socialSecurity;
  const { rate: medicareRate, additionalMedicare } = federalData.fica.medicare;

  // Social Security: only wages up to the annual wage base are taxed.
  const remainingSsWageRoom = Math.max(0, ssWageBase - ytdSocialSecurityWages);
  const ssTaxableThisPeriod = Math.min(grossPay, remainingSsWageRoom);
  const socialSecurityTax = ssTaxableThisPeriod * ssRate;

  // Medicare: no wage cap.
  const medicareTax = grossPay * medicareRate;

  // Additional Medicare Tax: employers withhold 0.9% once an employee's
  // wages from THAT employer exceed $200,000 in the calendar year, regardless
  // of the employee's actual filing-status threshold (true reconciliation
  // happens on the employee's Form 1040, out of scope for a paycheck estimator).
  const additionalMedicareThreshold = additionalMedicare.thresholds.single; // $200,000 employer-withholding trigger
  const wagesOverThresholdThisPeriod = Math.max(
    0,
    ytdGrossWages + grossPay - additionalMedicareThreshold
  ) - Math.max(0, ytdGrossWages - additionalMedicareThreshold);
  const additionalMedicareTax = wagesOverThresholdThisPeriod * additionalMedicare.rate;

  return {
    socialSecurityTax,
    medicareTax,
    additionalMedicareTax,
    totalFicaTax: socialSecurityTax + medicareTax + additionalMedicareTax,
    socialSecurityWageBaseReached: ytdSocialSecurityWages + ssTaxableThisPeriod >= ssWageBase,
  };
}

export { federalData };
