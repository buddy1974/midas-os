"use client";

import { useState, useEffect, useCallback } from "react";

interface PrivateLender {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  lenderType: string | null;
  maxLoanPence: number | null;
  minLoanPence: number | null;
  maxLtv: number | null;
  monthlyRate: string | null;
  chargeTypes: string | null;
  specialisms: string | null;
  status: string | null;
  notes: string | null;
  totalDeals: number | null;
  lastDealDate: string | null;
  dealCount: number;
  createdAt: string;
}

interface MatchedLender extends PrivateLender {
  matchScore: number;
}

interface MatchResult {
  requiredLtv: number;
  lenders: MatchedLender[];
}

interface Deal {
  id: string;
  lenderId: string;
  borrowerName: string | null;
  borrowerEmail: string | null;
  loanAmountPence: number;
  propertyValuePence: number | null;
  ltv: string | null;
  monthlyRate: string | null;
  termMonths: number | null;
  chargeType: string | null;
  status: string | null;
  notes: string | null;
  createdAt: string;
}

function fmtPence(p: number): string {
  const pounds = p / 100;
  if (pounds >= 1_000_000) return `£${(pounds / 1_000_000).toFixed(2)}m`;
  if (pounds >= 1_000) return `£${(pounds / 1_000).toFixed(0)}k`;
  return `£${pounds.toLocaleString()}`;
}

function scoreColor(score: number): string {
  if (score >= 75) return "#22c55e";
  if (score >= 50) return "#f59e0b";
  return "#ef4444";
}

function statusBadgeColor(status: string | null): string {
  switch (status) {
    case "active": return "#22c55e";
    case "paused": return "#f59e0b";
    case "inactive": return "#ef4444";
    default: return "#888";
  }
}

function dealStatusColor(status: string | null): string {
  switch (status) {
    case "enquiry": return "#888";
    case "terms_issued": return "#3b82f6";
    case "in_progress": return "#f59e0b";
    case "completed": return "#22c55e";
    case "declined":
    case "withdrawn": return "#ef4444";
    default: return "#888";
  }
}

const SPECIALISM_OPTIONS = [
  { value: "auction", label: "Auction Purchase" },
  { value: "bridging", label: "Bridging" },
  { value: "refurb", label: "Refurb" },
  { value: "hmo", label: "HMO" },
  { value: "short_lease", label: "Short Lease" },
  { value: "development", label: "Development" },
  { value: "commercial", label: "Commercial" },
];

