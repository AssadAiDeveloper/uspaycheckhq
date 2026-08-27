import { describe, it, expect } from "vitest";
import { calculatePaycheck, calculateAnnualSalaryExample } from "@/lib/engine/calculator";

describe("calculatePaycheck — regression: effective tax rate must include FICA and payroll taxes", () => {
  // This test locks in the fix for a reported bug where the UI derived
  // "Effective Tax Rate" by summing federal.incomeTaxEffectiveRate +
  // state.incomeTaxEffectiveRate — both of which deliberately exclude FICA
  // and state payroll programs, silently understating the true rate.
  it("matches the reported Georgia example: $2,500 gross, single, biweekly", () => {
    const result = calculatePaycheck({
      stateCode: "GA",
      filingStatus: "single",
      payFrequency: "biweekly",
      grossPayPerPeriod: 2500,
    });

    expect(result.federal.incomeTax).toBeCloseTo(216.15, 1);
    expect(result.state.incomeTax).toBeCloseTo(105.80, 1);
    expect(result.totalTaxesAndDeductions).toBeCloseTo(513.20, 1);

    // The buggy calculation would have produced ~12.9%.
    const buggyRate =
      (result.federal.incomeTax + result.state.incomeTax) / result.grossPay;
    expect(buggyRate).not.toBeCloseTo(result.effectiveTaxRate, 2);

    // The correct rate is total mandatory taxes (income tax + FICA + state
    // payroll programs) over gross pay — approximately 20.5%.
    expect(result.effectiveTaxRate).toBeCloseTo(0.2053, 3);
    expect(result.effectiveTaxRate).toBeCloseTo(
      result.totalTaxesAndDeductions / result.grossPay,
      5
    );
  });

  it("holds for California too (progressive state tax + SDI)", () => {
    const result = calculatePaycheck({
      stateCode: "CA",
      filingStatus: "single",
      payFrequency: "biweekly",
      grossPayPerPeriod: 2500,
    });
    const totalTax =
      result.federal.total + result.state.total; // excludes post-tax deductions by design
    expect(result.effectiveTaxRate).toBeCloseTo(totalTax / result.grossPay, 5);
  });

  it("excludes voluntary post-tax deductions from the tax rate", () => {
    const withoutPostTax = calculatePaycheck({
      stateCode: "TX",
      filingStatus: "single",
      payFrequency: "biweekly",
      grossPayPerPeriod: 3000,
    });
    const withPostTax = calculatePaycheck({
      stateCode: "TX",
      filingStatus: "single",
      payFrequency: "biweekly",
      grossPayPerPeriod: 3000,
      postTaxDeductions: 500, // e.g. a Roth 401(k) contribution — not a tax
    });
    // effectiveTaxRate should be identical: post-tax deductions aren't taxes.
    expect(withPostTax.effectiveTaxRate).toBeCloseTo(withoutPostTax.effectiveTaxRate, 10);
    // but net pay should differ by exactly the post-tax deduction.
    expect(withoutPostTax.netPay - withPostTax.netPay).toBeCloseTo(500, 5);
  });

  it("returns 0% for a $0 gross paycheck instead of dividing by zero", () => {
    const result = calculatePaycheck({
      stateCode: "TX",
      filingStatus: "single",
      payFrequency: "biweekly",
      grossPayPerPeriod: 0,
    });
    expect(result.effectiveTaxRate).toBe(0);
    expect(Number.isNaN(result.effectiveTaxRate)).toBe(false);
  });
});

