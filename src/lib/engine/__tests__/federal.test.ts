import { describe, it, expect } from "vitest";
import {
  calculateProgressiveTax,
  calculateFederalWithholding,
  calculateFica,
  PAY_PERIODS_PER_YEAR,
} from "@/lib/engine/federal";

describe("calculateProgressiveTax", () => {
  const brackets = [
    { rate: 0.10, min: 0 },
    { rate: 0.12, min: 12400 },
    { rate: 0.22, min: 50400 },
  ];

  it("returns zero tax and the lowest bracket's rate for zero or negative income", () => {
    expect(calculateProgressiveTax(0, brackets)).toEqual({ tax: 0, marginalRate: 0.10 });
    expect(calculateProgressiveTax(-500, brackets)).toEqual({ tax: 0, marginalRate: 0.10 });
  });

  it("taxes income entirely within the first bracket at the first rate", () => {
    const { tax, marginalRate } = calculateProgressiveTax(10000, brackets);
    expect(tax).toBeCloseTo(1000, 5);
    expect(marginalRate).toBe(0.10);
  });

  it("applies marginal rates progressively across multiple brackets", () => {
    // 12400 * 0.10 + (50400-12400) * 0.12 + (60000-50400) * 0.22
    const { tax, marginalRate } = calculateProgressiveTax(60000, brackets);
    const expected = 12400 * 0.10 + 38000 * 0.12 + 9600 * 0.22;
    expect(tax).toBeCloseTo(expected, 5);
    expect(marginalRate).toBe(0.22);
  });

  it("never taxes income in a bracket it hasn't reached", () => {
    const { tax } = calculateProgressiveTax(5000, brackets);
    expect(tax).toBeCloseTo(500, 5);
  });
});

describe("calculateFederalWithholding", () => {
  it("matches a hand-computed example: single filer, $75,000/yr biweekly", () => {
    const result = calculateFederalWithholding({
      grossPay: 75000 / 26,
      payFrequency: "biweekly",
      filingStatus: "single",
    });

    // taxable = 75000 - 16100 (2026 standard deduction) = 58900
    // tax = 12400*.10 + 38000*.12 + 8500*.22 = 1240 + 4560 + 1870 = 7670
    expect(result.annualFederalTax).toBeCloseTo(7670, 2);
    expect(result.federalTaxPerPeriod).toBeCloseTo(7670 / 26, 2);
    expect(result.marginalRate).toBe(0.22);
  });

  it("reduces annual tax by dependent credits without going negative", () => {
    const result = calculateFederalWithholding({
      grossPay: 20000 / 52,
      payFrequency: "weekly",
      filingStatus: "single",
      annualDependentCredits: 100000, // deliberately huge to test the floor
    });
    expect(result.annualFederalTax).toBe(0);
    expect(result.federalTaxPerPeriod).toBe(0);
  });

  it("applies extra flat-dollar withholding on top of the computed tax", () => {
    const base = calculateFederalWithholding({
      grossPay: 3000,
      payFrequency: "biweekly",
      filingStatus: "single",
    });
    const withExtra = calculateFederalWithholding({
      grossPay: 3000,
      payFrequency: "biweekly",
      filingStatus: "single",
      extraWithholding: 50,
    });
    expect(withExtra.federalTaxPerPeriod - base.federalTaxPerPeriod).toBeCloseTo(50, 5);
  });

  it("reduces taxable wages by pre-tax deductions before annualizing", () => {
    const withoutDeduction = calculateFederalWithholding({
      grossPay: 3000,
      payFrequency: "biweekly",
      filingStatus: "single",
    });
    const withDeduction = calculateFederalWithholding({
      grossPay: 3000,
      payFrequency: "biweekly",
      filingStatus: "single",
      preTaxDeductions: 500,
    });
    expect(withDeduction.annualTaxableWages).toBeCloseTo(
      withoutDeduction.annualTaxableWages - 500 * 26,
      2
    );
  });
});

describe("calculateFica", () => {
  it("withholds 6.2% Social Security and 1.45% Medicare with no prior YTD wages", () => {
    const result = calculateFica({
      grossPay: 3000,
      payFrequency: "biweekly",
      filingStatus: "single",
    });
    expect(result.socialSecurityTax).toBeCloseTo(3000 * 0.062, 5);
    expect(result.medicareTax).toBeCloseTo(3000 * 0.0145, 5);
    expect(result.additionalMedicareTax).toBe(0);
  });

  it("stops withholding Social Security once the YTD wage base is reached", () => {
    const result = calculateFica({
      grossPay: 5000,
      payFrequency: "biweekly",
      filingStatus: "single",
      ytdSocialSecurityWages: 184500, // already at the 2026 wage base
    });
    expect(result.socialSecurityTax).toBe(0);
    expect(result.socialSecurityWageBaseReached).toBe(true);
  });

  it("prorates Social Security in the pay period that crosses the wage base", () => {
    const result = calculateFica({
      grossPay: 5000,
      payFrequency: "biweekly",
      filingStatus: "single",
      ytdSocialSecurityWages: 184500 - 2000, // $2,000 of room left
    });
    expect(result.socialSecurityTax).toBeCloseTo(2000 * 0.062, 5);
    expect(result.socialSecurityWageBaseReached).toBe(true);
  });

  it("never applies a wage cap to Medicare", () => {
    const result = calculateFica({
      grossPay: 50000,
      payFrequency: "monthly",
      filingStatus: "single",
      ytdGrossWages: 500000,
    });
    expect(result.medicareTax).toBeCloseTo(50000 * 0.0145, 5);
  });

  it("applies the 0.9% Additional Medicare Tax only above the $200,000 employer-withholding threshold", () => {
    const belowThreshold = calculateFica({
      grossPay: 10000,
      payFrequency: "monthly",
      filingStatus: "single",
      ytdGrossWages: 100000,
    });
    expect(belowThreshold.additionalMedicareTax).toBe(0);

    const crossesThreshold = calculateFica({
      grossPay: 20833.33,
      payFrequency: "monthly",
      filingStatus: "marriedJoint",
      ytdGrossWages: 190000,
    });
    // wages over threshold this period = (190000+20833.33) - 200000 = 10833.33
    expect(crossesThreshold.additionalMedicareTax).toBeCloseTo(10833.33 * 0.009, 2);
  });
});

describe("PAY_PERIODS_PER_YEAR", () => {
  it("has the correct period counts for every frequency", () => {
    expect(PAY_PERIODS_PER_YEAR.weekly).toBe(52);
    expect(PAY_PERIODS_PER_YEAR.biweekly).toBe(26);
    expect(PAY_PERIODS_PER_YEAR.semimonthly).toBe(24);
    expect(PAY_PERIODS_PER_YEAR.monthly).toBe(12);
    expect(PAY_PERIODS_PER_YEAR.annually).toBe(1);
  });
});
