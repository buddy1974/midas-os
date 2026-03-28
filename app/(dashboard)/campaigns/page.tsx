"use client";

import { useState, useEffect } from "react";
import { Zap, Monitor, Smartphone } from "lucide-react";
import type { Campaign } from "@/lib/schema";

type TemplateType =
  | "auction_alert"
  | "deal_spotlight"
  | "event_invite"
  | "legal_pack"
  | "registration_close"
  | "monthly_digest";

interface Template {
  id: TemplateType;
  emoji: string;
  label: string;
}

const TEMPLATES: Template[] = [
  { id: "auction_alert", emoji: "🔨", label: "Auction Alert" },
  { id: "deal_spotlight", emoji: "💰", label: "Deal Spotlight" },
  { id: "event_invite", emoji: "📅", label: "Event Invite" },
  { id: "legal_pack", emoji: "📋", label: "Legal Pack Ready" },
  { id: "registration_close", emoji: "⏰", label: "Registration Close" },
  { id: "monthly_digest", emoji: "📰", label: "Monthly Digest" },
];

const SEGMENTS = [
  { label: "All Subscribers (2,847)", value: "all", count: 2847 },
  { label: "VIP Investors (142)", value: "vip", count: 142 },
  { label: "BTL Investors (890)", value: "btl", count: 890 },
  { label: "HMO Investors (345)", value: "hmo", count: 345 },
  { label: "First-Time Buyers (620)", value: "ftb", count: 620 },
  { label: "Overseas Investors (189)", value: "overseas", count: 189 },
];

const SEND_TIMES = [
  "Send Now",
  "Tomorrow 9 AM",
  "Best Time (AI-Optimised)",
  "Custom Date/Time",
];

const PREVIEW_COPY: Record<TemplateType, string> = {
  auction_alert:
    "A new auction lot has just been listed on the Midas platform. This property matches your investment criteria and we believe it represents an exceptional opportunity in the current market.",
  deal_spotlight:
    "We have identified an exceptional deal that we wanted to share with you exclusively. This opportunity offers strong equity potential and aligns perfectly with current market conditions.",
  event_invite:
    "You're invited to our upcoming event. As a valued member of the Midas investor community, we'd love for you to join us for an exclusive evening of networking and property insights.",
  legal_pack:
    "The legal pack is now available for download. We encourage you to review the documentation carefully and consult with your solicitor before the auction date.",
  registration_close:
    "Final reminder — registration closes soon for our next auction. Secure your bidder registration now to avoid missing out on some outstanding lots.",
  monthly_digest:
    "Here's your monthly market digest from Midas Property Auctions. Inside you'll find the latest auction results, market analysis, and upcoming opportunities selected for your portfolio.",
};

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  draft: { bg: "rgba(148,163,184,0.15)", color: "#94a3b8" },
  sent: { bg: "rgba(34,197,94,0.15)", color: "#22c55e" },
  failed: { bg: "rgba(239,68,68,0.15)", color: "#ef4444" },
  scheduled: { bg: "rgba(96,165,250,0.15)", color: "#60a5fa" },
};

interface Toast {
  type: "success" | "error";
  message: string;
}

interface SubjectsResponse {
  suggestions: string[];
}

interface SendResponse {
  success?: boolean;
  messageId?: string;
  error?: string;
  demo?: boolean;
  message?: string;
}

