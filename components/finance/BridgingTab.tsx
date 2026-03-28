"use client";

import { useState } from "react";
import { calculateBridging, type BridgingInputs, type ExitStrategy } from "@/lib/calculators";

const EXIT_STRATEGIES: { value: ExitStrategy; label: string }[] = [
  { value: "refinance_btl", label: "Refinance to BTL" },
  { value: "sale_after_refurb", label: "Sale after refurb" },
  { value: "cash_purchase", label: "Cash purchase" },
];

function fmt(n: number) {
  return `£${Math.round(n).toLocaleString("en-GB")}`;
}

export default function BridgingTab() {
  const [inputs, setInputs] = useState<BridgingInputs>({
    propertyValue: 160000,
    loanAmount: 128000,
    monthlyRate: 0.75,
    term: 6,
    arrangementFeePercent: 2,
    exitStrategy: "refinance_btl",
  });

  const results = calculateBridging(inputs);

  function set<K extends keyof BridgingInputs>(key: K, value: BridgingInputs[K]) {
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

        {[
          { label: "Property Value", key: "propertyValue" as const, prefix: "£" },
          { label: "Loan Amount", key: "loanAmount" as const, prefix: "£" },
          { label: "Monthly Rate (%)", key: "monthlyRate" as const, prefix: "" },
          { label: "Arrangement Fee (%)", key: "arrangementFeePercent" as const, prefix: "" },
        ].map(({ label, key, prefix }) => (
          <div key={key}>
            <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: "var(--color-text-dim)" }}>{label}</label>
            <div className="relative">
              {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--color-text-dim)" }}>{prefix}</span>}
              <input
                type="number"
                step="0.01"
                value={inputs[key] as number}
                onChange={(e) => set(key, Number(e.target.value))}
                className="w-full rounded py-2 text-sm outline-none"
                style={{
                  paddingLeft: prefix ? "1.75rem" : "0.75rem",
                  paddingRight: "0.75rem",
                  backgroundColor: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text)",
                }}
              />
            </div>
          </div>
        ))}

        {/* Term slider */}
        <div>
          <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: "var(--color-text-dim)" }}>
            Term: {inputs.term} months
          </label>
          <input
            type="range"
            min={1}
            max={24}
            value={inputs.term}
            onChange={(e) => set("term", Number(e.target.value))}
            className="w-full accent-amber-500"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: "var(--color-text-dim)" }}>Exit Strategy</label>
          <select
            value={inputs.exitStrategy}
            onChange={(e) => set("exitStrategy", e.target.value as ExitStrategy)}
            className="w-full rounded px-3 py-2 text-sm outline-none"
            style={{
              backgroundColor: "var(--color-surface-2)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text)",
            }}
          >
            {EXIT_STRATEGIES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      <div
        className="rounded-lg p-5 space-y-5"
        style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
      >
        <p className="text-xs uppercase tracking-widest" style={{ color: "var(--color-text-dim)" }}>Results</p>

        <div className="text-center py-4">
          <p className="text-5xl font-bold" style={{ color: "var(--color-gold)" }}>
            {results.ltv.toFixed(1)}%
          </p>
          <p className="text-xs mt-1 uppercase tracking-wider" style={{ color: "var(--color-text-dim)" }}>Loan-to-Value (LTV)</p>
        </div>

        {results.ltvWarning && (
          <div
            className="rounded p-3 text-xs"
            style={{ backgroundColor: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", color: "#F59E0B" }}
          >
            {results.ltvWarning}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Monthly Interest", value: fmt(results.monthlyInterest) },
            { label: "Total Interest", value: fmt(results.totalInterest) },
            { label: "Arrangement Fee", value: fmt(results.arrangementFee) },
            { label: "Total Cost", value: fmt(results.totalCost) },
            { label: "Total Repayable", value: fmt(results.totalRepayable) },
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

        <div
          className="rounded p-4 text-sm"
          style={{
            backgroundColor: "rgba(201,168,76,0.06)",
            borderLeft: "3px solid var(--color-gold)",
            color: "var(--color-text)",
          }}
        >
          {results.assessment}
        </div>
      </div>
    </div>
  );
}
