"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface LoanApplication {
  id: string;
  loanType: string | null;
  loanPurpose: string | null;
  loanAmountPence: number;
  loanTermMonths: number;
  monthlyRate: string | null;
  repaymentMethod: string | null;
  propertyAddress: string;
  propertyType: string | null;
  propertyStatus: string | null;
  propertyValuePence: number | null;
  purchasePricePence: number | null;
  chargeType: string | null;
  estimatedRentalPence: number | null;
  applicantType: string | null;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string | null;
  companyName: string | null;
  refusedMortgage: boolean | null;
  hasCcj: boolean | null;
  hasBankruptcy: boolean | null;
  missedPayments: boolean | null;
  hasArrears: boolean | null;
  aiScore: number | null;
  aiVerdict: string | null;
  aiRisk: string | null;
  aiSummary: string | null;
  ltv: string | null;
  status: string | null;
  notes: string | null;
  brokerName: string | null;
  brokerEmail: string | null;
  assignedTo: string | null;
  source: string | null;
  facilityLetterSent: boolean | null;
  createdAt: string | null;
  updatedAt: string | null;
  // Calculated
  ltvCalc?: number | null;
  monthlyInterest?: number;
  totalInterest?: number;
}

interface Repayment {
  id: string;
  applicationId: string;
  monthNumber: number;
  dueDate: string;
  amountPence: number;
  paid: boolean | null;
  paidDate: string | null;
}

interface Document {
  id: string;
  applicationId: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  uploadedBy: string | null;
  createdAt: string | null;
}

interface AppDetail {
  application: LoanApplication;
  repayments: Repayment[];
  documents: Document[];
}

type PipelineStatus =
  | "enquiry"
  | "documents_requested"
  | "under_assessment"
  | "terms_issued"
  | "legal_stage"
  | "active_loan"
  | "repaid"
  | "declined";

type DetailTab = "details" | "repayments" | "documents";

// ─── Constants ───────────────────────────────────────────────────────────────

const GOLD = "#C9A84C";
const SURFACE = "var(--color-surface)";
const BORDER = "var(--color-border)";
const TEXT = "var(--color-text)";
const TEXT_DIM = "var(--color-text-dim)";

const PIPELINE: { key: PipelineStatus; label: string }[] = [
  { key: "enquiry", label: "Enquiry" },
  { key: "documents_requested", label: "Docs Requested" },
  { key: "under_assessment", label: "Under Assessment" },
  { key: "terms_issued", label: "Terms Issued" },
  { key: "legal_stage", label: "Legal Stage" },
  { key: "active_loan", label: "Active Loan" },
  { key: "repaid", label: "Repaid" },
  { key: "declined", label: "Declined" },
];

function fmtPence(p: number): string {
  const pounds = p / 100;
  if (pounds >= 1_000_000) return `£${(pounds / 1_000_000).toFixed(2)}m`;
  if (pounds >= 1_000) return `£${(pounds / 1_000).toFixed(0)}k`;
  return `£${pounds.toLocaleString("en-GB")}`;
}

function scoreColor(score: number): string {
  if (score >= 70) return "#22c55e";
  if (score >= 50) return "#f59e0b";
  return "#ef4444";
}

