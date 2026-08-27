import {
  calculateFederalWithholding,
  calculateFica,
  PAY_PERIODS_PER_YEAR,
} from "@/lib/engine/federal";
import type { FilingStatus, PayFrequency } from "@/lib/engine/federal";
import {
  calculateStateWithholding,
  getStateMetadata,
} from "@/lib/engine/state";
import type { StateCode, SpecialPayrollTaxResult } from "@/lib/engine/state";

export type { FilingStatus, PayFrequency, StateCode };

export interface PaycheckInput {
  stateCode: StateCode;
  filingStatus: FilingStatus;
  payFrequency: PayFrequency;

  /** Gross pay for ONE pay period (e.g., one biweekly paycheck). */
  grossPayPerPeriod: number;

  /**
   * 401(k)/403(b)/457(b) traditional retirement contributions per period.
   * Exempt from federal and state income tax, but NOT exempt from FICA —
   * Social Security and Medicare are still withheld on this amount, exactly
   * as IRS payroll rules require.
   */
  retirement401kDeduction?: number;

  /**
   * HSA, FSA, and other Section 125 "cafeteria plan" pre-tax deductions
   * (including most pre-tax health/dental/vision premiums) per period.
   * Exempt from federal income tax, state income tax, AND FICA — these are
   * the only common payroll deductions that reduce Social Security and
   * Medicare wages too.
   */
  section125Deduction?: number;

  /** Post-tax deductions per period: Roth 401(k), wage garnishments, union dues, post-tax insurance, etc. */
  postTaxDeductions?: number;

  /** Extra flat-dollar federal withholding requested per period (W-4 Step 4c). */
  extraFederalWithholding?: number;

  /** Annual dependent tax credits from W-4 Step 3 (e.g., $2,000 x number of qualifying children). */
  annualDependentCredits?: number;

  /** Year-to-date figures, used to correctly cap Social Security / SDI / PFL / FAMLI wage bases mid-year. */
  ytdGrossWages?: number;
  ytdSocialSecurityWages?: number;
  ytdSpecialPayrollWages?: Record<string, number>;
}

export interface PaycheckBreakdown {
  input: PaycheckInput;

  grossPay: number;

  preTaxDeductions: number;
  /** Portion of preTaxDeductions from 401(k)/403(b) retirement contributions (excluded from FICA wages). */
  retirement401kDeduction: number;
  /** Portion of preTaxDeductions from HSA/FSA/Section 125 benefits (excluded from FICA wages too). */
  section125Deduction: number;
  postTaxDeductions: number;

  federal: {
    incomeTax: number;
    socialSecurity: number;
    medicare: number;
    additionalMedicare: number;
    total: number;
    marginalRate: number;
    /** Federal INCOME TAX rate only — excludes FICA. See effectiveTaxRate below for the complete figure. */
    incomeTaxEffectiveRate: number;
  };

  state: {
    stateName: string;
    hasIncomeTax: boolean;
    incomeTax: number;
    specialPayrollTaxes: SpecialPayrollTaxResult[];
    totalSpecialPayrollTax: number;
    total: number;
    marginalRate: number;
    /** State INCOME TAX rate only — excludes SDI/PFL/FAMLI. See effectiveTaxRate below for the complete figure. */
    incomeTaxEffectiveRate: number;
    notes?: string;
  };

  totalTaxesAndDeductions: number;
  netPay: number;

  /**
   * The complete, correct effective tax rate: every mandatory tax withheld
   * from this paycheck (federal income tax + Social Security + Medicare +
   * Additional Medicare + state income tax + state payroll programs such as
   * SDI/PFL/FAMLI), divided by gross pay. Deliberately EXCLUDES voluntary
   * pre-tax and post-tax deductions (401(k), HSA, garnishments, etc.), since
   * those are not taxes. This is the figure the UI should display as
   * "Effective Tax Rate" — never derive it by summing federal and state
   * `incomeTaxEffectiveRate` values, which each omit payroll taxes by design.
   */
  effectiveTaxRate: number;

  annualized: {
    grossPay: number;
    federalIncomeTax: number;
    stateIncomeTax: number;
    fica: number;
    specialPayrollTax: number;
    netPay: number;
  };
}

/**
 * The single unified entry point for the paycheck engine. Given raw pay
 * period inputs, returns a full breakdown from Gross Pay -> Pre-Tax
 * Deductions -> Taxes -> Post-Tax Deductions -> Net Pay, matching the
 * visual hierarchy required by the UI components (PaycheckSummaryCard,
 * TaxBreakdownTable).
 */
