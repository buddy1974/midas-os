"use client";

import { useState } from "react";
import { calculateCashflow, type CashflowInputs } from "@/lib/calculators";

function fmt(n: number) {
  return `£${Math.round(n).toLocaleString("en-GB")}`;
}

export default function CashflowTab() {
  const [inputs, setInputs] = useState<CashflowInputs>({
    monthlyRent: 950,
    mortgage: 520,
    managementPct: 10,
    insurance: 35,
    maintenance: 50,
    voidPct: 5,
  });

  const results = calculateCashflow(inputs);

  function set<K extends keyof CashflowInputs>(key: K, value: CashflowInputs[K]) {
    setInputs((p) => ({ ...p, [key]: value }));
  }

  const inputRows: { label: string; key: keyof CashflowInputs; prefix: string; step?: number }[] = [
    { label: "Monthly Rental Income (£)", key: "monthlyRent", prefix: "£" },
    { label: "Mortgage Payment (£/mo)", key: "mortgage", prefix: "£" },
    { label: "Management Fee (%)", key: "managementPct", prefix: "" },
    { label: "Insurance (£/mo)", key: "insurance", prefix: "£" },
    { label: "Maintenance Reserve (£/mo)", key: "maintenance", prefix: "£" },
    { label: "Void Allowance (%)", key: "voidPct", prefix: "", step: 0.5 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div
        className="rounded-lg p-5 space-y-4"
        style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
      >
        <p className="text-xs uppercase tracking-widest" style={{ color: "var(--color-text-dim)" }}>Inputs</p>
        {inputRows.map(({ label, key, prefix, step }) => (
          <div key={key}>
            <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: "var(--color-text-dim)" }}>{label}</label>
            <div className="relative">
              {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--color-text-dim)" }}>{prefix}</span>}
              <input
                type="number"
                step={step ?? 1}
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
      </div>

      <div
        className="rounded-lg p-5 space-y-5"
        style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
      >
        <p className="text-xs uppercase tracking-widest" style={{ color: "var(--color-text-dim)" }}>Results</p>

        <div className="text-center py-4">
          <p
            className="text-5xl font-bold"
            style={{ color: results.monthlyNet > 0 ? "#22c55e" : "#ef4444" }}
          >
            {fmt(results.monthlyNet)}
          </p>
          <p className="text-xs mt-1 uppercase tracking-wider" style={{ color: "var(--color-text-dim)" }}>Monthly Net Cashflow</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Effective Rent", value: fmt(results.effectiveRent) },
            { label: "Void Deduction", value: fmt(results.voidDeduction) },
            { label: "Management Cost", value: fmt(results.managementCost) },
            { label: "Total Expenses", value: fmt(results.totalExpenses) },
            { label: "Annual Net", value: fmt(results.annualNet) },
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
          {results.verdict}
        </div>
      </div>
    </div>
  );
}
