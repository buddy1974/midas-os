"use client";

import { useState, useEffect, useCallback } from "react";

interface PortfolioProperty {
  id: string;
  portfolioId: string;
  address: string;
  propertyType: string | null;
  purchasePricePence: number | null;
  currentValuePence: number | null;
  outstandingMortgagePence: number | null;
  monthlyRentPence: number | null;
  monthlyMortgagePence: number | null;
  monthlyCostsPence: number | null;
  purchaseDate: string | null;
  bedrooms: number | null;
  notes: string | null;
  createdAt: string;
}

interface Portfolio {
  id: string;
  ownerName: string;
  ownerEmail: string | null;
  portfolioName: string | null;
  strategy: string | null;
  notes: string | null;
  createdAt: string;
  totalProperties: number;
  totalValue: number;
  totalDebt: number;
  totalEquity: number;
  grossYield: number;
  monthlyCashflow: number;
}

interface PortfolioDetail extends Portfolio {
  properties: PortfolioProperty[];
  metrics: {
    totalValue: number;
    totalDebt: number;
    totalEquity: number;
    grossYield: number;
    monthlyCashflow: number;
    ltv: number;
  };
}

interface AIReport {
  summary: string;
  strengths: string[];
  concerns: string[];
  recommendations: string[];
  verdict: string;
  refinanceOpportunity: boolean;
  refinanceNote: string;
}

function fmtPence(p: number): string {
  const pounds = p / 100;
  if (pounds >= 1_000_000) return `£${(pounds / 1_000_000).toFixed(2)}m`;
  if (pounds >= 1_000) return `£${(pounds / 1_000).toFixed(0)}k`;
  return `£${pounds.toLocaleString()}`;
}

function strategyBadgeColor(strategy: string | null): string {
  switch (strategy) {
    case "btl": return "#3b82f6";
    case "hmo": return "#c9a84c";
    case "flip": return "#22c55e";
    case "sa": return "#a855f7";
    case "mixed": return "#f97316";
    default: return "#888";
  }
}

function StrategyBadge({ strategy }: { strategy: string | null }) {
  return (
    <span
      className="text-xs font-semibold uppercase px-2 py-0.5 rounded-full"
      style={{ backgroundColor: strategyBadgeColor(strategy) + "33", color: strategyBadgeColor(strategy), border: `1px solid ${strategyBadgeColor(strategy)}55` }}
    >
      {strategy ?? "—"}
    </span>
  );
}

function SkeletonCard() {
  return (
    <div
      className="rounded-lg p-4 animate-pulse space-y-2"
      style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
    >
      <div className="h-4 w-2/3 rounded" style={{ backgroundColor: "var(--color-surface-2)" }} />
      <div className="h-3 w-1/2 rounded" style={{ backgroundColor: "var(--color-surface-2)" }} />
      <div className="h-3 w-full rounded" style={{ backgroundColor: "var(--color-surface-2)" }} />
    </div>
  );
}

function StatCard({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <div
      className="rounded-lg p-4"
      style={{
        backgroundColor: "var(--color-surface)",
        borderLeft: "3px solid var(--color-gold)",
        border: "1px solid var(--color-border)",
        borderLeftWidth: "3px",
        borderLeftColor: "var(--color-gold)",
      }}
    >
      <p className="text-xs mb-1" style={{ color: "var(--color-text-dim)" }}>{label}</p>
      <p
        className="text-xl font-bold"
        style={{ color: gold ? "var(--color-gold)" : "var(--color-text)" }}
      >
        {value}
      </p>
    </div>
  );
}

function MetricCard({ label, value, colored }: { label: string; value: string; colored?: "green" | "red" }) {
  const color = colored === "green" ? "#22c55e" : colored === "red" ? "#ef4444" : "var(--color-text)";
  return (
    <div
      className="rounded-lg p-3 text-center"
      style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
    >
      <p className="text-xs mb-1" style={{ color: "var(--color-text-dim)" }}>{label}</p>
      <p className="text-base font-bold" style={{ color }}>{value}</p>
    </div>
  );
}

