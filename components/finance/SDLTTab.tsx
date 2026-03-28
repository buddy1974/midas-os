"use client";

import { useState } from "react";
import { calculateSDLT, type BuyerType } from "@/lib/calculators";

const BUYER_TYPES: { value: BuyerType; label: string }[] = [
  { value: "standard", label: "Standard Residential" },
  { value: "first_time", label: "First-Time Buyer" },
  { value: "additional", label: "Additional Property (+3% surcharge)" },
  { value: "limited_company", label: "Limited Company / Investor" },
];

function fmt(n: number) {
  return `£${Math.round(n).toLocaleString("en-GB")}`;
}

export default function SDLTTab() {
  const [price, setPrice] = useState(160000);
  const [buyerType, setBuyerType] = useState<BuyerType>("standard");

  const results = calculateSDLT(price, buyerType);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Inputs */}
      <div
        className="rounded-lg p-5 space-y-4"
        style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
      >
        <p className="text-xs uppercase tracking-widest" style={{ color: "var(--color-text-dim)" }}>Inputs</p>

        <div>
          <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: "var(--color-text-dim)" }}>
            Purchase Price
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--color-text-dim)" }}>£</span>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full rounded pl-7 pr-3 py-2 text-sm outline-none"
              style={{
                backgroundColor: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text)",
              }}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: "var(--color-text-dim)" }}>
            Buyer Type
          </label>
          <select
            value={buyerType}
            onChange={(e) => setBuyerType(e.target.value as BuyerType)}
            className="w-full rounded px-3 py-2 text-sm outline-none"
            style={{
              backgroundColor: "var(--color-surface-2)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text)",
            }}
          >
            {BUYER_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
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
            {fmt(results.totalSDLT)}
          </p>
          <p className="text-xs mt-1 uppercase tracking-wider" style={{ color: "var(--color-text-dim)" }}>Total SDLT Payable</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Effective Rate", value: `${results.effectiveRate.toFixed(2)}%` },
            { label: "Total Cost (inc. SDLT)", value: fmt(results.totalCost) },
            { label: "SDLT Band", value: results.bandLabel },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded p-3"
              style={{ backgroundColor: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}
            >
              <p className="text-xs" style={{ color: "var(--color-text-dim)" }}>{label}</p>
              <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--color-text)" }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Band breakdown */}
        <div>
          <p className="text-xs uppercase tracking-wider mb-2" style={{ color: "var(--color-text-dim)" }}>Band Breakdown</p>
          <div className="space-y-1.5">
            {results.breakdown.filter((b) => b.tax > 0 || results.breakdown.length <= 2).map((band, i) => (
              <div key={i} className="flex justify-between text-xs">
                <span style={{ color: "var(--color-text-dim)" }}>{band.label} ({band.rate}%)</span>
                <span style={{ color: "var(--color-text)" }}>{fmt(band.tax)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