function LenderModal({
  editLender,
  onClose,
  onSaved,
}: {
  editLender: PrivateLender | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    lender_type: "individual",
    max_loan_pence: "",
    min_loan_pence: "",
    max_ltv: "",
    monthly_rate: "",
    charge_types: "1st",
    specialisms: "",
    status: "active",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editLender) {
      setForm({
        name: editLender.name ?? "",
        email: editLender.email ?? "",
        phone: editLender.phone ?? "",
        company: editLender.company ?? "",
        lender_type: editLender.lenderType ?? "individual",
        max_loan_pence: editLender.maxLoanPence ? String(editLender.maxLoanPence / 100) : "",
        min_loan_pence: editLender.minLoanPence ? String(editLender.minLoanPence / 100) : "",
        max_ltv: editLender.maxLtv ? String(editLender.maxLtv) : "",
        monthly_rate: editLender.monthlyRate ?? "",
        charge_types: editLender.chargeTypes ?? "1st",
        specialisms: editLender.specialisms ?? "",
        status: editLender.status ?? "active",
        notes: editLender.notes ?? "",
      });
    } else {
      setForm({
        name: "",
        email: "",
        phone: "",
        company: "",
        lender_type: "individual",
        max_loan_pence: "",
        min_loan_pence: "",
        max_ltv: "",
        monthly_rate: "",
        charge_types: "1st",
        specialisms: "",
        status: "active",
        notes: "",
      });
    }
  }, [editLender]);

  const selectedSpecialisms = form.specialisms
    ? form.specialisms.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  function toggleSpecialism(value: string) {
    const current = new Set(selectedSpecialisms);
    if (current.has(value)) {
      current.delete(value);
    } else {
      current.add(value);
    }
    setForm((prev) => ({ ...prev, specialisms: Array.from(current).join(",") }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        email: form.email || null,
        phone: form.phone || null,
        company: form.company || null,
        lender_type: form.lender_type,
        max_loan_pence: form.max_loan_pence ? Math.round(parseFloat(form.max_loan_pence) * 100) : null,
        min_loan_pence: form.min_loan_pence ? Math.round(parseFloat(form.min_loan_pence) * 100) : null,
        max_ltv: form.max_ltv ? parseFloat(form.max_ltv) : null,
        monthly_rate: form.monthly_rate || null,
        charge_types: form.charge_types,
        specialisms: form.specialisms || null,
        status: form.status,
        notes: form.notes || null,
      };
      if (editLender) {
        await fetch(`/api/lenders/${editLender.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/lenders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      onSaved();
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    background: "var(--color-surface-2)",
    border: "1px solid var(--color-border)",
    color: "var(--color-text)",
    borderRadius: "6px",
    padding: "8px 10px",
    width: "100%",
    fontSize: "14px",
  };

  const labelStyle: React.CSSProperties = {
    color: "var(--color-text-dim)",
    fontSize: "12px",
    marginBottom: "4px",
    display: "block",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.7)" }}
    >
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl p-6"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold" style={{ color: "var(--color-gold)" }}>
            {editLender ? "Edit Lender" : "Add Lender"}
          </h2>
          <button
            onClick={onClose}
            className="text-xl leading-none"
            style={{ color: "var(--color-text-dim)" }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>Name *</label>
              <input
                style={inputStyle}
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Company</label>
              <input
                style={inputStyle}
                value={form.company}
                onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                style={inputStyle}
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              />
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input
                style={inputStyle}
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>Type</label>
              <select
                style={inputStyle}
                value={form.lender_type}
                onChange={(e) => setForm((p) => ({ ...p, lender_type: e.target.value }))}
              >
                <option value="individual">Individual</option>
                <option value="company">Company</option>
                <option value="fund">Fund</option>
                <option value="family_office">Family Office</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select
                style={inputStyle}
                value={form.status}
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>Max Loan (£)</label>
              <input
                type="number"
                style={inputStyle}
                value={form.max_loan_pence}
                onChange={(e) => setForm((p) => ({ ...p, max_loan_pence: e.target.value }))}
              />
            </div>
            <div>
              <label style={labelStyle}>Min Loan (£)</label>
              <input
                type="number"
                style={inputStyle}
                value={form.min_loan_pence}
                onChange={(e) => setForm((p) => ({ ...p, min_loan_pence: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label style={labelStyle}>Max LTV (%)</label>
              <input
                type="number"
                style={inputStyle}
                value={form.max_ltv}
                onChange={(e) => setForm((p) => ({ ...p, max_ltv: e.target.value }))}
              />
            </div>
            <div>
              <label style={labelStyle}>Monthly Rate (%)</label>
              <input
                type="number"
                step="0.01"
                style={inputStyle}
                value={form.monthly_rate}
                onChange={(e) => setForm((p) => ({ ...p, monthly_rate: e.target.value }))}
              />
            </div>
            <div>
              <label style={labelStyle}>Charge Types</label>
              <select
                style={inputStyle}
                value={form.charge_types}
                onChange={(e) => setForm((p) => ({ ...p, charge_types: e.target.value }))}
              >
                <option value="1st">1st</option>
                <option value="2nd">2nd</option>
                <option value="1st and 2nd">1st and 2nd</option>
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Specialisms</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {SPECIALISM_OPTIONS.map((opt) => {
                const selected = selectedSpecialisms.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleSpecialism(opt.value)}
                    className="text-xs px-3 py-1 rounded-full border transition-colors"
                    style={{
                      background: selected ? "var(--color-gold)" : "transparent",
                      borderColor: selected ? "var(--color-gold)" : "var(--color-border)",
                      color: selected ? "#000" : "var(--color-text-dim)",
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Notes</label>
            <textarea
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm"
              style={{ background: "var(--color-surface-2)", color: "var(--color-text-dim)" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg text-sm font-semibold"
              style={{ background: "var(--color-gold)", color: "#000" }}
            >
              {saving ? "Saving…" : editLender ? "Save Changes" : "Add Lender"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LendersPage() {
  const [lenders, setLenders] = useState<PrivateLender[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("active");
  const [filterCharge, setFilterCharge] = useState("");

  const [matchLoan, setMatchLoan] = useState("");
  const [matchValue, setMatchValue] = useState("");
  const [matchCharge, setMatchCharge] = useState("1st");
  const [matchPurpose, setMatchPurpose] = useState("auction");
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [matching, setMatching] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editLender, setEditLender] = useState<PrivateLender | null>(null);

  const [dealsLender, setDealsLender] = useState<PrivateLender | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [dealsLoading, setDealsLoading] = useState(false);

  const [showNewDealForm, setShowNewDealForm] = useState(false);
  const [newDeal, setNewDeal] = useState({
    borrower_name: "",
    borrower_email: "",
    loan_amount_pence: "",
    property_value_pence: "",
    monthly_rate: "",
    term_months: "",
    charge_type: "1st",
    notes: "",
  });
  const [savingDeal, setSavingDeal] = useState(false);

  const fetchLenders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set("status", filterStatus);
      if (filterType) params.set("lender_type", filterType);
      if (filterCharge) params.set("charge_type", filterCharge);
      const res = await fetch(`/api/lenders?${params}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json() as PrivateLender[];
      setLenders(data);
    } catch {
      setLenders([]);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterType, filterCharge]);

  useEffect(() => {
    fetchLenders();
  }, [fetchLenders]);

  async function handleMatch() {
    if (!matchLoan) return;
    setMatching(true);
    setMatchResult(null);
    try {
      const res = await fetch("/api/lenders/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loan_amount_pence: Math.round(parseFloat(matchLoan) * 100),
          property_value_pence: matchValue ? Math.round(parseFloat(matchValue) * 100) : undefined,
          charge_type: matchCharge,
          loan_purpose: matchPurpose,
        }),
      });
      const data = await res.json() as MatchResult;
      setMatchResult(data);
    } catch {
      /* ignore */
    } finally {
      setMatching(false);
    }
  }

  async function openDealsPanel(lender: PrivateLender) {
    setDealsLender(lender);
    setDealsLoading(true);
    try {
      const res = await fetch(`/api/lenders/${lender.id}/deals`);
      const data = await res.json() as Deal[];
      setDeals(data);
    } catch {
      setDeals([]);
    } finally {
      setDealsLoading(false);
    }
  }

  async function handleSaveDeal() {
    if (!dealsLender || !newDeal.loan_amount_pence) return;
    setSavingDeal(true);
    try {
      const res = await fetch(`/api/lenders/${dealsLender.id}/deals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          borrower_name: newDeal.borrower_name,
          borrower_email: newDeal.borrower_email,
          loan_amount_pence: Math.round(parseFloat(newDeal.loan_amount_pence) * 100),
          property_value_pence: newDeal.property_value_pence
            ? Math.round(parseFloat(newDeal.property_value_pence) * 100)
            : undefined,
          monthly_rate: newDeal.monthly_rate ? parseFloat(newDeal.monthly_rate) : undefined,
          term_months: newDeal.term_months ? parseInt(newDeal.term_months) : undefined,
          charge_type: newDeal.charge_type,
          notes: newDeal.notes,
        }),
      });
      const data = await res.json() as Deal;
      setDeals((prev) => [...prev, data]);
      setShowNewDealForm(false);
      setNewDeal({
        borrower_name: "",
        borrower_email: "",
        loan_amount_pence: "",
        property_value_pence: "",
        monthly_rate: "",
        term_months: "",
        charge_type: "1st",
        notes: "",
      });
    } catch {
      /* ignore */
    } finally {
      setSavingDeal(false);
    }
  }

  async function handleUpdateDealStatus(dealId: string, status: string) {
    try {
      await fetch(`/api/lenders/${dealsLender!.id}/deals`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deal_id: dealId, status }),
      });
      setDeals((prev) =>
        prev.map((d) => (d.id === dealId ? { ...d, status } : d))
      );
    } catch {
      /* ignore */
    }
  }

  const activeLenders = lenders.filter((l) => l.status === "active");
  const totalCapital = lenders.reduce((s, l) => s + (l.maxLoanPence ?? 0), 0);
  const _dealsInProgress = 0; // placeholder — reserved for future pipeline integration
  const ratedLenders = lenders.filter((l) => l.monthlyRate);
  const avgRate =
    ratedLenders.length > 0
      ? (
          ratedLenders.reduce((s, l) => s + parseFloat(l.monthlyRate ?? "0"), 0) /
          ratedLenders.length
        ).toFixed(2)
      : "0";

  const filteredLenders = lenders.filter((l) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      l.name.toLowerCase().includes(q) ||
      (l.company ?? "").toLowerCase().includes(q) ||
      (l.specialisms ?? "").toLowerCase().includes(q)
    );
  });

  const inputStyle: React.CSSProperties = {
    background: "var(--color-surface-2)",
    border: "1px solid var(--color-border)",
    color: "var(--color-text)",
    borderRadius: "6px",
    padding: "8px 10px",
    fontSize: "14px",
  };

  const cardStyle: React.CSSProperties = {
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: "10px",
    padding: "16px",
  };

  return (
    <div className="min-h-screen p-6" style={{ background: "var(--background)" }}>
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Active Lenders", value: activeLenders.length.toString() },
          { label: "Total Capital", value: fmtPence(totalCapital) },
          { label: "Avg Monthly Rate", value: `${avgRate}%` },
          { label: "Total Lenders", value: lenders.length.toString() },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              background: "var(--color-surface)",
              borderLeft: "3px solid var(--color-gold)",
              border: "1px solid var(--color-border)",
              borderLeftWidth: "3px",
              borderRadius: "8px",
              padding: "16px",
            }}
          >
            <p className="text-xs mb-1" style={{ color: "var(--color-text-dim)" }}>
              {stat.label}
            </p>
            <p className="text-xl font-bold" style={{ color: "var(--color-gold)" }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Lender Matcher */}
      <div className="mb-6 rounded-lg p-5" style={cardStyle}>
        <div className="mb-4">
          <h2 className="text-base font-bold" style={{ color: "var(--color-gold)" }}>
            🎯 Find the Right Lender
          </h2>
          <p className="text-xs mt-1" style={{ color: "var(--color-text-dim)" }}>
            Enter deal details to match against your lender panel
          </p>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-4">
          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--color-text-dim)" }}>
              Loan Amount (£)
            </label>
            <input
              type="number"
              style={{ ...inputStyle, width: "100%" }}
              placeholder="e.g. 250000"
              value={matchLoan}
              onChange={(e) => setMatchLoan(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--color-text-dim)" }}>
              Property Value (£)
            </label>
            <input
              type="number"
              style={{ ...inputStyle, width: "100%" }}
              placeholder="e.g. 400000"
              value={matchValue}
              onChange={(e) => setMatchValue(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--color-text-dim)" }}>
              Charge Type
            </label>
            <select
              style={{ ...inputStyle, width: "100%" }}
              value={matchCharge}
              onChange={(e) => setMatchCharge(e.target.value)}
            >
              <option value="1st">1st</option>
              <option value="2nd">2nd</option>
              <option value="1st and 2nd">1st and 2nd</option>
            </select>
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--color-text-dim)" }}>
              Purpose
            </label>
            <select
              style={{ ...inputStyle, width: "100%" }}
              value={matchPurpose}
              onChange={(e) => setMatchPurpose(e.target.value)}
            >
              <option value="auction">Auction</option>
              <option value="bridging">Bridging</option>
              <option value="refurb">Refurb</option>
              <option value="hmo">HMO</option>
              <option value="development">Development</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleMatch}
          disabled={matching || !matchLoan}
          className="px-6 py-2 rounded-lg text-sm font-semibold"
          style={{ background: "var(--color-gold)", color: "#000" }}
        >
          {matching ? "Matching…" : "Match Lenders →"}
        </button>

        {matchResult && (
          <div className="mt-5">
            <p className="text-sm mb-3" style={{ color: "var(--color-text-dim)" }}>
              <span className="font-bold" style={{ color: "var(--color-text)" }}>
                {matchResult.lenders.length} lenders matched
              </span>{" "}
              · Required LTV: {matchResult.requiredLtv.toFixed(1)}%
            </p>
            <div className="grid grid-cols-3 gap-3">
              {matchResult.lenders.map((ml) => (
                <div
                  key={ml.id}
                  className="rounded-lg p-3"
                  style={{
                    background: "var(--color-surface-2)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <div className="flex items-start gap-3 mb-2">
                    <div
                      className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{
                        background: scoreColor(ml.matchScore) + "22",
                        color: scoreColor(ml.matchScore),
                        border: `2px solid ${scoreColor(ml.matchScore)}`,
                      }}
                    >
                      {ml.matchScore}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                        {ml.name}
                      </p>
                      {ml.company && (
                        <p className="text-xs" style={{ color: "var(--color-text-dim)" }}>
                          {ml.company}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3 text-xs mb-2" style={{ color: "var(--color-text-dim)" }}>
                    {ml.monthlyRate && (
                      <span style={{ color: "var(--color-gold)" }}>{ml.monthlyRate}%/mo</span>
                    )}
                    {ml.maxLtv && <span>Max LTV: {ml.maxLtv}%</span>}
                  </div>
                  {ml.specialisms && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {ml.specialisms.split(",").map((s) => (
                        <span
                          key={s}
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            background: "var(--color-surface)",
                            color: "var(--color-text-dim)",
                          }}
                        >
                          {s.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    {ml.phone && (
                      <a
                        href={`tel:${ml.phone}`}
                        className="text-xs px-2 py-1 rounded"
                        style={{ background: "var(--color-surface)", color: "var(--color-text)" }}
                      >
                        📞 Contact
                      </a>
                    )}
                    <button
                      onClick={() => openDealsPanel(ml)}
                      className="text-xs px-2 py-1 rounded"
                      style={{ background: "var(--color-gold)", color: "#000" }}
                    >
                      💼 Create Deal
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lender Directory header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold" style={{ color: "var(--color-text)" }}>
          Lender Directory
        </h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: "var(--color-gold)", color: "#000" }}
        >
          + Add Lender
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <input
          style={{ ...inputStyle, minWidth: "200px" }}
          placeholder="Search name, company, specialism…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          style={inputStyle}
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">All Types</option>
          <option value="individual">Individual</option>
          <option value="company">Company</option>
          <option value="fund">Fund</option>
          <option value="family_office">Family Office</option>
        </select>
        <select
          style={inputStyle}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="inactive">Inactive</option>
        </select>
        <select
          style={inputStyle}
          value={filterCharge}
          onChange={(e) => setFilterCharge(e.target.value)}
        >
          <option value="">All Charges</option>
          <option value="1st">1st</option>
          <option value="2nd">2nd</option>
          <option value="1st and 2nd">1st and 2nd</option>
        </select>
      </div>

      {/* Lender grid */}
      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg p-4 animate-pulse"
              style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", height: "180px" }}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filteredLenders.map((lender) => (
            <div key={lender.id} style={cardStyle}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>
                    {lender.name}
                  </p>
                  {lender.company && (
                    <p className="text-xs" style={{ color: "var(--color-text-dim)" }}>
                      {lender.company}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <span
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ background: statusBadgeColor(lender.status) }}
                  />
                  <span className="text-xs capitalize" style={{ color: "var(--color-text-dim)" }}>
                    {lender.status ?? "unknown"}
                  </span>
                </div>
              </div>

              {lender.lenderType && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full mb-2 inline-block"
                  style={{
                    background: "var(--color-surface-2)",
                    color: "var(--color-text-dim)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  {lender.lenderType.replace("_", " ")}
                </span>
              )}

              <div className="flex gap-3 text-xs mb-2 flex-wrap">
                {lender.monthlyRate && (
                  <span style={{ color: "var(--color-gold)" }}>
                    {lender.monthlyRate}%/month
                  </span>
                )}
                {lender.maxLtv && (
                  <span style={{ color: "var(--color-text-dim)" }}>
                    Max LTV: {lender.maxLtv}%
                  </span>
                )}
              </div>

              {(lender.minLoanPence || lender.maxLoanPence) && (
                <p className="text-xs mb-2" style={{ color: "var(--color-text-dim)" }}>
                  {lender.minLoanPence ? fmtPence(lender.minLoanPence) : "—"} –{" "}
                  {lender.maxLoanPence ? fmtPence(lender.maxLoanPence) : "—"}
                </p>
              )}

              {lender.specialisms && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {lender.specialisms.split(",").map((s) => (
                    <span
                      key={s}
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: "var(--color-surface-2)",
                        color: "var(--color-text-dim)",
                      }}
                    >
                      {s.trim()}
                    </span>
                  ))}
                </div>
              )}

              <p className="text-xs mb-3" style={{ color: "var(--color-text-dim)" }}>
                {lender.dealCount} deals
              </p>

              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setEditLender(lender)}
                  className="text-xs px-3 py-1 rounded"
                  style={{
                    background: "var(--color-surface-2)",
                    color: "var(--color-text-dim)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    openDealsPanel(lender);
                    setShowNewDealForm(true);
                  }}
                  className="text-xs px-3 py-1 rounded"
                  style={{
                    background: "var(--color-surface-2)",
                    color: "var(--color-text-dim)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  Add Deal
                </button>
                <button
                  onClick={() => openDealsPanel(lender)}
                  className="text-xs px-3 py-1 rounded"
                  style={{ background: "var(--color-gold)", color: "#000" }}
                >
                  View Deals
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editLender) && (
        <LenderModal
          editLender={editLender}
          onClose={() => {
            setShowAddModal(false);
            setEditLender(null);
          }}
          onSaved={() => {
            setShowAddModal(false);
            setEditLender(null);
            fetchLenders();
          }}
        />
      )}

      {/* Deals Panel */}
      {dealsLender && (
        <div
          className="overflow-y-auto"
          style={{
            position: "fixed",
            right: 0,
            top: 0,
            bottom: 0,
            width: "480px",
            zIndex: 50,
            background: "var(--color-surface)",
            borderLeft: "1px solid var(--color-border)",
          }}
        >
          <div
            className="flex items-center justify-between p-4 sticky top-0"
            style={{
              background: "var(--color-surface)",
              borderBottom: "1px solid var(--color-border)",
            }}
          >
            <div>
              <p className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>
                {dealsLender.name}
              </p>
              <p className="text-xs" style={{ color: "var(--color-text-dim)" }}>
                Deal History
              </p>
            </div>
            <button
              onClick={() => {
                setDealsLender(null);
                setDeals([]);
                setShowNewDealForm(false);
              }}
              className="text-xl leading-none"
              style={{ color: "var(--color-text-dim)" }}
            >
              ×
            </button>
          </div>

          <div className="p-4">
            {dealsLoading ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-lg animate-pulse"
                    style={{
                      background: "var(--color-surface-2)",
                      height: "80px",
                    }}
                  />
                ))}
              </div>
            ) : (
              <>
                {deals.length === 0 && !showNewDealForm && (
                  <p className="text-sm text-center py-6" style={{ color: "var(--color-text-dim)" }}>
                    No deals yet
                  </p>
                )}

                <div className="flex flex-col gap-3 mb-4">
                  {deals.map((deal) => (
                    <div
                      key={deal.id}
                      className="rounded-lg p-3"
                      style={{
                        background: "var(--color-surface-2)",
                        border: "1px solid var(--color-border)",
                      }}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
                          {deal.borrowerName ?? "Unknown Borrower"}
                        </p>
                        <select
                          value={deal.status ?? "enquiry"}
                          onChange={(e) => handleUpdateDealStatus(deal.id, e.target.value)}
                          className="text-xs rounded px-1 py-0.5"
                          style={{
                            background: dealStatusColor(deal.status) + "22",
                            color: dealStatusColor(deal.status),
                            border: `1px solid ${dealStatusColor(deal.status)}`,
                          }}
                        >
                          <option value="enquiry">Enquiry</option>
                          <option value="terms_issued">Terms Issued</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="declined">Declined</option>
                          <option value="withdrawn">Withdrawn</option>
                        </select>
                      </div>
                      <div className="flex gap-3 text-xs flex-wrap" style={{ color: "var(--color-text-dim)" }}>
                        <span style={{ color: "var(--color-gold)" }}>
                          {fmtPence(deal.loanAmountPence)}
                        </span>
                        {deal.ltv && <span>LTV: {deal.ltv}%</span>}
                        {deal.monthlyRate && <span>{deal.monthlyRate}%/mo</span>}
                        {deal.termMonths && <span>{deal.termMonths}mo</span>}
                        {deal.chargeType && <span>{deal.chargeType}</span>}
                      </div>
                      {deal.notes && (
                        <p className="text-xs mt-1" style={{ color: "var(--color-text-dim)" }}>
                          {deal.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {!showNewDealForm ? (
                  <button
                    onClick={() => setShowNewDealForm(true)}
                    className="w-full py-2 text-sm rounded-lg"
                    style={{
                      background: "var(--color-gold)",
                      color: "#000",
                      fontWeight: 600,
                    }}
                  >
                    + New Deal
                  </button>
                ) : (
                  <div
                    className="rounded-lg p-4"
                    style={{
                      background: "var(--color-surface-2)",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    <p className="text-sm font-semibold mb-3" style={{ color: "var(--color-text)" }}>
                      New Deal
                    </p>
                    <div className="flex flex-col gap-3">
                      {[
                        { label: "Borrower Name", key: "borrower_name", type: "text" },
                        { label: "Loan Amount (£)", key: "loan_amount_pence", type: "number" },
                        { label: "Property Value (£)", key: "property_value_pence", type: "number" },
                        { label: "Monthly Rate (%)", key: "monthly_rate", type: "number" },
                        { label: "Term (months)", key: "term_months", type: "number" },
                      ].map(({ label, key, type }) => (
                        <div key={key}>
                          <label className="block text-xs mb-1" style={{ color: "var(--color-text-dim)" }}>
                            {label}
                          </label>
                          <input
                            type={type}
                            style={{ ...inputStyle, width: "100%" }}
                            value={newDeal[key as keyof typeof newDeal]}
                            onChange={(e) =>
                              setNewDeal((p) => ({ ...p, [key]: e.target.value }))
                            }
                          />
                        </div>
                      ))}
                      <div>
                        <label className="block text-xs mb-1" style={{ color: "var(--color-text-dim)" }}>
                          Charge Type
                        </label>
                        <select
                          style={{ ...inputStyle, width: "100%" }}
                          value={newDeal.charge_type}
                          onChange={(e) => setNewDeal((p) => ({ ...p, charge_type: e.target.value }))}
                        >
                          <option value="1st">1st</option>
                          <option value="2nd">2nd</option>
                          <option value="1st and 2nd">1st and 2nd</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs mb-1" style={{ color: "var(--color-text-dim)" }}>
                          Notes
                        </label>
                        <textarea
                          rows={2}
                          style={{ ...inputStyle, width: "100%", resize: "vertical" }}
                          value={newDeal.notes}
                          onChange={(e) => setNewDeal((p) => ({ ...p, notes: e.target.value }))}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowNewDealForm(false)}
                          className="flex-1 py-2 text-sm rounded-lg"
                          style={{
                            background: "var(--color-surface)",
                            color: "var(--color-text-dim)",
                            border: "1px solid var(--color-border)",
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveDeal}
                          disabled={savingDeal || !newDeal.loan_amount_pence}
                          className="flex-1 py-2 text-sm font-semibold rounded-lg"
                          style={{ background: "var(--color-gold)", color: "#000" }}
                        >
                          {savingDeal ? "Saving…" : "Save Deal"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Suppress unused var warning */}
      {/* _dealsInProgress reserved */}
    </div>
  );
}