function EmailPreview({
  subject,
  templateType,
  mobile,
}: {
  subject: string;
  templateType: TemplateType;
  mobile: boolean;
}) {
  const copy = PREVIEW_COPY[templateType];
  const displaySubject = subject || "Your subject line here…";

  return (
    <div
      style={{
        maxWidth: mobile ? "375px" : "100%",
        margin: "0 auto",
        fontFamily: "Arial, sans-serif",
        fontSize: "13px",
      }}
    >
      {/* Header */}
      <div style={{ background: "#080809", padding: "24px", textAlign: "center" }}>
        <p style={{ margin: 0, fontFamily: "Georgia, serif", fontSize: "22px", letterSpacing: "6px", color: "#C9A84C", textTransform: "uppercase" }}>
          MIDAS
        </p>
        <p style={{ margin: "4px 0 0", fontSize: "9px", letterSpacing: "3px", color: "rgba(201,168,76,0.6)", textTransform: "uppercase" }}>
          Property Auctions
        </p>
      </div>
      {/* Body */}
      <div style={{ background: "#ffffff", padding: "24px" }}>
        <h2 style={{ margin: "0 0 12px", fontSize: "17px", color: "#1a1a1a", lineHeight: 1.3 }}>
          {displaySubject}
        </h2>
        <p style={{ margin: "0 0 10px", fontSize: "13px", color: "#444", lineHeight: 1.5 }}>
          Dear [First Name],
        </p>
        <p style={{ margin: "0 0 18px", fontSize: "13px", color: "#444", lineHeight: 1.5 }}>
          {copy}
        </p>
        <div style={{ background: "#C9A84C", display: "inline-block", borderRadius: "3px", padding: "10px 22px" }}>
          <span style={{ fontSize: "12px", fontWeight: "bold", color: "#080809", letterSpacing: "0.5px" }}>
            View Details
          </span>
        </div>
      </div>
      {/* Footer */}
      <div style={{ background: "#f9f9f9", padding: "14px 24px", borderTop: "1px solid #eee" }}>
        <p style={{ margin: 0, fontSize: "10px", color: "#888" }}>
          Midas Property Group · Stanmore Business Centre, London HA7 1BT · +44 207 206 2691
        </p>
        <p style={{ margin: "3px 0 0", fontSize: "10px", color: "#aaa" }}>
          <span style={{ color: "#aaa" }}>Unsubscribe</span>
          {" · "}
          <span style={{ color: "#aaa" }}>Privacy Policy</span>
        </p>
      </div>
    </div>
  );
}

