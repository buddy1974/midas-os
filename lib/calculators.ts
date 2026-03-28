// ─────────────────────────────────────────────
// Midas OS — Financial Calculators
// Pure functions, no side effects, full TypeScript
// ─────────────────────────────────────────────

// ── ROI Calculator ────────────────────────────

export interface ROIInputs {
  purchasePrice: number;
  refurbCost: number;
  buyingCosts: number;
  arv: number;
  monthlyRent: number;
  monthlyMortgage: number;
}

export interface ROIResults {
  totalInvested: number;
  equityGain: number;
  roi: number;
  grossYield: number;
  monthlyExpenses: number;
  monthlyNet: number;
  annualNet: number;
  paybackYears: number;
  verdict: string;
}

export function calculateROI(inputs: ROIInputs): ROIResults {
  const { purchasePrice, refurbCost, buyingCosts, arv, monthlyRent, monthlyMortgage } = inputs;

  const totalInvested = purchasePrice + refurbCost + buyingCosts;
  const equityGain = arv - totalInvested;
  const roi = totalInvested > 0 ? (equityGain / totalInvested) * 100 : 0;
  const grossYield = purchasePrice > 0 ? ((monthlyRent * 12) / purchasePrice) * 100 : 0;
  const monthlyExpenses =
    monthlyMortgage + monthlyRent * 0.1 + 35 + 50;
  const monthlyNet = monthlyRent - monthlyExpenses;
  const annualNet = monthlyNet * 12;
  const paybackYears = totalInvested / (annualNet > 0 ? annualNet : 1);

  let verdict: string;
  if (roi >= 25) {
    verdict =
      "🟢 Exceptional deal. Strong equity play with solid refurb upside. Push for exchange quickly — this won't last at guide.";
  } else if (roi >= 15) {
    verdict =
      "🟡 Solid investment. Good equity margin with manageable risk profile. Verify comparable sales before committing.";
  } else if (roi >= 5) {
    verdict =
      "🟠 Marginal. Negotiate harder on price or reduce refurb scope. Consider creative finance to improve returns.";
  } else {
    verdict =
      "🔴 Deal needs restructuring. Consider creative finance structures — vendor finance or lease option could unlock this one.";
  }

  return {
    totalInvested,
    equityGain,
    roi,
    grossYield,
    monthlyExpenses,
    monthlyNet,
    annualNet,
    paybackYears,
    verdict,
  };
}

// ── Stamp Duty (SDLT) ─────────────────────────

export type BuyerType =
  | "standard"
  | "first_time"
  | "additional"
  | "limited_company";

export interface SDLTBand {
  label: string;
  tax: number;
  rate: number;
}

export interface SDLTResults {
  totalSDLT: number;
  effectiveRate: number;
  totalCost: number;
  bandLabel: string;
  breakdown: SDLTBand[];
}

export function calculateSDLT(price: number, buyerType: BuyerType): SDLTResults {
  let totalSDLT = 0;
  const breakdown: SDLTBand[] = [];

  if (buyerType === "first_time" && price <= 625_000) {
    // FTB relief bands
    const bands = [
      { from: 0, to: 425_000, rate: 0, label: "£0–£425k" },
      { from: 425_000, to: 625_000, rate: 0.05, label: "£425k–£625k" },
    ];
    for (const band of bands) {
      if (price > band.from) {
        const taxable = Math.min(price, band.to) - band.from;
        const tax = taxable * band.rate;
        totalSDLT += tax;
        breakdown.push({ label: band.label, tax, rate: band.rate * 100 });
      }
    }
  } else {
    // Standard bands (also used for FTB above £625k, additional, ltd company)
    const standardBands = [
      { from: 0, to: 250_000, rate: 0, label: "£0–£250k" },
      { from: 250_000, to: 925_000, rate: 0.05, label: "£250k–£925k" },
      { from: 925_000, to: 1_500_000, rate: 0.1, label: "£925k–£1.5m" },
      { from: 1_500_000, to: Infinity, rate: 0.12, label: "£1.5m+" },
    ];
    for (const band of standardBands) {
      if (price > band.from) {
        const taxable = Math.min(price, band.to === Infinity ? price : band.to) - band.from;
        const tax = taxable * band.rate;
        totalSDLT += tax;
        breakdown.push({ label: band.label, tax, rate: band.rate * 100 });
      }
    }

    // Additional property / Ltd company: add 3% surcharge on full price
    if (buyerType === "additional" || buyerType === "limited_company") {
      const surcharge = price * 0.03;
      totalSDLT += surcharge;
      breakdown.push({ label: "3% Surcharge (additional)", tax: surcharge, rate: 3 });
    }
  }

  const effectiveRate = price > 0 ? (totalSDLT / price) * 100 : 0;
  const totalCost = price + totalSDLT;

  const bandLabel =
    price <= 250_000
      ? "Basic (0%)"
      : price <= 925_000
      ? "Standard (5%)"
      : price <= 1_500_000
      ? "Premium (10%)"
      : "Top Rate (12%)";

  return { totalSDLT, effectiveRate, totalCost, bandLabel, breakdown };
}

// ── Bridging Loan ─────────────────────────────

export type ExitStrategy =
  | "refinance_btl"
  | "sale_after_refurb"
  | "cash_purchase";

export interface BridgingInputs {
  propertyValue: number;
  loanAmount: number;
  monthlyRate: number;
  term: number;
  arrangementFeePercent: number;
  exitStrategy: ExitStrategy;
}

export interface BridgingResults {
  ltv: number;
  monthlyInterest: number;
  totalInterest: number;
  arrangementFee: number;
  totalCost: number;
  totalRepayable: number;
  ltvWarning: string;
  assessment: string;
}

