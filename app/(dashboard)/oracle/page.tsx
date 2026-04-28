"use client";

import { useState, useEffect } from "react";
import { Zap, AlertTriangle } from "lucide-react";

interface OracleInputs {
  address: string;
  propertyType: string;
  guidePrice: string;
  bedrooms: string;
  condition: string;
  notes: string;
}

interface OracleResult {
  dealScore: number;
  scoreLabel: string;
  roiEstimate: string;
  grossYieldEstimate: string;
  arv: number;
  rentalEstimate: string;
  riskLevel: string;
  keyRisks: string[];
  opportunities: string[];
  verdict: string;
  comparables: string;
}

const DEMO_RESULT: OracleResult = {
  dealScore: 72,
  scoreLabel: "Strong",
  roiEstimate: "22–28%",
  grossYieldEstimate: "6.8%",
  arv: 210000,
  rentalEstimate: "£950–£1,100/month",
  riskLevel: "Medium",
  keyRisks: [
    "RM8 postcode carries moderate void risk — verify local demand",
    "Dagenham market sensitive to interest rate changes",
  ],
  opportunities: [
    "Strong HMO conversion potential — check LB Barking planning policy",
    "Close proximity to Crossrail (Elizabeth Line) supports capital growth",
    "Guide price below £180k comparables — clear equity play",
  ],
  verdict:
    "202A Bennetts Castle Lane represents a solid value-add opportunity in Outer East London. At guide, the deal offers meaningful equity upside post-refurb with double-digit gross yield achievable. The Crossrail effect continues to drive demand in RM8, though the local market remains price-sensitive. Recommended approach: bid aggressively to guide, budget £12–15k refurb, refinance or sell within 6 months.",
  comparables:
    "Recent comparable sales in RM8: 3-bed terrace at £185,000 (Jan 2026), 2-bed mid-terrace at £162,000 (Dec 2025). ARV estimate supported by Elizabeth Line uplift data.",
};

const PROPERTY_TYPES = [
  "Residential Flat",
  "Terraced House",
  "Semi-Detached",
  "HMO",
  "Commercial",
  "Land",
  "Mixed Use",
];

const BEDROOMS = ["Studio", "1 Bed", "2 Bed", "3 Bed", "4 Bed", "5+"];

const CONDITIONS = [
  "Vacant/Needs Refurb",
  "Habitable Needs Work",
  "Good Condition",
  "Fully Renovated",
];

const LOADING_MESSAGES = [
  "Running comparable analysis...",
  "Modelling yield scenarios...",
  "Assessing risk factors...",
];

function ScoreCircle({ score, label }: { score: number; label: string }) {
  const color = score >= 70 ? "#22c55e" : score >= 40 ? "#f59e0b" : "#ef4444";
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;

  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="140" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        <circle
          cx="70" cy="70" r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div style={{ marginTop: "-90px" }} className="flex flex-col items-center">
        <span className="text-4xl font-bold" style={{ color }}>{score}</span>
        <span className="text-xs mt-1 uppercase tracking-wider" style={{ color: "var(--color-text-dim)" }}>{label}</span>
      </div>
    </div>
  );
}