export default function CampaignsPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>("auction_alert");
  const [subject, setSubject] = useState("");
  const [segment, setSegment] = useState(SEGMENTS[0].value);
  const [sendTime, setSendTime] = useState(SEND_TIMES[0]);
  const [mobilePrev, setMobilePrev] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [pastCampaigns, setPastCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    void fetchCampaigns();
  }, []);

  async function fetchCampaigns() {
    try {
      const res = await fetch("/api/campaigns");
      if (!res.ok) return;
      const data = await res.json() as Campaign[];
      setPastCampaigns(data);
    } catch {
      // Silently fail — campaigns list is non-critical
    }
  }

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  }

  async function handleAISuggest() {
    setLoadingSuggestions(true);
    setSuggestions([]);
    try {
      const res = await fetch("/api/oracle-subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template_type: selectedTemplate, segment }),
      });
      const data = await res.json() as SubjectsResponse;
      setSuggestions(data.suggestions ?? []);
    } catch {
      // Silently ignore — user can still type manually
    } finally {
      setLoadingSuggestions(false);
    }
  }

  async function handleLaunch() {
    if (!subject.trim()) {
      showToast("error", "Please enter a subject line");
      return;
    }

    setLaunching(true);
    setSuggestions([]);
    try {
      // 1. Create draft campaign
      const seg = SEGMENTS.find((s) => s.value === segment);
      const createRes = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          template_type: selectedTemplate,
          segment: seg?.label ?? segment,
          recipient_count: seg?.count ?? 1,
        }),
      });
      if (!createRes.ok) {
        showToast("error", "Failed to create campaign");
        return;
      }
      const campaign = await createRes.json() as Campaign;

      // 2. Send
      const sendRes = await fetch(`/api/campaigns/${campaign.id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          segment: seg?.label ?? segment,
          template_type: selectedTemplate,
          recipient_count: seg?.count ?? 1,
        }),
      });
      const sendData = await sendRes.json() as SendResponse;

      if (sendRes.status === 503 && sendData.demo) {
        showToast("error", "Send failed — check RESEND_API_KEY in .env.local");
      } else if (!sendRes.ok) {
        showToast("error", sendData.error ?? "Send failed");
      } else {
        showToast("success", `🚀 Campaign launched! Message ID: ${sendData.messageId ?? "demo"}`);
        setSubject("");
        void fetchCampaigns();
      }
    } catch {
      showToast("error", "Network error. Please try again.");
    } finally {
      setLaunching(false);
    }
  }

  const segmentLabel = SEGMENTS.find((s) => s.value === segment)?.label ?? segment;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[55%_45%] gap-6">
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-sm font-medium shadow-xl"
          style={{
            backgroundColor: toast.type === "success" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
            border: `1px solid ${toast.type === "success" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
            color: toast.type === "success" ? "#22c55e" : "#ef4444",
            maxWidth: "420px",
          }}
        >
          {toast.message}
        </div>
      )}

      {/* ── Left column — Compose ── */}
      <div className="space-y-5">
        {/* Template picker */}
        <div
          className="rounded-lg p-5"
          style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
        >
          <p className="text-xs uppercase tracking-widest mb-4" style={{ color: "var(--color-text-dim)" }}>
            Select Template
          </p>
          <div className="grid grid-cols-3 gap-3">
            {TEMPLATES.map((t) => {
              const active = selectedTemplate === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => { setSelectedTemplate(t.id); setSuggestions([]); }}
                  className="rounded-lg p-3 text-left transition-colors"
                  style={{
                    backgroundColor: active ? "rgba(201,168,76,0.1)" : "var(--color-surface-2)",
                    border: `1px solid ${active ? "var(--color-gold)" : "var(--color-border)"}`,
                  }}
                >
                  <span className="text-lg block mb-1">{t.emoji}</span>
                  <span className="text-xs font-medium" style={{ color: active ? "var(--color-gold)" : "var(--color-text-dim)" }}>
                    {t.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Campaign config */}
        <div
          className="rounded-lg p-5 space-y-4"
          style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
        >
          <p className="text-xs uppercase tracking-widest" style={{ color: "var(--color-text-dim)" }}>
            Campaign Config
          </p>

          {/* Subject + AI suggest */}
          <div>
            <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: "var(--color-text-dim)" }}>
              Subject Line
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="flex-1 rounded px-3 py-2 text-sm outline-none"
                style={{
                  backgroundColor: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text)",
                }}
                placeholder="Enter a compelling subject…"
              />
              <button
                onClick={handleAISuggest}
                disabled={loadingSuggestions}
                className="flex items-center gap-1.5 px-3 py-2 rounded text-xs font-semibold whitespace-nowrap disabled:opacity-60"
                style={{
                  backgroundColor: "rgba(201,168,76,0.12)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-gold)",
                }}
              >
                {loadingSuggestions ? (
                  <span className="animate-spin inline-block w-3 h-3 border border-current border-t-transparent rounded-full" />
                ) : (
                  <Zap size={11} />
                )}
                AI Suggest
              </button>
            </div>

            {suggestions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => { setSubject(s); setSuggestions([]); }}
                    className="text-xs px-3 py-1.5 rounded-full transition-colors"
                    style={{
                      backgroundColor: "rgba(201,168,76,0.08)",
                      border: "1px solid var(--color-border)",
                      color: "var(--color-text-dim)",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Segment */}
          <div>
            <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: "var(--color-text-dim)" }}>
              Audience Segment
            </label>
            <select
              value={segment}
              onChange={(e) => setSegment(e.target.value)}
              className="w-full rounded px-3 py-2 text-sm outline-none"
              style={{
                backgroundColor: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text)",
              }}
            >
              {SEGMENTS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Send time */}
          <div>
            <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: "var(--color-text-dim)" }}>
              Send Time
            </label>
            <select
              value={sendTime}
              onChange={(e) => setSendTime(e.target.value)}
              className="w-full rounded px-3 py-2 text-sm outline-none"
              style={{
                backgroundColor: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text)",
              }}
            >
              {SEND_TIMES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              className="px-4 py-2.5 rounded text-sm font-medium"
              style={{
                backgroundColor: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text-dim)",
              }}
            >
              Preview
            </button>
            <button
              onClick={handleLaunch}
              disabled={launching}
              className="flex-1 py-2.5 rounded text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ backgroundColor: "var(--color-gold)", color: "#080809" }}
            >
              {launching ? (
                <>
                  <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full" />
                  Sending…
                </>
              ) : (
                `🚀 Launch Campaign → ${segmentLabel}`
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Right column — Preview + Stats ── */}
      <div className="space-y-5">
        {/* Email preview */}
        <div
          className="rounded-lg p-5"
          style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs uppercase tracking-widest" style={{ color: "var(--color-text-dim)" }}>
              Email Preview
            </p>
            <div className="flex gap-1">
              {[
                { label: "Desktop", icon: Monitor, val: false },
                { label: "Mobile", icon: Smartphone, val: true },
              ].map(({ label, icon: Icon, val }) => (
                <button
                  key={label}
                  onClick={() => setMobilePrev(val)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs transition-colors"
                  style={{
                    backgroundColor: mobilePrev === val ? "rgba(201,168,76,0.12)" : "transparent",
                    border: `1px solid ${mobilePrev === val ? "var(--color-border)" : "transparent"}`,
                    color: mobilePrev === val ? "var(--color-gold)" : "var(--color-text-dim)",
                  }}
                >
                  <Icon size={12} />
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div
            className="rounded overflow-hidden"
            style={{ border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <EmailPreview
              subject={subject}
              templateType={selectedTemplate}
              mobile={mobilePrev}
            />
          </div>
        </div>

        {/* Past campaigns */}
        <div
          className="rounded-lg p-5"
          style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
        >
          <p className="text-xs uppercase tracking-widest mb-4" style={{ color: "var(--color-text-dim)" }}>
            Recent Campaigns
          </p>
          {pastCampaigns.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: "var(--color-text-dim)" }}>
              No campaigns sent yet
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr>
                    {["Subject", "Segment", "Status", "Open %", "Click %"].map((h) => (
                      <th
                        key={h}
                        className="pb-2 text-left font-medium"
                        style={{ color: "var(--color-text-dim)", paddingRight: "12px" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pastCampaigns.slice(0, 5).map((c) => {
                    const sc = STATUS_STYLES[c.status] ?? STATUS_STYLES.draft;
                    return (
                      <tr
                        key={c.id}
                        style={{ borderTop: "1px solid var(--color-border)" }}
                      >
                        <td className="py-2 pr-3" style={{ color: "var(--color-text)", maxWidth: "140px" }}>
                          <span className="truncate block" style={{ maxWidth: "130px" }}>{c.subject}</span>
                        </td>
                        <td className="py-2 pr-3" style={{ color: "var(--color-text-dim)" }}>
                          {c.segment.split(" ")[0]}
                        </td>
                        <td className="py-2 pr-3">
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-semibold uppercase"
                            style={{ backgroundColor: sc.bg, color: sc.color }}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="py-2 pr-3">
                          <div>
                            <span style={{ color: "var(--color-text)" }}>{Number(c.openRate).toFixed(1)}%</span>
                            <div
                              className="mt-0.5 rounded-full"
                              style={{ height: "3px", backgroundColor: "rgba(255,255,255,0.06)", width: "60px" }}
                            >
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${Math.min(Number(c.openRate), 100)}%`,
                                  backgroundColor: "var(--color-gold)",
                                }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-2" style={{ color: "var(--color-text)" }}>
                          {Number(c.clickRate).toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
