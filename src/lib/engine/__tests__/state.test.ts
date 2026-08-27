import { describe, it, expect } from "vitest";
import { calculateStateWithholding, getAllStates } from "@/lib/engine/state";

describe("calculateStateWithholding — no-income-tax states", () => {
  it("returns zero state income tax for Texas", () => {
    const result = calculateStateWithholding({
      stateCode: "TX",
      grossPay: 3000,
      payFrequency: "biweekly",
      filingStatus: "single",
    });
    expect(result.hasIncomeTax).toBe(false);
    expect(result.stateTaxPerPeriod).toBe(0);
  });

  it("still applies WA Cares even though Washington has no income tax", () => {
    const result = calculateStateWithholding({
      stateCode: "WA",
      grossPay: 2000,
      payFrequency: "weekly",
      filingStatus: "single",
    });
    expect(result.stateTaxPerPeriod).toBe(0);
    expect(result.totalSpecialPayrollTaxPerPeriod).toBeCloseTo(2000 * 0.0058, 5);
  });
});

describe("calculateStateWithholding — flat-rate states", () => {
  it("applies Colorado's flat 4.4% rate after the standard deduction", () => {
    const result = calculateStateWithholding({
      stateCode: "CO",
      grossPay: 60000 / 26,
      payFrequency: "biweekly",
      filingStatus: "single",
    });
    const expectedAnnualTaxable = 60000 - 16100;
    expect(result.annualTaxableWages).toBeCloseTo(expectedAnnualTaxable, 2);
    expect(result.annualStateTax).toBeCloseTo(expectedAnnualTaxable * 0.044, 2);
  });

  it("includes CO FAMLI as a special payroll tax capped at the SS wage base", () => {
    const result = calculateStateWithholding({
      stateCode: "CO",
      grossPay: 10000,
      payFrequency: "monthly",
      filingStatus: "single",
      ytdSpecialPayrollWages: { CO_FAMLI: 180000 },
    });
    const famli = result.specialPayrollTaxes.find((t) => t.id === "CO_FAMLI");
    expect(famli).toBeDefined();
    // only $4,500 of room left before the $184,500 cap
    expect(famli!.taxPerPeriod).toBeCloseTo(4500 * 0.0044, 5);
  });
});

describe("calculateStateWithholding — graduated states", () => {
  it("matches a hand-computed example for Georgia (flat state, sanity baseline)", () => {
    const result = calculateStateWithholding({
      stateCode: "GA",
      grossPay: 2500,
      payFrequency: "biweekly",
      filingStatus: "single",
    });
    // annual gross = 65000; taxable = 65000 - 12000 = 53000; tax = 53000*0.0519
    expect(result.annualStateTax).toBeCloseTo(53000 * 0.0519, 2);
    expect(result.stateTaxPerPeriod).toBeCloseTo((53000 * 0.0519) / 26, 2);
  });

  it("computes California's progressive brackets and subtracts the exemption credit", () => {
    const result = calculateStateWithholding({
      stateCode: "CA",
      grossPay: 120000 / 26,
      payFrequency: "biweekly",
      filingStatus: "single",
    });
    // taxable = 120000 - 5540 = 114460
    // 1%*11079 + 2%*15185 + 4%*15188 + 6%*16090 + 8%*15182 + 9.3%*41736 - 153 credit
    const expectedGrossTax =
      0.01 * 11079 +
      0.02 * (26264 - 11079) +
      0.04 * (41452 - 26264) +
      0.06 * (57542 - 41452) +
      0.08 * (72724 - 57542) +
      0.093 * (114460 - 72724);
    expect(result.annualStateTax).toBeCloseTo(expectedGrossTax - 153, 1);
  });

  it("caps California SDI's wage base at none (applies to all wages)", () => {
    const result = calculateStateWithholding({
      stateCode: "CA",
      grossPay: 50000,
      payFrequency: "monthly",
      filingStatus: "single",
      ytdSpecialPayrollWages: { CA_SDI: 5000000 }, // huge YTD — CA SDI has no cap
    });
    const sdi = result.specialPayrollTaxes.find((t) => t.id === "CA_SDI");
    expect(sdi!.taxPerPeriod).toBeCloseTo(50000 * 0.013, 5);
  });
});

describe("calculateStateWithholding — dollar-capped special payroll taxes", () => {
  it("caps NY PFL at its annual dollar maximum regardless of income", () => {
    const result = calculateStateWithholding({
      stateCode: "NY",
      grossPay: 250000 / 12,
      payFrequency: "monthly",
      filingStatus: "marriedJoint",
    });
    const pfl = result.specialPayrollTaxes.find((t) => t.id === "NY_PFL");
    expect(pfl).toBeDefined();
    // uncapped would be (250000*0.00432)/12 = 90/mo -> annual 1080, capped to 411.91
    expect(pfl!.taxPerPeriod).toBeCloseTo(411.91 / 12, 2);
  });

  it("caps Hawaii TDI at its weekly dollar maximum", () => {
    const result = calculateStateWithholding({
      stateCode: "HI",
      grossPay: 10000, // very high weekly-equivalent wage
      payFrequency: "weekly",
      filingStatus: "single",
    });
    const tdi = result.specialPayrollTaxes.find((t) => t.id === "HI_TDI");
    expect(tdi!.taxPerPeriod).toBeCloseTo(6.0, 5);
  });
});

describe("calculateStateWithholding — data integrity across all 50 states + DC", () => {
  it("returns a valid, non-negative result for every state at a mid-range salary", () => {
    const states = getAllStates();
    expect(states.length).toBe(51);

    for (const { code } of states) {
      const result = calculateStateWithholding({
        stateCode: code,
        grossPay: 70000 / 26,
        payFrequency: "biweekly",
        filingStatus: "single",
      });
      expect(result.stateTaxPerPeriod).toBeGreaterThanOrEqual(0);
      expect(result.totalSpecialPayrollTaxPerPeriod).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(result.stateTaxPerPeriod)).toBe(true);
      expect(Number.isNaN(result.stateTaxPerPeriod)).toBe(false);
    }
  });

  it("never taxes states with hasIncomeTax: false", () => {
    const noTaxStates = ["AK", "FL", "NV", "NH", "SD", "TN", "TX", "WY"] as const;
    for (const code of noTaxStates) {
      const result = calculateStateWithholding({
        stateCode: code,
        grossPay: 5000,
        payFrequency: "biweekly",
        filingStatus: "single",
      });
      expect(result.hasIncomeTax).toBe(false);
      expect(result.stateTaxPerPeriod).toBe(0);
    }
  });
});