function daysInStage(createdAt: string | null): number {
  if (!createdAt) return 0;
  const ms = Date.now() - new Date(createdAt).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function LoansPage() {
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AppDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [tab, setTab] = useState<DetailTab>("details");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [scoringId, setScoringId] = useState<string | null>(null);
  const [scoreDetails, setScoreDetails] = useState<Record<string, { concerns: string[]; positives: string[] }>>({});
  const [letterLoading, setLetterLoading] = useState(false);
  const [facilityLetter, setFacilityLetter] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState("");
  const [stageMoveValue, setStageMoveValue] = useState("");
  const [letterCopied, setLetterCopied] = useState(false);

  const fetchApplications = useCallback(async () => {
    try {
      const res = await fetch("/api/loans");
      const data = await res.json() as LoanApplication[];
      setApplications(Array.isArray(data) ? data : []);
    } catch {
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchApplications();
  }, [fetchApplications]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalEnquiries = applications.length;
  const activeLoans = applications.filter((a) => a.status === "active_loan");
  const capitalDeployed = activeLoans.reduce((s, a) => s + a.loanAmountPence, 0);
  const monthlyIncome = activeLoans.reduce(
    (s, a) => s + Math.round(a.loanAmountPence * (Number(a.monthlyRate ?? 0.85) / 100)),
    0
  );

  // ── Open detail panel ───────────────────────────────────────────────────────
  async function openDetail(app: LoanApplication) {
    setDetailLoading(true);
    setSelected(null);
    setTab("details");
    setFacilityLetter(null);
    setStageMoveValue(app.status ?? "enquiry");
    setNoteInput(app.notes ?? "");
    try {
      const res = await fetch(`/api/loans/${app.id}`);
      const data = await res.json() as AppDetail;
      setSelected(data);
    } catch {
      setSelected({ application: app, repayments: [], documents: [] });
    } finally {
      setDetailLoading(false);
    }
  }

  // ── Move stage ─────────────────────────────────────────────────────────────
  async function handleStatusChange(appId: string, newStatus: string) {
    await fetch(`/api/loans/${appId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setApplications((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
    );
    if (selected?.application.id === appId) {
      setSelected((prev) =>
        prev ? { ...prev, application: { ...prev.application, status: newStatus } } : prev
      );
    }
  }

  // ── Save note ──────────────────────────────────────────────────────────────
  async function saveNote() {
    if (!selected) return;
    await fetch(`/api/loans/${selected.application.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: noteInput }),
    });
    setSelected((prev) =>
      prev ? { ...prev, application: { ...prev.application, notes: noteInput } } : prev
    );
  }

  // ── AI Score ───────────────────────────────────────────────────────────────
  async function handleScore(appId: string) {
    setScoringId(appId);
    try {
      const res = await fetch(`/api/loans/${appId}/score`, { method: "POST" });
      const data = await res.json() as {
        application: LoanApplication;
        scoreDetails: { concerns: string[]; positives: string[] };
      };
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, ...data.application } : a))
      );
      if (selected?.application.id === appId) {
        setSelected((prev) =>
          prev ? { ...prev, application: { ...prev.application, ...data.application } } : prev
        );
      }
      if (data.scoreDetails) {
        setScoreDetails((prev) => ({ ...prev, [appId]: data.scoreDetails }));
      }
    } finally {
      setScoringId(null);
    }
  }

  // ── Facility letter ────────────────────────────────────────────────────────
  async function handleGenerateLetter() {
    if (!selected) return;
    setLetterLoading(true);
    setFacilityLetter(null);
    try {
      const res = await fetch(`/api/loans/${selected.application.id}/facility-letter`, {
        method: "POST",
      });
      const data = await res.json() as { letter: string };
      setFacilityLetter(data.letter ?? null);
    } finally {
      setLetterLoading(false);
    }
  }

  // ── Mark repayment paid ────────────────────────────────────────────────────
  async function toggleRepaymentPaid(repaymentId: string, currentPaid: boolean) {
    const res = await fetch(`/api/loans/repayments/${repaymentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paid: !currentPaid }),
    });
    const updated = await res.json() as Repayment;
    if (selected) {
      setSelected((prev) =>
        prev
          ? {
              ...prev,
              repayments: prev.repayments.map((r) =>
                r.id === repaymentId ? { ...r, ...updated } : r
              ),
            }
          : prev
      );
    }
  }

  // ── Drag & drop ────────────────────────────────────────────────────────────
  function onDragStart(appId: string) {
    setDraggingId(appId);
  }

  function onDrop(e: React.DragEvent, newStatus: PipelineStatus) {
    e.preventDefault();
    if (draggingId) {
      void handleStatusChange(draggingId, newStatus);
      setDraggingId(null);
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  const cardStyle: React.CSSProperties = {
    backgroundColor: SURFACE,
    border: `1px solid ${BORDER}`,
    borderRadius: "8px",
    padding: "12px",
    marginBottom: "8px",
    cursor: "pointer",
    transition: "border-color 0.15s",
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Page header */}
      <div className="px-6 pt-6 pb-4 shrink-0">
        <h1 className="text-xl font-semibold" style={{ color: TEXT }}>
          Loan Pipeline
        </h1>
        <p className="text-sm mt-0.5" style={{ color: TEXT_DIM }}>
          Private Bridging — Applications & Active Loans
        </p>
      </div>

      {/* Stats row */}
      <div className="px-6 pb-4 shrink-0">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Total Enquiries", value: String(totalEnquiries) },
            { label: "Active Loans", value: String(activeLoans.length) },
            { label: "Capital Deployed", value: fmtPence(capitalDeployed) },
            { label: "Monthly Income", value: fmtPence(monthlyIncome) },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg p-4"
              style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}
            >
              <p className="text-xs" style={{ color: TEXT_DIM }}>{stat.label}</p>
              <p className="text-xl font-semibold mt-1" style={{ color: GOLD }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Kanban + Detail panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Kanban board */}
        <div
          className="flex-1 overflow-x-auto overflow-y-hidden px-6 pb-6"
          style={{ minWidth: 0 }}
        >
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p style={{ color: TEXT_DIM }}>Loading…</p>
            </div>
          ) : (
            <div className="flex gap-3 h-full" style={{ minWidth: "max-content" }}>
              {PIPELINE.map((col) => {
                const colApps = applications.filter((a) => a.status === col.key);
                return (
                  <div
                    key={col.key}
                    className="flex flex-col rounded-lg shrink-0 overflow-hidden"
                    style={{
                      width: "220px",
                      backgroundColor: "rgba(255,255,255,0.02)",
                      border: `1px solid ${BORDER}`,
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => onDrop(e, col.key)}
                  >
                    {/* Column header */}
                    <div
                      className="px-3 py-2.5 shrink-0"
                      style={{ borderBottom: `1px solid ${BORDER}` }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold" style={{ color: TEXT_DIM }}>
                          {col.label}
                        </span>
                        <span
                          className="text-xs px-1.5 py-0.5 rounded-full"
                          style={{
                            backgroundColor: "rgba(201,168,76,0.12)",
                            color: GOLD,
                          }}
                        >
                          {colApps.length}
                        </span>
                      </div>
                    </div>

                    {/* Cards */}
                    <div className="flex-1 overflow-y-auto p-2">
                      {colApps.map((app) => (
                        <div
                          key={app.id}
                          draggable
                          onDragStart={() => onDragStart(app.id)}
                          onClick={() => void openDetail(app)}
                          style={{
                            ...cardStyle,
                            opacity: draggingId === app.id ? 0.5 : 1,
                          }}
                        >
                          <p
                            className="text-sm font-semibold truncate"
                            style={{ color: TEXT }}
                          >
                            {app.applicantName}
                          </p>
                          <p
                            className="text-xs truncate mt-0.5"
                            style={{ color: TEXT_DIM }}
                          >
                            {app.propertyAddress}
                          </p>
                          <p
                            className="text-sm font-bold mt-2"
                            style={{ color: GOLD }}
                          >
                            {fmtPence(app.loanAmountPence)}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {/* LTV badge */}
                            {app.ltv && (
                              <span
                                className="text-xs px-1.5 py-0.5 rounded"
                                style={{
                                  backgroundColor: "rgba(59,130,246,0.15)",
                                  color: "#60a5fa",
                                }}
                              >
                                {Number(app.ltv).toFixed(1)}% LTV
                              </span>
                            )}
                            {/* AI score badge */}
                            {app.aiScore !== null ? (
                              <span
                                className="text-xs px-1.5 py-0.5 rounded font-semibold"
                                style={{
                                  backgroundColor: `${scoreColor(app.aiScore)}22`,
                                  color: scoreColor(app.aiScore),
                                }}
                              >
                                {app.aiScore}
                              </span>
                            ) : (
                              <span
                                className="text-xs px-1.5 py-0.5 rounded"
                                style={{
                                  backgroundColor: "rgba(255,255,255,0.05)",
                                  color: TEXT_DIM,
                                }}
                              >
                                Unscored
                              </span>
                            )}
                            {/* Source badge */}
                            <span
                              className="text-xs px-1.5 py-0.5 rounded capitalize"
                              style={{
                                backgroundColor: "rgba(255,255,255,0.04)",
                                color: TEXT_DIM,
                              }}
                            >
                              {app.source ?? "website"}
                            </span>
                          </div>
                          <p
                            className="text-xs mt-2"
                            style={{ color: TEXT_DIM }}
                          >
                            {daysInStage(app.createdAt)}d in stage
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {(selected || detailLoading) && (
          <div
            className="shrink-0 overflow-y-auto flex flex-col"
            style={{
              width: "380px",
              backgroundColor: SURFACE,
              borderLeft: `1px solid ${BORDER}`,
            }}
          >
            {detailLoading ? (
              <div className="flex items-center justify-center flex-1">
                <p style={{ color: TEXT_DIM }}>Loading…</p>
              </div>
            ) : selected ? (
              <>
                {/* Panel header */}
                <div
                  className="px-5 py-4 shrink-0"
                  style={{ borderBottom: `1px solid ${BORDER}` }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold" style={{ color: TEXT }}>
                        {selected.application.applicantName}
                      </p>
                      <span
                        className="text-xs px-2 py-0.5 rounded capitalize"
                        style={{
                          backgroundColor: "rgba(201,168,76,0.12)",
                          color: GOLD,
                        }}
                      >
                        {selected.application.applicantType ?? "personal"}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelected(null)}
                      style={{ color: TEXT_DIM, fontSize: "20px", lineHeight: 1 }}
                    >
                      ×
                    </button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex shrink-0" style={{ borderBottom: `1px solid ${BORDER}` }}>
                  {(["details", "repayments", "documents"] as DetailTab[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className="flex-1 py-2.5 text-xs font-medium capitalize transition-colors"
                      style={{
                        color: tab === t ? GOLD : TEXT_DIM,
                        borderBottom: tab === t ? `2px solid ${GOLD}` : "2px solid transparent",
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <div className="flex-1 px-5 py-4 space-y-4">
                  {/* ── DETAILS TAB ─────────────────────────────────── */}
                  {tab === "details" && (
                    <>
                      {/* Property + loan info */}
                      <div className="space-y-2">
                        <InfoRow label="Property" value={selected.application.propertyAddress} />
                        <InfoRow label="Type" value={selected.application.propertyType ?? "—"} />
                        <InfoRow
                          label="Value"
                          value={selected.application.propertyValuePence ? fmtPence(selected.application.propertyValuePence) : "—"}
                        />
                        <InfoRow label="Charge" value={selected.application.chargeType ?? "first"} />
                        <InfoRow label="Loan" value={fmtPence(selected.application.loanAmountPence)} />
                        <InfoRow
                          label="Rate"
                          value={`${selected.application.monthlyRate ?? "0.85"}% pm`}
                        />
                        <InfoRow
                          label="Term"
                          value={`${selected.application.loanTermMonths} months`}
                        />
                        <InfoRow
                          label="LTV"
                          value={selected.application.ltv ? `${Number(selected.application.ltv).toFixed(1)}%` : "—"}
                        />
                        <InfoRow label="Source" value={selected.application.source ?? "website"} />
                        <InfoRow label="Email" value={selected.application.applicantEmail} />
                        {selected.application.applicantPhone && (
                          <InfoRow label="Phone" value={selected.application.applicantPhone} />
                        )}
                      </div>

                      {/* AI Score section */}
                      <div
                        className="rounded-lg p-4"
                        style={{ border: `1px solid ${BORDER}`, backgroundColor: "rgba(255,255,255,0.02)" }}
                      >
                        <p className="text-xs font-semibold mb-3" style={{ color: TEXT_DIM }}>
                          AI UNDERWRITING SCORE
                        </p>
                        {selected.application.aiScore !== null ? (
                          <div className="space-y-3">
                            <div className="flex items-center gap-4">
                              <div
                                className="flex items-center justify-center rounded-full text-2xl font-bold"
                                style={{
                                  width: "64px",
                                  height: "64px",
                                  backgroundColor: `${scoreColor(selected.application.aiScore)}22`,
                                  color: scoreColor(selected.application.aiScore),
                                  border: `2px solid ${scoreColor(selected.application.aiScore)}`,
                                }}
                              >
                                {selected.application.aiScore}
                              </div>
                              <div>
                                <p className="text-sm font-semibold" style={{ color: TEXT }}>
                                  {selected.application.aiVerdict ?? "—"}
                                </p>
                                <p
                                  className="text-xs"
                                  style={{
                                    color: scoreColor(selected.application.aiScore),
                                  }}
                                >
                                  {selected.application.aiRisk ?? "—"} Risk
                                </p>
                              </div>
                            </div>
                            {selected.application.aiSummary && (
                              <p className="text-xs leading-relaxed" style={{ color: TEXT_DIM }}>
                                {selected.application.aiSummary}
                              </p>
                            )}
                            {scoreDetails[selected.application.id] && (
                              <div className="space-y-2">
                                {scoreDetails[selected.application.id].concerns.length > 0 && (
                                  <div>
                                    <p className="text-xs font-medium mb-1" style={{ color: "#ef4444" }}>Concerns</p>
                                    {scoreDetails[selected.application.id].concerns.map((c, i) => (
                                      <p key={i} className="text-xs" style={{ color: TEXT_DIM }}>
                                        🔴 {c}
                                      </p>
                                    ))}
                                  </div>
                                )}
                                {scoreDetails[selected.application.id].positives.length > 0 && (
                                  <div>
                                    <p className="text-xs font-medium mb-1" style={{ color: "#22c55e" }}>Positives</p>
                                    {scoreDetails[selected.application.id].positives.map((p, i) => (
                                      <p key={i} className="text-xs" style={{ color: TEXT_DIM }}>
                                        🟢 {p}
                                      </p>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                            <button
                              onClick={() => void handleScore(selected.application.id)}
                              disabled={scoringId === selected.application.id}
                              className="text-xs px-3 py-1.5 rounded transition-opacity hover:opacity-80 disabled:opacity-50"
                              style={{ border: `1px solid ${BORDER}`, color: TEXT_DIM }}
                            >
                              {scoringId === selected.application.id ? "Re-scoring…" : "Re-score"}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => void handleScore(selected.application.id)}
                            disabled={scoringId === selected.application.id}
                            className="w-full py-2.5 rounded-md text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                            style={{ backgroundColor: GOLD, color: "#0F0F13" }}
                          >
                            {scoringId === selected.application.id ? "Scoring…" : "Score This Deal"}
                          </button>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="space-y-3">
                        {/* Generate facility letter */}
                        <button
                          onClick={() => void handleGenerateLetter()}
                          disabled={letterLoading}
                          className="w-full py-2.5 rounded-md text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50"
                          style={{
                            backgroundColor: "rgba(201,168,76,0.12)",
                            color: GOLD,
                            border: `1px solid ${BORDER}`,
                          }}
                        >
                          {letterLoading ? "Generating…" : "📝 Generate Facility Letter"}
                        </button>

                        {facilityLetter && (
                          <div
                            className="rounded-lg p-3 space-y-2"
                            style={{
                              backgroundColor: "rgba(255,255,255,0.03)",
                              border: `1px solid ${BORDER}`,
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-medium" style={{ color: GOLD }}>
                                Facility Letter
                              </p>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(facilityLetter).then(() => {
                                    setLetterCopied(true);
                                    setTimeout(() => setLetterCopied(false), 2000);
                                  }).catch(() => {});
                                }}
                                className="text-xs px-2 py-1 rounded transition-opacity hover:opacity-80"
                                style={{ border: `1px solid ${BORDER}`, color: TEXT_DIM }}
                              >
                                {letterCopied ? "✓ Copied" : "Copy Letter"}
                              </button>
                            </div>
                            <pre
                              className="text-xs leading-relaxed overflow-y-auto whitespace-pre-wrap"
                              style={{
                                color: TEXT_DIM,
                                maxHeight: "240px",
                                fontFamily: "monospace",
                              }}
                            >
                              {facilityLetter}
                            </pre>
                            <a
                              href={`mailto:${selected.application.applicantEmail}?subject=Bridging Loan Facility Letter — Midas Property Auctions&body=${encodeURIComponent(facilityLetter)}`}
                              className="block text-center text-xs py-1.5 rounded transition-opacity hover:opacity-80"
                              style={{
                                backgroundColor: "rgba(59,130,246,0.12)",
                                color: "#60a5fa",
                                border: "1px solid rgba(59,130,246,0.2)",
                              }}
                            >
                              📧 Send to Applicant
                            </a>
                          </div>
                        )}

                        {/* Move stage */}
                        <div>
                          <label className="block text-xs mb-1" style={{ color: TEXT_DIM }}>
                            Move Stage
                          </label>
                          <div className="flex gap-2">
                            <select
                              value={stageMoveValue}
                              onChange={(e) => setStageMoveValue(e.target.value)}
                              className="flex-1 rounded-md text-sm"
                              style={{
                                backgroundColor: "rgba(255,255,255,0.04)",
                                border: `1px solid ${BORDER}`,
                                color: TEXT,
                                padding: "6px 8px",
                              }}
                            >
                              {PIPELINE.map((p) => (
                                <option
                                  key={p.key}
                                  value={p.key}
                                  style={{ backgroundColor: "var(--color-surface)" }}
                                >
                                  {p.label}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() =>
                                void handleStatusChange(selected.application.id, stageMoveValue)
                              }
                              className="px-3 py-1.5 rounded-md text-xs font-medium transition-all hover:opacity-90"
                              style={{ backgroundColor: GOLD, color: "#0F0F13" }}
                            >
                              Move
                            </button>
                          </div>
                        </div>

                        {/* Add note */}
                        <div>
                          <label className="block text-xs mb-1" style={{ color: TEXT_DIM }}>
                            Notes
                          </label>
                          <textarea
                            value={noteInput}
                            onChange={(e) => setNoteInput(e.target.value)}
                            rows={3}
                            className="w-full rounded-md text-sm resize-none"
                            style={{
                              backgroundColor: "rgba(255,255,255,0.04)",
                              border: `1px solid ${BORDER}`,
                              color: TEXT,
                              padding: "8px",
                            }}
                          />
                          <button
                            onClick={() => void saveNote()}
                            className="mt-1 text-xs px-3 py-1.5 rounded transition-opacity hover:opacity-80"
                            style={{ border: `1px solid ${BORDER}`, color: TEXT_DIM }}
                          >
                            Save Note
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {/* ── REPAYMENTS TAB ────────────────────────────────── */}
                  {tab === "repayments" && (
                    <div>
                      <p className="text-xs font-semibold mb-3" style={{ color: TEXT_DIM }}>
                        REPAYMENT SCHEDULE
                      </p>
                      {selected.repayments.length === 0 ? (
                        <p className="text-sm" style={{ color: TEXT_DIM }}>
                          No repayment schedule found.
                        </p>
                      ) : (
                        <>
                          <div className="space-y-2">
                            {selected.repayments
                              .slice()
                              .sort((a, b) => a.monthNumber - b.monthNumber)
                              .map((r) => (
                                <div
                                  key={r.id}
                                  className="flex items-center justify-between rounded-lg p-3"
                                  style={{
                                    backgroundColor: r.paid
                                      ? "rgba(34,197,94,0.06)"
                                      : "rgba(255,255,255,0.03)",
                                    border: `1px solid ${r.paid ? "rgba(34,197,94,0.2)" : BORDER}`,
                                  }}
                                >
                                  <div>
                                    <p className="text-xs font-medium" style={{ color: TEXT }}>
                                      Month {r.monthNumber}
                                    </p>
                                    <p className="text-xs" style={{ color: TEXT_DIM }}>
                                      {new Date(r.dueDate).toLocaleDateString("en-GB")}
                                    </p>
                                    <p className="text-xs font-semibold" style={{ color: GOLD }}>
                                      {fmtPence(r.amountPence)}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => void toggleRepaymentPaid(r.id, r.paid ?? false)}
                                    className="text-xs px-2 py-1.5 rounded transition-all hover:opacity-80"
                                    style={{
                                      backgroundColor: r.paid
                                        ? "rgba(34,197,94,0.15)"
                                        : "rgba(255,255,255,0.05)",
                                      color: r.paid ? "#22c55e" : TEXT_DIM,
                                      border: `1px solid ${r.paid ? "rgba(34,197,94,0.3)" : BORDER}`,
                                    }}
                                  >
                                    {r.paid ? "✓ Paid" : "Mark Paid"}
                                  </button>
                                </div>
                              ))}
                          </div>
                          <div
                            className="mt-4 rounded-lg p-3"
                            style={{ border: `1px solid ${BORDER}`, backgroundColor: "rgba(255,255,255,0.02)" }}
                          >
                            <div className="flex justify-between text-xs">
                              <span style={{ color: TEXT_DIM }}>Paid</span>
                              <span style={{ color: "#22c55e" }}>
                                {fmtPence(
                                  selected.repayments
                                    .filter((r) => r.paid)
                                    .reduce((s, r) => s + r.amountPence, 0)
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs mt-1">
                              <span style={{ color: TEXT_DIM }}>Outstanding</span>
                              <span style={{ color: "#f59e0b" }}>
                                {fmtPence(
                                  selected.repayments
                                    .filter((r) => !r.paid)
                                    .reduce((s, r) => s + r.amountPence, 0)
                                )}
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* ── DOCUMENTS TAB ────────────────────────────────── */}
                  {tab === "documents" && (
                    <div>
                      <p className="text-xs font-semibold mb-3" style={{ color: TEXT_DIM }}>
                        DOCUMENTS
                      </p>
                      {selected.documents.length === 0 ? (
                        <p className="text-sm" style={{ color: TEXT_DIM }}>
                          No documents uploaded.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {selected.documents.map((doc) => (
                            <div
                              key={doc.id}
                              className="flex items-center justify-between rounded-lg p-3"
                              style={{
                                backgroundColor: "rgba(255,255,255,0.02)",
                                border: `1px solid ${BORDER}`,
                              }}
                            >
                              <div>
                                <p className="text-xs font-medium capitalize" style={{ color: TEXT }}>
                                  {doc.documentType.replace(/_/g, " ")}
                                </p>
                                <p className="text-xs" style={{ color: TEXT_DIM }}>
                                  {doc.fileName}
                                </p>
                              </div>
                              <a
                                href={doc.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs px-2 py-1 rounded"
                                style={{
                                  backgroundColor: "rgba(201,168,76,0.12)",
                                  color: GOLD,
                                }}
                              >
                                Download
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-xs shrink-0" style={{ color: "var(--color-text-dim)" }}>
        {label}
      </span>
      <span className="text-xs text-right" style={{ color: "var(--color-text)" }}>
        {value}
      </span>
    </div>
  );
}