export default function OraclePage() {
  const [inputs, setInputs] = useState<OracleInputs>({
    address: "202A Bennetts Castle Lane, Dagenham, RM8 3XP",
    propertyType: "Terraced House",
    guidePrice: "160000",
    bedrooms: "3 Bed",
    condition: "Vacant/Needs Refurb",
    notes: "",
  });
  const [result, setResult] = useState<OracleResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(0);
  const [error, setError] = useState("");
  const [demoMode, setDemoMode] = useState(false);

  // BMV calculator
  const guideNum = Number(inputs.guidePrice) || 0;
  const [marketValue, setMarketValue] = useState(185000);
  const bmvDiff = guideNum > 0 && marketValue > 0 ? ((marketValue - guideNum) / marketValue) * 100 : 0;
  const isBelowMarket = bmvDiff > 0;

  // Rotate loading messages
  useEffect(() => {
    if (!loading) return;
    const id = setInterval(() => setLoadingMsg((m) => (m + 1) % LOADING_MESSAGES.length), 2000);
    return () => clearInterval(id);
  }, [loading]);

  function set(key: keyof OracleInputs, value: string) {
    setInputs((p) => ({ ...p, [key]: value }));
  }

  async function handleAnalyse() {
    setError("");
    setResult(null);
    setLoading(true);
    setLoadingMsg(0);

    try {
      const res = await fetch("/api/oracle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: inputs.address,
          propertyType: inputs.propertyType,
          guidePrice: Number(inputs.guidePrice),
          bedrooms: inputs.bedrooms,
          condition: inputs.condition,
          notes: inputs.notes,
        }),
      });

      if (res.status === 503) {
        // Demo mode
        setDemoMode(true);
        setResult(DEMO_RESULT);
        return;
      }

      if (res.status === 429) {
        setError("Rate limit reached. Please wait a minute and try again.");
        return;
      }

      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setError(data.error ?? "Oracle analysis failed");
        return;
      }

      const data = await res.json() as OracleResult;
      setDemoMode(false);
      setResult(data);
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 max-w-full">
      {/* Left — Input Form */}
      <div className="space-y-5">
        <div
          className="rounded-lg p-5 space-y-4"
          style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
        >
          <p className="text-xs uppercase tracking-widest" style={{ color: "var(--color-text-dim)" }}>Property Details</p>

          <div>
            <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: "var(--color-text-dim)" }}>Address</label>
            <input
              type="text"
              value={inputs.address}
              onChange={(e) => set("address", e.target.value)}
              className="w-full rounded px-3 py-2 text-sm outline-none"
              style={{
                backgroundColor: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text)",
                fontSize: "16px",
                minHeight: "44px",
              }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: "var(--color-text-dim)" }}>Property Type</label>
              <select
                value={inputs.propertyType}
                onChange={(e) => set("propertyType", e.target.value)}
                className="w-full rounded px-3 py-2 text-sm outline-none"
                style={{
                  backgroundColor: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text)",
                  fontSize: "16px",
                  minHeight: "44px",
                }}
              >
                {PROPERTY_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: "var(--color-text-dim)" }}>Guide Price (£)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--color-text-dim)" }}>£</span>
                <input
                  type="number"
                  value={inputs.guidePrice}
                  onChange={(e) => set("guidePrice", e.target.value)}
                  className="w-full rounded pl-7 pr-3 py-2 text-sm outline-none"
                  style={{
                    backgroundColor: "var(--color-surface-2)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text)",
                    fontSize: "16px",
                    minHeight: "44px",
                  }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: "var(--color-text-dim)" }}>Bedrooms</label>
              <select
                value={inputs.bedrooms}
                onChange={(e) => set("bedrooms", e.target.value)}
                className="w-full rounded px-3 py-2 text-sm outline-none"
                style={{
                  backgroundColor: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text)",
                  fontSize: "16px",
                  minHeight: "44px",
                }}
              >
                {BEDROOMS.map((b) => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: "var(--color-text-dim)" }}>Condition</label>
              <select
                value={inputs.condition}
                onChange={(e) => set("condition", e.target.value)}
                className="w-full rounded px-3 py-2 text-sm outline-none"
                style={{
                  backgroundColor: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text)",
                  fontSize: "16px",
                  minHeight: "44px",
                }}
              >
                {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: "var(--color-text-dim)" }}>Notes</label>
            <textarea
              value={inputs.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={2}
              className="w-full rounded px-3 py-2 text-sm outline-none resize-none"
              style={{
                backgroundColor: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text)",
              }}
              placeholder="Any additional context..."
            />
          </div>
        </div>

        {/* BMV Calculator */}
        <div
          className="rounded-lg p-5 space-y-3"
          style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
        >
          <p className="text-xs uppercase tracking-widest" style={{ color: "var(--color-text-dim)" }}>Quick BMV Calculator</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: "var(--color-text-dim)" }}>Guide Price (£)</label>
              <input
                type="number"
                value={inputs.guidePrice}
                onChange={(e) => set("guidePrice", e.target.value)}
                className="w-full rounded px-3 py-2 text-sm outline-none"
                style={{
                  backgroundColor: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text)",
                  fontSize: "16px",
                  minHeight: "44px",
                }}
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: "var(--color-text-dim)" }}>Market Value (£)</label>
              <input
                type="number"
                value={marketValue}
                onChange={(e) => setMarketValue(Number(e.target.value))}
                className="w-full rounded px-3 py-2 text-sm outline-none"
                style={{
                  backgroundColor: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text)",
                  fontSize: "16px",
                  minHeight: "44px",
                }}
              />
            </div>
          </div>
          <div
            className="rounded p-3 text-center text-sm font-semibold"
            style={{
              backgroundColor: isBelowMarket ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
              border: `1px solid ${isBelowMarket ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
              color: isBelowMarket ? "#22c55e" : "#ef4444",
            }}
          >
            {Math.abs(bmvDiff).toFixed(1)}% {isBelowMarket ? "Below Market Value" : "Above Market Value"}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-400 px-4 py-3 rounded"
            style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <AlertTriangle size={14} />
            {error}
          </div>
        )}

        <button
          onClick={handleAnalyse}
          disabled={loading}
          className="w-full py-3 rounded text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
          style={{ backgroundColor: "var(--color-gold)", color: "#080809" }}
        >
          {loading ? (
            <>
              <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
              Analysing…
            </>
          ) : (
            <>
              <Zap size={15} />
              Run Oracle Analysis
            </>
          )}
        </button>
      </div>

      {/* Right — Results */}
      <div>
        {!result && !loading && (
          <div
            className="rounded-lg h-full flex flex-col items-center justify-center text-center p-10"
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              minHeight: "400px",
            }}
          >
            <Zap size={48} style={{ color: "rgba(201,168,76,0.2)" }} />
            <h3 className="text-xl font-semibold mt-4 mb-2" style={{ color: "var(--color-text)" }}>
              Oracle Awaits
            </h3>
            <p className="text-sm max-w-xs" style={{ color: "var(--color-text-dim)" }}>
              Enter property details and run an analysis to receive an AI-powered deal score, yield estimate, risk assessment, and investment verdict.
            </p>
          </div>
        )}

        {loading && (
          <div
            className="rounded-lg h-full flex flex-col items-center justify-center text-center p-10"
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              minHeight: "400px",
            }}
          >
            <span className="animate-spin inline-block w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full mb-6" />
            <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
              Oracle is analysing…
            </p>
            <p className="text-xs mt-2 transition-opacity" style={{ color: "var(--color-text-dim)" }}>
              {LOADING_MESSAGES[loadingMsg]}
            </p>
          </div>
        )}

        {result && (
          <div
            className="rounded-lg p-5 space-y-5"
            style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
          >
            {demoMode && (
              <div
                className="flex items-center gap-2 text-xs px-3 py-2 rounded"
                style={{
                  backgroundColor: "rgba(96,165,250,0.1)",
                  border: "1px solid rgba(96,165,250,0.2)",
                  color: "#60a5fa",
                }}
              >
                <AlertTriangle size={12} />
                Oracle running in demo mode — set OPENAI_API_KEY to enable live analysis
              </div>
            )}

            {/* Score */}
            <div className="flex justify-center pt-2">
              <ScoreCircle score={result.dealScore} label={result.scoreLabel} />
            </div>

            {/* ROI + Yield */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: "ROI Estimate", value: result.roiEstimate },
                { label: "Gross Yield", value: result.grossYieldEstimate },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="rounded p-3 text-center"
                  style={{ backgroundColor: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}
                >
                  <p className="text-xs" style={{ color: "var(--color-text-dim)" }}>{label}</p>
                  <p className="text-lg font-bold mt-1" style={{ color: "var(--color-gold)" }}>{value}</p>
                </div>
              ))}
            </div>

            {/* Metrics grid */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "ARV", value: `£${result.arv.toLocaleString("en-GB")}` },
                { label: "Rental Est.", value: result.rentalEstimate },
                { label: "Risk Level", value: result.riskLevel },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="rounded p-3"
                  style={{ backgroundColor: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}
                >
                  <p className="text-xs" style={{ color: "var(--color-text-dim)" }}>{label}</p>
                  <p className="text-sm font-semibold mt-1" style={{ color: "var(--color-text)" }}>{value}</p>
                </div>
              ))}
            </div>

            {/* Risks */}
            <div>
              <p className="text-xs uppercase tracking-wider mb-2" style={{ color: "var(--color-text-dim)" }}>Key Risks</p>
              <ul className="space-y-1.5">
                {result.keyRisks.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--color-text)" }}>
                    <span className="mt-1.5 rounded-full shrink-0" style={{ width: "6px", height: "6px", backgroundColor: "#ef4444" }} />
                    {r}
                  </li>
                ))}
              </ul>
            </div>

            {/* Opportunities */}
            <div>
              <p className="text-xs uppercase tracking-wider mb-2" style={{ color: "var(--color-text-dim)" }}>Opportunities</p>
              <ul className="space-y-1.5">
                {result.opportunities.map((o, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--color-text)" }}>
                    <span className="mt-1.5 rounded-full shrink-0" style={{ width: "6px", height: "6px", backgroundColor: "#22c55e" }} />
                    {o}
                  </li>
                ))}
              </ul>
            </div>

            {/* Verdict */}
            <div
              className="rounded p-4 text-sm leading-relaxed"
              style={{
                backgroundColor: "rgba(201,168,76,0.06)",
                borderLeft: "3px solid var(--color-gold)",
                color: "var(--color-text)",
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-gold)" }}>
                Investment Verdict
              </p>
              {result.verdict}
            </div>

            {/* Comparables */}
            <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-dim)" }}>
              {result.comparables}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