describe("calculatePaycheck — 401(k) vs HSA/FSA payroll tax treatment", () => {
  // 401(k) traditional contributions reduce federal/state taxable wages but
  // are still subject to FICA. Section 125 (HSA/FSA/pre-tax premiums)
  // reduce federal/state wages AND FICA wages. Mixing these up
  // overstates or understates take-home pay for anyone using either benefit.
  it("does NOT reduce FICA wages for a 401(k) contribution", () => {
    const withoutDeduction = calculatePaycheck({
      stateCode: "TX",
      filingStatus: "single",
      payFrequency: "biweekly",
      grossPayPerPeriod: 3000,
    });
    const with401k = calculatePaycheck({
      stateCode: "TX",
      filingStatus: "single",
      payFrequency: "biweekly",
      grossPayPerPeriod: 3000,
      retirement401kDeduction: 500,
    });
    // FICA (Social Security + Medicare) must be identical — 401(k) doesn't shield it.
    const ficaWithout =
      withoutDeduction.federal.socialSecurity + withoutDeduction.federal.medicare;
    const ficaWith401k =
      with401k.federal.socialSecurity + with401k.federal.medicare;
    expect(ficaWith401k).toBeCloseTo(ficaWithout, 5);

    // But federal income tax should be lower, since 401(k) does reduce federal taxable wages.
    expect(with401k.federal.incomeTax).toBeLessThan(
      withoutDeduction.federal.incomeTax
    );
  });

  it("DOES reduce FICA wages for an HSA/FSA (Section 125) contribution", () => {
    const withoutDeduction = calculatePaycheck({
      stateCode: "TX",
      filingStatus: "single",
      payFrequency: "biweekly",
      grossPayPerPeriod: 3000,
    });
    const withHsa = calculatePaycheck({
      stateCode: "TX",
      filingStatus: "single",
      payFrequency: "biweekly",
      grossPayPerPeriod: 3000,
      section125Deduction: 500,
    });
    const ficaWithout =
      withoutDeduction.federal.socialSecurity + withoutDeduction.federal.medicare;
    const ficaWithHsa =
      withHsa.federal.socialSecurity + withHsa.federal.medicare;
    // FICA should be lower by exactly 500 * 7.65%.
    expect(ficaWithout - ficaWithHsa).toBeCloseTo(500 * 0.0765, 5);
  });

  it("treats 401(k) and Section 125 identically for federal/state income tax", () => {
    const with401k = calculatePaycheck({
      stateCode: "CA",
      filingStatus: "single",
      payFrequency: "biweekly",
      grossPayPerPeriod: 3000,
      retirement401kDeduction: 300,
    });
    const withHsa = calculatePaycheck({
      stateCode: "CA",
      filingStatus: "single",
      payFrequency: "biweekly",
      grossPayPerPeriod: 3000,
      section125Deduction: 300,
    });
    expect(with401k.federal.incomeTax).toBeCloseTo(withHsa.federal.incomeTax, 5);
    expect(with401k.state.incomeTax).toBeCloseTo(withHsa.state.incomeTax, 5);
  });

  it("reports the combined preTaxDeductions total correctly for net pay", () => {
    const result = calculatePaycheck({
      stateCode: "TX",
      filingStatus: "single",
      payFrequency: "biweekly",
      grossPayPerPeriod: 3000,
      retirement401kDeduction: 200,
      section125Deduction: 100,
    });
    expect(result.preTaxDeductions).toBeCloseTo(300, 5);
    expect(result.retirement401kDeduction).toBe(200);
    expect(result.section125Deduction).toBe(100);
  });
});

describe("calculatePaycheck — waterfall integrity", () => {
  it("gross minus pre-tax minus taxes minus post-tax equals net pay, exactly", () => {
    const result = calculatePaycheck({
      stateCode: "NY",
      filingStatus: "marriedJoint",
      payFrequency: "monthly",
      grossPayPerPeriod: 9000,
      retirement401kDeduction: 400,
      postTaxDeductions: 150,
    });
    const reconstructedNet =
      result.grossPay -
      result.preTaxDeductions -
      result.totalTaxesAndDeductions;
    // totalTaxesAndDeductions already includes postTaxDeductions
    expect(reconstructedNet).toBeCloseTo(result.netPay, 8);
  });

  it("never produces a negative net pay for reasonable inputs", () => {
    const result = calculatePaycheck({
      stateCode: "CA",
      filingStatus: "single",
      payFrequency: "weekly",
      grossPayPerPeriod: 400,
    });
    expect(result.netPay).toBeGreaterThan(0);
  });
});

describe("calculateAnnualSalaryExample", () => {
  it("produces a biweekly breakdown for a given annual salary", () => {
    const result = calculateAnnualSalaryExample("TX", 60000, "single");
    expect(result.input.payFrequency).toBe("biweekly");
    expect(result.grossPay).toBeCloseTo(60000 / 26, 5);
    expect(result.annualized.grossPay).toBeCloseTo(60000, 2);
  });
});