export function calculateBridging(inputs: BridgingInputs): BridgingResults {
  const { propertyValue, loanAmount, monthlyRate, term, arrangementFeePercent, exitStrategy } =
    inputs;

  const ltv = propertyValue > 0 ? (loanAmount / propertyValue) * 100 : 0;
  const monthlyInterest = loanAmount * (monthlyRate / 100);
  const totalInterest = monthlyInterest * term;
  const arrangementFee = loanAmount * (arrangementFeePercent / 100);
  const totalCost = totalInterest + arrangementFee;
  const totalRepayable = loanAmount + totalCost;

  let ltvWarning = "";
  if (ltv > 80) {
    ltvWarning = "⚠️ High LTV. Most bridging lenders cap at 75–80%.";
  } else if (ltv > 75) {
    ltvWarning = "⚠️ Approaching typical lender LTV limits.";
  }

  const exitLabels: Record<ExitStrategy, string> = {
    refinance_btl: "Refinance to BTL",
    sale_after_refurb: "Sale After Refurb",
    cash_purchase: "Cash Purchase",
  };

  let assessment = `Exit strategy: ${exitLabels[exitStrategy]}. `;
  if (exitStrategy === "refinance_btl") {
    assessment +=
      ltv <= 75
        ? "LTV is within typical BTL refinance range. Ensure rental yield satisfies lender stress tests."
        : "LTV may hinder BTL refinance. Target sub-75% LTV or negotiate lower purchase price.";
  } else if (exitStrategy === "sale_after_refurb") {
    assessment +=
      "Ensure refurb ARV covers total repayable plus profit margin. Factor in selling costs (~3%).";
  } else {
    assessment +=
      "Cash exit is clean and low risk. Confirm liquidity availability before drawdown.";
  }

  return {
    ltv,
    monthlyInterest,
    totalInterest,
    arrangementFee,
    totalCost,
    totalRepayable,
    ltvWarning,
    assessment,
  };
}

// ── Cashflow Calculator ───────────────────────

export interface CashflowInputs {
  monthlyRent: number;
  mortgage: number;
  managementPct: number;
  insurance: number;
  maintenance: number;
  voidPct: number;
}

export interface CashflowResults {
  voidDeduction: number;
  effectiveRent: number;
  managementCost: number;
  totalExpenses: number;
  monthlyNet: number;
  annualNet: number;
  verdict: string;
}

export function calculateCashflow(inputs: CashflowInputs): CashflowResults {
  const { monthlyRent, mortgage, managementPct, insurance, maintenance, voidPct } = inputs;

  const voidDeduction = monthlyRent * (voidPct / 100);
  const effectiveRent = monthlyRent - voidDeduction;
  const managementCost = monthlyRent * (managementPct / 100);
  const totalExpenses = mortgage + managementCost + insurance + maintenance + voidDeduction;
  const monthlyNet = effectiveRent - totalExpenses;
  const annualNet = monthlyNet * 12;

  let verdict: string;
  if (monthlyNet > 300) {
    verdict = "🟢 Strong cashflow property";
  } else if (monthlyNet > 100) {
    verdict = "🟡 Modest cashflow. Viable.";
  } else if (monthlyNet > 0) {
    verdict = "🟠 Barely cashflow positive. Watch void risk.";
  } else {
    verdict = "🔴 Cashflow negative. Restructure or pass.";
  }

  return {
    voidDeduction,
    effectiveRent,
    managementCost,
    totalExpenses,
    monthlyNet,
    annualNet,
    verdict,
  };
}

// ── Creative Finance ──────────────────────────

export type StructureType =
  | "vendor_finance"
  | "lease_option"
  | "joint_venture"
  | "subject_to_mortgage"
  | "instalment_sale";

export interface CreativeFinanceInputs {
  propertyValue: number;
  agreedPrice: number;
  structureType: StructureType;
  monthlyVendorPayment: number;
  monthlyRent: number;
}

export interface CreativeFinanceResults {
  dayOneEquity: number;
  discount: number;
  netMonthlySpread: number;
  annualProfit: number;
  notes: string;
}

export function calculateCreativeFinance(
  inputs: CreativeFinanceInputs
): CreativeFinanceResults {
  const { propertyValue, agreedPrice, structureType, monthlyVendorPayment, monthlyRent } =
    inputs;

  const dayOneEquity = propertyValue - agreedPrice;
  const discount =
    propertyValue > 0 ? ((propertyValue - agreedPrice) / propertyValue) * 100 : 0;
  const netMonthlySpread = monthlyRent - monthlyVendorPayment;
  const annualProfit = netMonthlySpread * 12;

  const notesMap: Record<StructureType, string> = {
    vendor_finance:
      "Vendor acts as the lender. You pay monthly instalments directly. No bank required. Solicitor must document the charge correctly.",
    lease_option:
      "Control the property now, buy later. Option fee locks in today's price. Ideal if market rising or you need time to arrange finance.",
    joint_venture:
      "Split profits with the vendor or a money partner. Document profit share % clearly. JV agreement required before any money moves.",
    subject_to_mortgage:
      "Take over the existing mortgage payments. Lender consent is required. Use only with proper legal advice — significant risk if lender calls in the loan.",
    instalment_sale:
      "Purchase price paid in agreed instalments over time. Title transfers upon final payment. Secure with a charge registered at Land Registry.",
  };

  return {
    dayOneEquity,
    discount,
    netMonthlySpread,
    annualProfit,
    notes: notesMap[structureType],
  };
}
