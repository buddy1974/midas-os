"use client";

import { useState } from "react";
import { calculateROI, type ROIInputs } from "@/lib/calculators";

function fmt(n: number) {
  return `£${Math.round(n).toLocaleString("en-GB")}`;
}
function fmtPct(n: number) {
  return `${n.toFixed(1)}%`;
}

interface InputRowProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
}

function InputRow({ label, value, onChange }: InputRowProps) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: "var(--color-text-dim)" }}>
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--color-text-dim)" }}>£</span>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full rounded pl-7 pr-3 py-2 text-sm outline-none"
          style={{
            backgroundColor: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text)",
          }}
        />
      </div>
    </div>
  );
}

export default function ROITab() {
  const [inputs, setInputs] = useState<ROIInputs>({
    purchasePrice: 160000,
    refurbCost: 15000,
    buyingCosts: 7500,
    arv: 215000,
    monthlyRent: 950,
    monthlyMortgage: 520,
  });

  const results = calculateROI(inputs);

  function set(key: keyof ROIInputs, value: number) {
    setInputs((p) => ({ ...p, [key]: value }));
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Inputs */}
      <div
        className="rounded-lg p-5 space-y-4"
        style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
      >
        <p className="text-xs uppercase tracking-widest" style={{ color: "var(--color-text-dim)" }}>Inputs</p>
        <InputRow label="Purchase Price" value={inputs.purchasePrice} onChange={(v) => set("purchasePrice", v)} />
        <InputRow label="Refurbishment Cost" value={inputs.refurbCost} onChange={(v) => set("refurbCost", v)} />
        <InputRow label="Buying Costs (stamp duty, legal, survey)" value={inputs.buyingCosts} onChange={(v) => set("buyingCosts", v)} />
        <InputRow label="After Refurb Value (ARV)" value={inputs.arv} onChange={(v) => set("arv", v)} />
        <InputRow label="Monthly Rental Income" value={inputs.monthlyRent} onChange={(v) => set("monthlyRent", v)} />
        <InputRow label="Monthly Mortgage Payment" value={inputs.monthlyMortgage} onChange={(v) => set("monthlyMortgage", v)} />
      </div>

      {/* Results */}
      <div
        className="rounded-lg p-5 space-y-5"
        style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
      >
        <p className="text-xs uppercase tracking-widest" style={{ color: "var(--color-text-dim)" }}>Results</p>

        {/* Big ROI */}
        <div className="text-center py-4">
          <p className="text-5xl font-bold" style={{ color: "var(--color-gold)" }}>
            {fmtPct(results.roi)}
          </p>
          <p className="text-xs mt-1 uppercase tracking-wider" style={{ color: "var(--color-text-dim)" }}>Return on Investment</p>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Equity Gain", value: fmt(results.equityGain) },
            { label: "Total Invested", value: fmt(results.totalInvested) },
            { label: "Gross Yield", value: fmtPct(results.grossYield) },
            { label: "Monthly Net", value: fmt(results.monthlyNet) },
            { label: "Annual Net", value: fmt(results.annualNet) },
            { label: "Payback (yrs)", value: results.paybackYears.toFixed(1) },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded p-3"
              style={{ backgroundColor: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}
            >
              <p className="text-xs" style={{ color: "var(--color-text-dim)" }}>{label}</p>
              <p className="text-base font-semibold mt-0.5" style={{ color: "var(--color-text)" }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Verdict */}
        <div
          className="rounded p-4 text-sm"
          style={{
            backgroundColor: "rgba(201,168,76,0.06)",
            borderLeft: "3px solid var(--color-gold)",
            color: "var(--color-text)",
          }}
        >
          {results.verdict}
        </div>
      </div>
    </div>
  );
}