export function calculatePaycheck(input: PaycheckInput): PaycheckBreakdown {
  const {
    stateCode,
    filingStatus,
    payFrequency,
    grossPayPerPeriod,
    retirement401kDeduction = 0,
    section125Deduction = 0,
    postTaxDeductions = 0,
    extraFederalWithholding = 0,
    annualDependentCredits = 0,
    ytdGrossWages = 0,
    ytdSocialSecurityWages = 0,
    ytdSpecialPayrollWages = {},
  } = input;

  // Both 401(k) and Section 125 (HSA/FSA/pre-tax premiums) reduce federal
  // and state INCOME TAX wages equally.
  const totalPreTaxDeductions = retirement401kDeduction + section125Deduction;

  // Only Section 125 reduces FICA wages — 401(k) contributions are still
  // subject to Social Security and Medicare tax, per IRS payroll rules.
  const ficaWages = Math.max(0, grossPayPerPeriod - section125Deduction);

  const federalResult = calculateFederalWithholding({
    grossPay: grossPayPerPeriod,
    payFrequency,
    filingStatus,
    preTaxDeductions: totalPreTaxDeductions,
    extraWithholding: extraFederalWithholding,
    annualDependentCredits,
  });

  const ficaResult = calculateFica({
    grossPay: ficaWages,
    payFrequency,
    filingStatus,
    ytdSocialSecurityWages,
    ytdGrossWages,
  });

  const stateResult = calculateStateWithholding({
    stateCode,
    grossPay: grossPayPerPeriod,
    payFrequency,
    filingStatus,
    preTaxDeductions: totalPreTaxDeductions,
    ytdSpecialPayrollWages,
  });

  const federalTotal =
    federalResult.federalTaxPerPeriod + ficaResult.totalFicaTax;
  const stateTotal =
    stateResult.stateTaxPerPeriod + stateResult.totalSpecialPayrollTaxPerPeriod;

  const totalTaxesAndDeductions =
    federalTotal + stateTotal + postTaxDeductions;

  const netPay =
    grossPayPerPeriod - totalPreTaxDeductions - totalTaxesAndDeductions;

  const periodsPerYear = PAY_PERIODS_PER_YEAR[payFrequency];

  // Bug fix (reported): the UI previously derived "Effective Tax Rate" by
  // summing federal.incomeTaxEffectiveRate + state.incomeTaxEffectiveRate,
  // both of which deliberately exclude FICA and state payroll programs —
  // silently understating the true rate for every state. The correct
  // figure is ALL mandatory taxes (federal income tax + Social Security +
  // Medicare + Additional Medicare + state income tax + state payroll
  // programs) divided by gross pay. Voluntary post-tax deductions are
  // intentionally excluded, since they are not taxes.
  const totalMandatoryTaxes = federalTotal + stateTotal;
  const effectiveTaxRate =
    grossPayPerPeriod > 0 ? totalMandatoryTaxes / grossPayPerPeriod : 0;

  return {
    input,
    grossPay: grossPayPerPeriod,
    preTaxDeductions: totalPreTaxDeductions,
    retirement401kDeduction,
    section125Deduction,
    postTaxDeductions,
    federal: {
      incomeTax: federalResult.federalTaxPerPeriod,
      socialSecurity: ficaResult.socialSecurityTax,
      medicare: ficaResult.medicareTax,
      additionalMedicare: ficaResult.additionalMedicareTax,
      total: federalTotal,
      marginalRate: federalResult.marginalRate,
      incomeTaxEffectiveRate: federalResult.incomeTaxEffectiveRate,
    },
    state: {
      stateName: stateResult.stateName,
      hasIncomeTax: stateResult.hasIncomeTax,
      incomeTax: stateResult.stateTaxPerPeriod,
      specialPayrollTaxes: stateResult.specialPayrollTaxes,
      totalSpecialPayrollTax: stateResult.totalSpecialPayrollTaxPerPeriod,
      total: stateTotal,
      marginalRate: stateResult.marginalRate,
      incomeTaxEffectiveRate: stateResult.incomeTaxEffectiveRate,
      notes: stateResult.notes,
    },
    totalTaxesAndDeductions,
    netPay,
    effectiveTaxRate,
    annualized: {
      grossPay: grossPayPerPeriod * periodsPerYear,
      federalIncomeTax: federalResult.federalTaxPerPeriod * periodsPerYear,
      stateIncomeTax: stateResult.stateTaxPerPeriod * periodsPerYear,
      fica: ficaResult.totalFicaTax * periodsPerYear,
      specialPayrollTax:
        stateResult.totalSpecialPayrollTaxPerPeriod * periodsPerYear,
      netPay: netPay * periodsPerYear,
    },
  };
}

/**
 * Convenience helper for pSEO state pages: derives a representative net-pay
 * example (e.g., for a $60,000/yr single filer paid biweekly) used in
 * server-rendered editorial content and JSON-LD FAQ schemas.
 */
export function calculateAnnualSalaryExample(
  stateCode: StateCode,
  annualSalary: number,
  filingStatus: FilingStatus = "single"
): PaycheckBreakdown {
  return calculatePaycheck({
    stateCode,
    filingStatus,
    payFrequency: "biweekly",
    grossPayPerPeriod: annualSalary / PAY_PERIODS_PER_YEAR.biweekly,
  });
}

export function getStateDisplayInfo(stateCode: StateCode) {
  return getStateMetadata(stateCode);
}
