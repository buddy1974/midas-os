"use client";

import { useState } from "react";
import { calculateCreativeFinance, type CreativeFinanceInputs, type StructureType } from "@/lib/calculators";

const STRUCTURES: { value: StructureType; label: string }[] = [
  { value: "vendor_finance", label: "Vendor Finance (Seller Mortgage)" },
  { value: "lease_option", label: "Lease Option" },
  { value: "joint_venture", label: "Joint Venture" },
  { value: "subject_to_mortgage", label: "Subject to Existing Mortgage" },
  { value: "instalment_sale", label: "Instalment Sale" },
];

function fmt(n: number) {
  return `£${Math.round(n).toLocaleString("en-GB")}`;
}

export default function CreativeTab() {
  const [inputs, setInputs] = useState<CreativeFinanceInputs>({
    propertyValue: 160000,
    agreedPrice: 155000,
    structureType: "vendor_finance",
    monthlyVendorPayment: 500,
    monthlyRent: 950,
  });

  const results = calculateCreativeFinance(inputs);

  function set<K extends keyof CreativeFinanceInputs>(key: K, value: CreativeFinanceInputs[K]) {
    setInputs((p) => ({ ...p, [key]: value }));
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div
        className="rounded-lg p-5 space-y-4"
        style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
      >
        <p className="text-xs uppercase tracking-widest" style={{ color: "var(--color-text-dim)" }}>Inputs</p>

        {[
          { label: "Property Value (£)", key: "propertyValue" as const },
          { label: "Agreed Purchase Price (£)", key: "agreedPrice" as const },
          { label: "Monthly Payment to Vendor (£)", key: "monthlyVendorPayment" as const },
          { label: "Expected Monthly Rent (£)", key: "monthlyRent" as const },
        ].map(({ label, key }) => (
          <div key={key}>
            <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: "var(--color-text-dim)" }}>{label}</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--color-text-dim)" }}>£</span>
              <input
                type="number"
                value={inputs[key] as number}
                onChange={(e) => set(key, Number(e.target.value))}
                className="w-full rounded pl-7 pr-3 py-2 text-sm outline-none"
                style={{
                  backgroundColor: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text)",
                }}
              />
            </div>
          </div>
        ))}

        <div>
          <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: "var(--color-text-dim)" }}>Structure Type</label>
          <select
            value={inputs.structureType}
            onChange={(e) => set("structureType", e.target.value as StructureType)}
            className="w-full rounded px-3 py-2 text-sm outline-none"
            style={{
              backgroundColor: "var(--color-surface-2)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text)",
            }}
          >
            {STRUCTURES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div
        className="rounded-lg p-5 space-y-5"
        style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
      >
        <p className="text-xs uppercase tracking-widest" style={{ color: "var(--color-text-dim)" }}>Results</p>

        <div className="text-center py-4">
          <p className="text-5xl font-bold" style={{ color: "var(--color-gold)" }}>
            {fmt(results.dayOneEquity)}
          </p>
          <p className="text-xs mt-1 uppercase tracking-wider" style={{ color: "var(--color-text-dim)" }}>Day-One Equity</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Discount %", value: `${results.discount.toFixed(1)}%` },
            { label: "Monthly Spread", value: fmt(results.netMonthlySpread) },
            { label: "Annual Profit", value: fmt(results.annualProfit) },
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
          className="rounded p-4 text-sm leading-relaxed"
          style={{
            backgroundColor: "rgba(201,168,76,0.06)",
            borderLeft: "3px solid var(--color-gold)",
            color: "var(--color-text)",
          }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-gold)" }}>
            Structure Notes
          </p>
          {results.notes}
        </div>
      </div>
    </div>
  );
}