function AddPropertyForm({
  portfolioId,
  onAdded,
  onCancel,
}: {
  portfolioId: string;
  onAdded: () => void;
  onCancel: () => void;
}) {
  const [address, setAddress] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [outstandingMortgage, setOutstandingMortgage] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [monthlyMortgage, setMonthlyMortgage] = useState("");
  const [monthlyCosts, setMonthlyCosts] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch(`/api/portfolios/${portfolioId}/properties`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          property_type: propertyType || null,
          bedrooms: bedrooms ? parseInt(bedrooms) : null,
          purchase_price: purchasePrice ? Math.round(parseFloat(purchasePrice) * 100) : null,
          current_value: currentValue ? Math.round(parseFloat(currentValue) * 100) : null,
          outstanding_mortgage: outstandingMortgage ? Math.round(parseFloat(outstandingMortgage) * 100) : null,
          monthly_rent: monthlyRent ? Math.round(parseFloat(monthlyRent) * 100) : null,
          monthly_mortgage: monthlyMortgage ? Math.round(parseFloat(monthlyMortgage) * 100) : null,
          monthly_costs: monthlyCosts ? Math.round(parseFloat(monthlyCosts) * 100) : null,
        }),
      });
      onAdded();
    } finally {
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    backgroundColor: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    color: "var(--color-text)",
    borderRadius: "0.375rem",
    padding: "0.5rem 0.75rem",
    width: "100%",
    fontSize: "0.875rem",
  };

  const labelStyle: React.CSSProperties = {
    color: "var(--color-text-dim)",
    fontSize: "0.75rem",
    marginBottom: "0.25rem",
    display: "block",
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg p-4 mt-4 space-y-4"
      style={{ backgroundColor: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}
    >
      <p className="text-sm font-semibold" style={{ color: "var(--color-gold)" }}>Add Property</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <label style={labelStyle}>Address *</label>
          <input
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            style={inputStyle}
            placeholder="123 Example Street, London"
          />
        </div>
        <div>
          <label style={labelStyle}>Property Type</label>
          <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} style={inputStyle}>
            <option value="">Select type</option>
            <option value="terraced">Terraced House</option>
            <option value="semi-detached">Semi-Detached</option>
            <option value="detached">Detached</option>
            <option value="flat">Flat</option>
            <option value="hmo">HMO</option>
            <option value="commercial">Commercial</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Bedrooms</label>
          <input
            type="number"
            min="0"
            value={bedrooms}
            onChange={(e) => setBedrooms(e.target.value)}
            style={inputStyle}
            placeholder="3"
          />
        </div>
        <div>
          <label style={labelStyle}>Purchase Price (£)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(e.target.value)}
            style={inputStyle}
            placeholder="250000"
          />
        </div>
        <div>
          <label style={labelStyle}>Current Value (£)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            style={inputStyle}
            placeholder="300000"
          />
        </div>
        <div>
          <label style={labelStyle}>Outstanding Mortgage (£)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={outstandingMortgage}
            onChange={(e) => setOutstandingMortgage(e.target.value)}
            style={inputStyle}
            placeholder="180000"
          />
        </div>
        <div>
          <label style={labelStyle}>Monthly Rent (£)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={monthlyRent}
            onChange={(e) => setMonthlyRent(e.target.value)}
            style={inputStyle}
            placeholder="1200"
          />
        </div>
        <div>
          <label style={labelStyle}>Monthly Mortgage (£)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={monthlyMortgage}
            onChange={(e) => setMonthlyMortgage(e.target.value)}
            style={inputStyle}
            placeholder="750"
          />
        </div>
        <div>
          <label style={labelStyle}>Monthly Costs (£)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={monthlyCosts}
            onChange={(e) => setMonthlyCosts(e.target.value)}
            style={inputStyle}
            placeholder="150"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 rounded-md text-sm font-semibold transition-opacity"
          style={{ backgroundColor: "var(--color-gold)", color: "#080809", opacity: saving ? 0.6 : 1 }}
        >
          {saving ? "Saving…" : "Save Property"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-md text-sm"
          style={{ backgroundColor: "var(--color-surface)", color: "var(--color-text-dim)", border: "1px solid var(--color-border)" }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function AddPortfolioModal({
  onCreated,
  onClose,
}: {
  onCreated: (id: string) => void;
  onClose: () => void;
}) {
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [portfolioName, setPortfolioName] = useState("");
  const [strategy, setStrategy] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/portfolios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner_name: ownerName,
          owner_email: ownerEmail || null,
          portfolio_name: portfolioName || null,
          strategy: strategy || null,
          notes: notes || null,
        }),
      });
      if (res.ok) {
        const data = await res.json() as { id: string };
        onCreated(data.id);
      }
    } finally {
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    backgroundColor: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    color: "var(--color-text)",
    borderRadius: "0.375rem",
    padding: "0.5rem 0.75rem",
    width: "100%",
    fontSize: "0.875rem",
  };

  const labelStyle: React.CSSProperties = {
    color: "var(--color-text-dim)",
    fontSize: "0.75rem",
    marginBottom: "0.25rem",
    display: "block",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-lg rounded-xl p-6 space-y-4"
        style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: "var(--color-gold)" }}>New Portfolio</h2>
          <button
            onClick={onClose}
            className="text-sm px-2 py-1 rounded"
            style={{ color: "var(--color-text-dim)" }}
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label style={labelStyle}>Owner Name *</label>
            <input
              required
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              style={inputStyle}
              placeholder="John Smith"
            />
          </div>
          <div>
            <label style={labelStyle}>Owner Email</label>
            <input
              type="email"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              style={inputStyle}
              placeholder="john@example.com"
            />
          </div>
          <div>
            <label style={labelStyle}>Portfolio Name</label>
            <input
              value={portfolioName}
              onChange={(e) => setPortfolioName(e.target.value)}
              style={inputStyle}
              placeholder="Northern BTL Portfolio"
            />
          </div>
          <div>
            <label style={labelStyle}>Strategy</label>
            <select value={strategy} onChange={(e) => setStrategy(e.target.value)} style={inputStyle}>
              <option value="">Select strategy</option>
              <option value="btl">BTL — Buy to Let</option>
              <option value="hmo">HMO</option>
              <option value="mixed">Mixed</option>
              <option value="flip">Flip</option>
              <option value="sa">SA — Serviced Accommodation</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
              placeholder="Any additional notes…"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 rounded-md text-sm font-semibold transition-opacity"
              style={{ backgroundColor: "var(--color-gold)", color: "#080809", opacity: saving ? 0.6 : 1 }}
            >
              {saving ? "Creating…" : "Create Portfolio"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md text-sm"
              style={{ backgroundColor: "var(--color-surface-2)", color: "var(--color-text-dim)", border: "1px solid var(--color-border)" }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PortfolioPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<PortfolioDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [report, setReport] = useState<AIReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [showAddPortfolio, setShowAddPortfolio] = useState(false);
  const [showAddProperty, setShowAddProperty] = useState(false);

  const fetchPortfolios = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/portfolios");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json() as Portfolio[];
      setPortfolios(data);
      if (!selectedId && data.length > 0) {
        setSelectedId(data[0].id);
      }
    } catch {
      setPortfolios([]);
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  async function fetchDetail(id: string) {
    setDetailLoading(true);
    setReport(null);
    try {
      const res = await fetch(`/api/portfolios/${id}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json() as PortfolioDetail;
      setDetail(data);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleGenerateReport() {
    if (!selectedId) return;
    setReportLoading(true);
    try {
      const res = await fetch(`/api/portfolios/${selectedId}/report`, { method: "POST" });
      const data = await res.json() as AIReport;
      setReport(data);
    } catch {
      /* ignore */
    } finally {
      setReportLoading(false);
    }
  }

  async function handleDeletePortfolio(id: string) {
    if (!confirm("Delete this portfolio and all properties?")) return;
    await fetch(`/api/portfolios/${id}`, { method: "DELETE" });
    setSelectedId(null);
    setDetail(null);
    await fetchPortfolios();
  }

  async function handleRemoveProperty(propId: string) {
    if (!selectedId || !confirm("Remove this property?")) return;
    await fetch(`/api/portfolios/${selectedId}/properties/${propId}`, { method: "DELETE" });
    await fetchDetail(selectedId);
  }

  useEffect(() => {
    fetchPortfolios();
  }, []);

  useEffect(() => {
    if (selectedId) {
      setShowAddProperty(false);
      fetchDetail(selectedId);
    }
  }, [selectedId]);

  const totalProperties = portfolios.reduce((s, p) => s + p.totalProperties, 0);
  const combinedValue = portfolios.reduce((s, p) => s + p.totalValue, 0);
  const combinedEquity = portfolios.reduce((s, p) => s + p.totalEquity, 0);

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: "var(--background)" }}>
      {showAddPortfolio && (
        <AddPortfolioModal
          onCreated={async (id) => {
            setShowAddPortfolio(false);
            await fetchPortfolios();
            setSelectedId(id);
          }}
          onClose={() => setShowAddPortfolio(false)}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
          Portfolio Tracker
        </h1>
        <button
          onClick={() => setShowAddPortfolio(true)}
          className="px-4 py-2 rounded-md text-sm font-semibold"
          style={{ backgroundColor: "var(--color-gold)", color: "#080809" }}
        >
          + New Portfolio
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Portfolios" value={String(portfolios.length)} />
        <StatCard label="Total Properties" value={String(totalProperties)} />
        <StatCard label="Combined Value" value={fmtPence(combinedValue)} />
        <StatCard label="Combined Equity" value={fmtPence(combinedEquity)} gold />
      </div>

      <div className="flex gap-6 items-start">
        <div className="w-full max-w-xs shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-dim)" }}>
              My Portfolios
            </h2>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-bold"
              style={{ backgroundColor: "var(--color-surface-2)", color: "var(--color-gold)" }}
            >
              {portfolios.length}
            </span>
          </div>

          <div className="space-y-2">
            {loading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : portfolios.length === 0 ? (
              <p className="text-sm py-4 text-center" style={{ color: "var(--color-text-dim)" }}>
                No portfolios yet.
              </p>
            ) : (
              portfolios.map((p) => {
                const isSelected = p.id === selectedId;
                const cfPositive = p.monthlyCashflow >= 0;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedId(p.id)}
                    className="w-full text-left rounded-lg p-4 transition-colors"
                    style={{
                      backgroundColor: isSelected ? "rgba(201,168,76,0.1)" : "var(--color-surface)",
                      border: isSelected ? "1px solid var(--color-gold)" : "1px solid var(--color-border)",
                    }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                          {p.ownerName}
                        </p>
                        {p.portfolioName && (
                          <p className="text-xs" style={{ color: "var(--color-text-dim)" }}>{p.portfolioName}</p>
                        )}
                      </div>
                      <StrategyBadge strategy={p.strategy} />
                    </div>
                    <p className="text-xs mt-2" style={{ color: "var(--color-text-dim)" }}>
                      <span>{p.totalProperties} props</span>
                      <span className="mx-1">|</span>
                      <span>{fmtPence(p.totalValue)}</span>
                      <span className="mx-1">|</span>
                      <span style={{ color: cfPositive ? "#22c55e" : "#ef4444" }}>
                        £{(p.monthlyCashflow / 100).toFixed(0)}/mo CF
                      </span>
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {detailLoading ? (
            <div className="space-y-3">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : !selectedId || !detail ? (
            <div
              className="rounded-xl flex items-center justify-center py-24"
              style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
            >
              <p className="text-sm" style={{ color: "var(--color-text-dim)" }}>
                Select a portfolio to view details
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-xl font-bold" style={{ color: "var(--color-text)" }}>
                    {detail.portfolioName ?? detail.ownerName}
                  </h2>
                  <p className="text-sm mt-0.5" style={{ color: "var(--color-text-dim)" }}>{detail.ownerName}</p>
                  <div className="mt-2">
                    <StrategyBadge strategy={detail.strategy} />
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={handleGenerateReport}
                    disabled={reportLoading}
                    className="px-4 py-2 rounded-md text-sm font-semibold transition-opacity"
                    style={{ backgroundColor: "var(--color-gold)", color: "#080809", opacity: reportLoading ? 0.7 : 1 }}
                  >
                    {reportLoading ? "Analysing…" : "🤖 Generate Report"}
                  </button>
                  <button
                    onClick={() => handleDeletePortfolio(detail.id)}
                    className="px-3 py-2 rounded-md text-sm font-semibold"
                    style={{ backgroundColor: "#ef444422", color: "#ef4444", border: "1px solid #ef444444" }}
                  >
                    🗑 Delete
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <MetricCard label="Properties" value={String(detail.metrics ? detail.totalProperties : 0)} />
                <MetricCard label="Total Value" value={fmtPence(detail.metrics.totalValue)} />
                <MetricCard label="Total Equity" value={fmtPence(detail.metrics.totalEquity)} />
                <MetricCard label="Gross Yield" value={`${detail.metrics.grossYield.toFixed(2)}%`} />
                <MetricCard
                  label="Monthly CF"
                  value={`£${(detail.metrics.monthlyCashflow / 100).toFixed(0)}`}
                  colored={detail.metrics.monthlyCashflow >= 0 ? "green" : "red"}
                />
              </div>

              {(report || reportLoading) && (
                <div
                  className="rounded-xl p-5"
                  style={{
                    backgroundColor: "var(--color-surface)",
                    borderLeft: "3px solid var(--color-gold)",
                    border: "1px solid var(--color-border)",
                    borderLeftWidth: "3px",
                    borderLeftColor: "var(--color-gold)",
                  }}
                >
                  <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--color-gold)" }}>
                    ARIA Portfolio Analysis
                  </p>

                  {reportLoading ? (
                    <div className="flex items-center gap-3 animate-pulse">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: "var(--color-gold)" }} />
                      <p className="text-sm" style={{ color: "var(--color-text-dim)" }}>
                        ARIA is analysing your portfolio…
                      </p>
                    </div>
                  ) : report ? (
                    <div className="space-y-4">
                      <p
                        className="text-base font-bold italic"
                        style={{ color: "var(--color-gold)" }}
                      >
                        {report.verdict}
                      </p>
                      <p className="text-sm" style={{ color: "var(--color-text)" }}>{report.summary}</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase mb-2" style={{ color: "#22c55e" }}>Strengths</p>
                          <ul className="space-y-1">
                            {report.strengths.map((s, i) => (
                              <li key={i} className="text-sm flex gap-2" style={{ color: "var(--color-text)" }}>
                                <span style={{ color: "#22c55e" }}>•</span>
                                {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase mb-2" style={{ color: "#ef4444" }}>Concerns</p>
                          <ul className="space-y-1">
                            {report.concerns.map((c, i) => (
                              <li key={i} className="text-sm flex gap-2" style={{ color: "var(--color-text)" }}>
                                <span style={{ color: "#ef4444" }}>•</span>
                                {c}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase mb-2" style={{ color: "var(--color-text-dim)" }}>
                          Recommendations
                        </p>
                        <ol className="space-y-1">
                          {report.recommendations.map((r, i) => (
                            <li key={i} className="text-sm flex gap-2" style={{ color: "var(--color-text)" }}>
                              <span className="font-bold shrink-0" style={{ color: "var(--color-gold)" }}>{i + 1}.</span>
                              {r}
                            </li>
                          ))}
                        </ol>
                      </div>

                      {report.refinanceOpportunity && (
                        <div
                          className="rounded-lg p-3"
                          style={{ backgroundColor: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)" }}
                        >
                          <p className="text-xs font-bold uppercase mb-1" style={{ color: "var(--color-gold)" }}>
                            Refinance Opportunity
                          </p>
                          <p className="text-sm" style={{ color: "var(--color-text)" }}>{report.refinanceNote}</p>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              )}

              <div
                className="rounded-xl overflow-hidden"
                style={{ border: "1px solid var(--color-border)" }}
              >
                <div
                  className="flex items-center justify-between px-4 py-3"
                  style={{ backgroundColor: "var(--color-surface-2)", borderBottom: "1px solid var(--color-border)" }}
                >
                  <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                    Properties ({detail.properties.length})
                  </p>
                  <button
                    onClick={() => setShowAddProperty((v) => !v)}
                    className="text-xs px-3 py-1.5 rounded-md font-semibold"
                    style={{ backgroundColor: "var(--color-gold)", color: "#080809" }}
                  >
                    {showAddProperty ? "✕ Cancel" : "+ Add Property"}
                  </button>
                </div>

                {detail.properties.length === 0 && !showAddProperty ? (
                  <div className="py-10 text-center" style={{ backgroundColor: "var(--color-surface)" }}>
                    <p className="text-sm" style={{ color: "var(--color-text-dim)" }}>No properties yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto" style={{ backgroundColor: "var(--color-surface)" }}>
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                          {["Address", "Type", "Value", "Rent/mo", "Mortgage/mo", "Net CF", "Yield", "Equity", ""].map((h) => (
                            <th
                              key={h}
                              className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                              style={{ color: "var(--color-text-dim)" }}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {detail.properties.map((prop) => {
                          const rent = prop.monthlyRentPence ?? 0;
                          const mortgage = prop.monthlyMortgagePence ?? 0;
                          const costs = prop.monthlyCostsPence ?? 0;
                          const netCf = rent - mortgage - costs;
                          const value = prop.currentValuePence ?? 0;
                          const debt = prop.outstandingMortgagePence ?? 0;
                          const equity = value - debt;
                          const yieldPct = value > 0 ? ((rent * 12) / value * 100).toFixed(1) : "—";

                          return (
                            <tr
                              key={prop.id}
                              style={{ borderBottom: "1px solid var(--color-border)" }}
                            >
                              <td className="px-4 py-3 font-medium whitespace-nowrap" style={{ color: "var(--color-text)" }}>
                                {prop.address}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap" style={{ color: "var(--color-text-dim)" }}>
                                {prop.propertyType ?? "—"}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap" style={{ color: "var(--color-text)" }}>
                                {value ? fmtPence(value) : "—"}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap" style={{ color: "var(--color-text)" }}>
                                {rent ? fmtPence(rent) : "—"}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap" style={{ color: "var(--color-text)" }}>
                                {mortgage ? fmtPence(mortgage) : "—"}
                              </td>
                              <td
                                className="px-4 py-3 font-semibold whitespace-nowrap"
                                style={{ color: netCf >= 0 ? "#22c55e" : "#ef4444" }}
                              >
                                £{(netCf / 100).toFixed(0)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap" style={{ color: "var(--color-text)" }}>
                                {yieldPct !== "—" ? `${yieldPct}%` : "—"}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap" style={{ color: "var(--color-gold)" }}>
                                {fmtPence(equity)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <button
                                  onClick={() => handleRemoveProperty(prop.id)}
                                  className="text-xs px-2 py-1 rounded"
                                  style={{ color: "#ef4444", backgroundColor: "#ef444411", border: "1px solid #ef444433" }}
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {showAddProperty && (
                  <div className="px-4 pb-4" style={{ backgroundColor: "var(--color-surface)" }}>
                    <AddPropertyForm
                      portfolioId={detail.id}
                      onAdded={async () => {
                        setShowAddProperty(false);
                        await fetchDetail(detail.id);
                      }}
                      onCancel={() => setShowAddProperty(false)}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
