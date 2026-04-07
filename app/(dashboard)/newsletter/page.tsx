"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Lot, NewsletterSend } from "@/lib/schema";

// ─── Types ────────────────────────────────────────────────────────────────────

type TemplateId =
  | "auction_alert"
  | "lot_showcase"
  | "deal_spotlight"
  | "event_invite"
  | "market_update"
  | "creative_finance";

type SendMode = "now" | "schedule";
type ActiveTab = "compose" | "history";
type PreviewDevice = "mobile" | "desktop";

interface AiSuggestion {
  subject: string;
  preview: string;
  intro: string;
}

interface SubscriberCounts {
  total: number;
  confirmed: number;
  unsubscribed: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TEMPLATES: { id: TemplateId; emoji: string; label: string }[] = [
  { id: "auction_alert", emoji: "🔨", label: "Auction Alert" },
  { id: "lot_showcase", emoji: "🏠", label: "Lot Showcase" },
  { id: "deal_spotlight", emoji: "💰", label: "Deal Spotlight" },
  { id: "event_invite", emoji: "📅", label: "Event Invite" },
  { id: "market_update", emoji: "📊", label: "Market Update" },
  { id: "creative_finance", emoji: "🤝", label: "Creative Finance" },
];

const LOT_TEMPLATES: TemplateId[] = ["auction_alert", "lot_showcase", "deal_spotlight"];

const SEGMENTS = [
  { label: "All Subscribers", value: "all" },
  { label: "BTL Investors", value: "btl" },
  { label: "HMO Investors", value: "hmo" },
  { label: "Commercial Investors", value: "commercial" },
  { label: "General Enquiries", value: "general" },
];

// ─── Email Template Builder ───────────────────────────────────────────────────

function buildHtml(params: {
  templateType: TemplateId;
  subject: string;
  intro: string;
  lots: Lot[];
  eventDetails?: string;
}): string {
  const { templateType, intro, lots } = params;
  const firstLot = lots[0];

  const gold = "#c9a84c";
  const dark = "#0a0a0a";
  const cardBg = "#111111";
  const textDim = "#888888";

  const heroSection =
    LOT_TEMPLATES.includes(templateType) && firstLot
      ? `<div style="background:${cardBg};padding:32px 40px;text-align:center;border-bottom:1px solid ${gold}33;">
          <p style="color:${textDim};font-size:12px;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;">Featured Property</p>
          <h2 style="color:#e0e0e0;font-size:22px;font-weight:bold;margin-bottom:8px;">${firstLot.address}</h2>
          <p style="color:${gold};font-size:28px;font-weight:bold;margin-bottom:24px;">
            £${(firstLot.guidePrice / 100).toLocaleString("en-GB")} guide price
          </p>
          <a href="#" style="background:${gold};color:${dark};padding:12px 28px;border-radius:4px;text-decoration:none;font-weight:bold;font-size:14px;letter-spacing:1px;">
            Register to Bid →
          </a>
        </div>`
      : "";

  const lotCards =
    LOT_TEMPLATES.includes(templateType) && lots.length > 0
      ? `<div style="margin-top:24px;">
          ${lots
            .map(
              (lot) => `
            <div style="background:${cardBg};border:1px solid #222;border-radius:6px;padding:20px;margin-bottom:12px;">
              <p style="color:#e0e0e0;font-weight:bold;font-size:15px;margin-bottom:6px;">${lot.address}</p>
              <p style="color:${gold};font-size:18px;font-weight:bold;margin-bottom:8px;">
                £${(lot.guidePrice / 100).toLocaleString("en-GB")}
              </p>
              ${lot.propertyType ? `<span style="background:${gold}22;color:${gold};font-size:11px;padding:3px 8px;border-radius:3px;letter-spacing:1px;">${lot.propertyType.toUpperCase()}</span>` : ""}
              <br /><br />
              <a href="#" style="color:${gold};font-size:13px;text-decoration:none;border-bottom:1px solid ${gold}44;">View Legal Pack →</a>
            </div>`
            )
            .join("")}
        </div>`
      : "";

  const eventBlock =
    templateType === "event_invite"
      ? `<div style="background:#1a1a0a;border:1px solid ${gold}44;border-radius:6px;padding:24px;margin-top:24px;text-align:center;">
          <p style="color:${gold};font-size:13px;letter-spacing:2px;text-transform:uppercase;margin-bottom:16px;">Event Details</p>
          <p style="color:#e0e0e0;font-size:14px;line-height:1.8;">${params.eventDetails ?? "Date, time and venue TBC. Full details to follow."}</p>
          <br />
          <a href="#" style="background:${gold};color:${dark};padding:12px 28px;border-radius:4px;text-decoration:none;font-weight:bold;font-size:14px;">
            Register Now →
          </a>
        </div>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Midas Property Auctions</title>
</head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:Georgia,serif;">
<div style="max-width:600px;margin:0 auto;background:${dark};">

  <!-- Header -->
  <div style="background:#000;padding:32px 40px;text-align:center;border-bottom:2px solid ${gold};">
    <h1 style="color:${gold};font-size:36px;letter-spacing:8px;text-transform:uppercase;margin:0 0 4px 0;font-family:Georgia,serif;">MIDAS</h1>
    <p style="color:${textDim};font-size:10px;letter-spacing:4px;text-transform:uppercase;margin:0;">PROPERTY AUCTIONS</p>
  </div>

  <!-- Hero -->
  ${heroSection}

  <!-- Body -->
  <div style="padding:32px 40px;">
    <p style="color:#e0e0e0;font-size:15px;margin-bottom:8px;">Dear {{FIRST_NAME}},</p>
    <p style="color:#c0c0c0;font-size:15px;line-height:1.8;margin-bottom:24px;">${intro || "We have an important update to share with you from Midas Property Auctions."}</p>

    ${lotCards}
    ${eventBlock}

    <!-- Signature -->
    <div style="margin-top:40px;padding-top:24px;border-top:1px solid #222;">
      <p style="color:#e0e0e0;font-weight:bold;font-size:14px;margin-bottom:4px;">Sam Fongho</p>
      <p style="color:${textDim};font-size:13px;margin-bottom:4px;">Midas Property Auctions</p>
      <p style="color:${textDim};font-size:13px;margin-bottom:4px;">📱 07454 753318</p>
      <p style="color:${textDim};font-size:13px;">✉ Sam@MidasPropertyAuctions.co.uk</p>
    </div>
  </div>

  <!-- Footer -->
  <div style="background:#0a0a0a;padding:24px 40px;border-top:1px solid #1a1a1a;text-align:center;">
    <p style="color:#444;font-size:11px;line-height:1.8;margin-bottom:8px;">
      Midas Property Group<br />
      Stanmore Business &amp; Innovation Centre, Stanmore, London HA7 1BT<br />
      +44 207 206 2691
    </p>
    <a href="{{UNSUBSCRIBE_URL}}" style="color:#555;font-size:11px;text-decoration:underline;">Unsubscribe</a>
  </div>

</div>
</body>
</html>`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function NewsletterPage() {
  const router = useRouter();

  // Tab
  const [activeTab, setActiveTab] = useState<ActiveTab>("compose");

  // Composer state
  const [templateType, setTemplateType] = useState<TemplateId>("auction_alert");
  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [intro, setIntro] = useState("");
  const [segment, setSegment] = useState("all");
  const [sendMode, setSendMode] = useState<SendMode>("now");
  const [scheduledAt, setScheduledAt] = useState("");
  const [selectedLotIds, setSelectedLotIds] = useState<string[]>([]);

  // Data
  const [lots, setLots] = useState<Lot[]>([]);
  const [counts, setCounts] = useState<SubscriberCounts>({ total: 0, confirmed: 0, unsubscribed: 0 });
  const [recentSends, setRecentSends] = useState<NewsletterSend[]>([]);

  // AI
  const [aiSuggestion, setAiSuggestion] = useState<AiSuggestion | null>(null);
  const [generating, setGenerating] = useState(false);

  // Actions
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ sent: number; failed: number } | null>(null);

  // Preview
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>("desktop");

  // Bulk import
  const [bulkText, setBulkText] = useState("");
  const [importing, setImporting] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    fetch("/api/newsletter/subscribers")
      .then((r) => r.json())
      .then((d: { counts?: SubscriberCounts }) => {
        if (d.counts) setCounts(d.counts);
      })
      .catch(() => null);

    fetch("/api/newsletter/sends")
      .then((r) => r.json())
      .then((d: NewsletterSend[]) => {
        if (Array.isArray(d)) setRecentSends(d.slice(0, 5));
      })
      .catch(() => null);

    fetch("/api/lots")
      .then((r) => r.json())
      .then((d: Lot[]) => {
        if (Array.isArray(d)) setLots(d);
      })
      .catch(() => null);
  }, []);

  const selectedLots = lots.filter((l) => selectedLotIds.includes(l.id));

  const previewHtml = buildHtml({
    templateType,
    subject,
    intro,
    lots: selectedLots,
  });

  // Toggle lot selection
  const toggleLot = useCallback((id: string) => {
    setSelectedLotIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  // Generate AI suggestions
  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setAiSuggestion(null);
    try {
      const res = await fetch("/api/newsletter/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateType,
          lots: selectedLots.map((l) => ({
            address: l.address,
            guidePrice: l.guidePrice,
            propertyType: l.propertyType,
          })),
        }),
      });
      const data = await res.json() as AiSuggestion;
      setAiSuggestion(data);
      if (data.subject && !subject) setSubject(data.subject);
      if (data.preview && !previewText) setPreviewText(data.preview);
      if (data.intro && !intro) setIntro(data.intro);
    } catch {
      // silent
    } finally {
      setGenerating(false);
    }
  }, [templateType, selectedLots, subject, previewText, intro]);

  // Save draft
  const handleSaveDraft = useCallback(async () => {
    setSaving(true);
    try {
      await fetch("/api/newsletter/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          preview_text: previewText,
          template_type: templateType,
          lot_ids: selectedLotIds.join(","),
          html_body: previewHtml,
        }),
      });
    } finally {
      setSaving(false);
    }
  }, [subject, previewText, templateType, selectedLotIds, previewHtml]);

  // Send campaign
  const handleSend = useCallback(async () => {
    if (!subject.trim()) {
      alert("Please enter a subject line before sending.");
      return;
    }
    if (!confirm(`Send to ${segment === "all" ? "all confirmed" : segment} subscribers?`)) return;
    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch("/api/newsletter/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          previewText,
          templateType,
          htmlBody: previewHtml,
          segment,
        }),
      });
      const data = await res.json() as { sent?: number; failed?: number; demo?: boolean; error?: string };
      if (data.demo) {
        alert("Demo mode: Resend API key not configured. Email not actually sent.");
      } else if (data.sent !== undefined) {
        setSendResult({ sent: data.sent, failed: data.failed ?? 0 });
      }
    } finally {
      setSending(false);
    }
  }, [subject, previewText, templateType, previewHtml, segment]);

  // Bulk import
  const handleBulkImport = useCallback(async () => {
    const emails = bulkText
      .split("\n")
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.includes("@"));
    if (emails.length === 0) return;
    setImporting(true);
    try {
      await Promise.all(
        emails.map((email) =>
          fetch("/api/newsletter/subscribers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, source: "mailchimp_import" }),
          })
        )
      );
      setBulkText("");
      // Refresh counts
      const res = await fetch("/api/newsletter/subscribers");
      const d = await res.json() as { counts?: SubscriberCounts };
      if (d.counts) setCounts(d.counts);
    } finally {
      setImporting(false);
    }
  }, [bulkText]);

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--background)" }}>
      {/* Top nav tabs */}
      <div
        className="flex items-center gap-1 px-6 pt-5 pb-0 border-b"
        style={{ borderColor: "#1a1a1a" }}
      >
        <h1
          className="text-lg font-serif tracking-widest uppercase mr-6"
          style={{ color: "var(--color-gold)", fontFamily: "Georgia, serif" }}
        >
          Newsletter
        </h1>
        {(["compose", "history"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-2 text-sm tracking-widest uppercase font-semibold border-b-2 transition-colors"
            style={{
              borderBottomColor: activeTab === tab ? "var(--color-gold)" : "transparent",
              color: activeTab === tab ? "var(--color-gold)" : "var(--color-text-dim)",
            }}
          >
            {tab === "compose" ? "Compose" : "Sent History"}
          </button>
        ))}
        <button
          onClick={() => router.push("/newsletter/subscribers")}
          className="px-4 py-2 text-sm tracking-widest uppercase font-semibold border-b-2 transition-colors"
          style={{ borderBottomColor: "transparent", color: "var(--color-text-dim)" }}
        >
          Subscribers
        </button>
      </div>

      {/* ── COMPOSE TAB ─────────────────────────────────────────── */}
      {activeTab === "compose" && (
        <div className="flex flex-1 overflow-hidden">
          {/* LEFT PANEL */}
          <div
            className="flex flex-col gap-4 p-4 overflow-y-auto border-r"
            style={{ width: 280, borderColor: "#1a1a1a", flexShrink: 0 }}
          >
            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Total", value: counts.total },
                { label: "Active", value: counts.confirmed },
                { label: "Unsub", value: counts.unsubscribed },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded p-2 text-center"
                  style={{ background: "#111", border: "1px solid #1a1a1a" }}
                >
                  <p
                    className="text-lg font-bold"
                    style={{ color: "var(--color-gold)" }}
                  >
                    {s.value}
                  </p>
                  <p className="text-xs" style={{ color: "var(--color-text-dim)" }}>
                    {s.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Mailchimp import */}
            <div
              className="rounded p-3"
              style={{ border: "1px solid rgba(201,168,76,0.3)", background: "rgba(201,168,76,0.05)" }}
            >
              <p className="text-xs font-semibold mb-1" style={{ color: "var(--color-gold)" }}>
                Import Mailchimp List
              </p>
              <p className="text-xs mb-2" style={{ color: "var(--color-text-dim)" }}>
                Export from Mailchimp as CSV, then paste emails below (one per line).
              </p>
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                rows={4}
                placeholder="investor1@email.com&#10;investor2@email.com"
                className="w-full rounded p-2 text-xs resize-none mb-2"
                style={{
                  background: "#0a0a0a",
                  border: "1px solid #222",
                  color: "#e0e0e0",
                  outline: "none",
                }}
              />
              <button
                onClick={handleBulkImport}
                disabled={importing || !bulkText.trim()}
                className="w-full py-1.5 rounded text-xs font-bold tracking-widest uppercase"
                style={{
                  background: importing ? "#333" : "var(--color-gold)",
                  color: "#000",
                  opacity: importing || !bulkText.trim() ? 0.5 : 1,
                }}
              >
                {importing ? "Importing…" : "Import"}
              </button>
            </div>

            {/* Recent sends */}
            <div>
              <p
                className="text-xs font-semibold mb-2 tracking-widest uppercase"
                style={{ color: "var(--color-text-dim)" }}
              >
                Recent Sends
              </p>
              {recentSends.length === 0 ? (
                <p className="text-xs" style={{ color: "#444" }}>
                  No sends yet.
                </p>
              ) : (
                recentSends.map((s) => (
                  <div
                    key={s.id}
                    className="mb-2 rounded p-2"
                    style={{ background: "#111", border: "1px solid #1a1a1a" }}
                  >
                    <p
                      className="text-xs font-semibold truncate"
                      style={{ color: "#c0c0c0" }}
                    >
                      {s.subject}
                    </p>
                    <p className="text-xs" style={{ color: "var(--color-text-dim)" }}>
                      {s.recipientCount ?? 0} recipients ·{" "}
                      {s.sentAt ? new Date(s.sentAt).toLocaleDateString("en-GB") : "—"}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* CENTRE PANEL */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Template selector */}
            <div className="flex gap-2 flex-wrap mb-5">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setTemplateType(t.id);
                    setAiSuggestion(null);
                  }}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold tracking-widest transition-colors"
                  style={{
                    background:
                      templateType === t.id
                        ? "var(--color-gold)"
                        : "rgba(201,168,76,0.08)",
                    color: templateType === t.id ? "#000" : "var(--color-gold)",
                    border: "1px solid rgba(201,168,76,0.3)",
                  }}
                >
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>

            {/* Lot selector */}
            {LOT_TEMPLATES.includes(templateType) && (
              <div className="mb-5">
                <p
                  className="text-xs font-semibold mb-2 tracking-widest uppercase"
                  style={{ color: "var(--color-text-dim)" }}
                >
                  Select Lots to Feature
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {lots.map((lot) => {
                    const selected = selectedLotIds.includes(lot.id);
                    return (
                      <button
                        key={lot.id}
                        onClick={() => toggleLot(lot.id)}
                        className="flex items-start gap-3 rounded p-3 text-left transition-colors"
                        style={{
                          background: selected ? "rgba(201,168,76,0.1)" : "#111",
                          border: `1px solid ${selected ? "rgba(201,168,76,0.5)" : "#1a1a1a"}`,
                        }}
                      >
                        <span
                          className="mt-0.5 w-4 h-4 rounded flex-shrink-0 flex items-center justify-center text-xs font-bold"
                          style={{
                            background: selected ? "var(--color-gold)" : "#1a1a1a",
                            color: selected ? "#000" : "#444",
                          }}
                        >
                          {selected ? "✓" : ""}
                        </span>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: "#e0e0e0" }}>
                            {lot.address}
                          </p>
                          <p className="text-xs" style={{ color: "var(--color-gold)" }}>
                            £{(lot.guidePrice / 100).toLocaleString("en-GB")} guide
                          </p>
                          <p className="text-xs" style={{ color: "var(--color-text-dim)" }}>
                            {lot.pipelineStage} · {lot.propertyType ?? "N/A"}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Subject */}
            <div className="mb-4">
              <label
                className="text-xs font-semibold tracking-widest uppercase mb-1 block"
                style={{ color: "var(--color-text-dim)" }}
              >
                Subject Line
              </label>
              <div className="flex gap-2">
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter subject line…"
                  className="flex-1 rounded px-3 py-2 text-sm"
                  style={{
                    background: "#111",
                    border: "1px solid #222",
                    color: "#e0e0e0",
                    outline: "none",
                  }}
                />
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="px-3 py-2 rounded text-xs font-bold tracking-widest uppercase flex-shrink-0"
                  style={{
                    background: "rgba(201,168,76,0.12)",
                    color: "var(--color-gold)",
                    border: "1px solid rgba(201,168,76,0.3)",
                    opacity: generating ? 0.5 : 1,
                  }}
                >
                  {generating ? "…" : "🤖 Generate"}
                </button>
              </div>

              {/* AI suggestion pills */}
              {aiSuggestion && (
                <div className="flex flex-wrap gap-2 mt-2">
                  <button
                    onClick={() => setSubject(aiSuggestion.subject)}
                    className="px-3 py-1 rounded-full text-xs"
                    style={{
                      background: "rgba(201,168,76,0.1)",
                      border: "1px solid rgba(201,168,76,0.3)",
                      color: "var(--color-gold)",
                    }}
                  >
                    {aiSuggestion.subject}
                  </button>
                </div>
              )}
            </div>

            {/* Preview text */}
            <div className="mb-4">
              <label
                className="text-xs font-semibold tracking-widest uppercase mb-1 block"
                style={{ color: "var(--color-text-dim)" }}
              >
                Preview Text
              </label>
              <input
                value={previewText}
                onChange={(e) => setPreviewText(e.target.value)}
                placeholder="Short description shown in inbox…"
                className="w-full rounded px-3 py-2 text-sm"
                style={{
                  background: "#111",
                  border: "1px solid #222",
                  color: "#e0e0e0",
                  outline: "none",
                }}
              />
              {aiSuggestion?.preview && (
                <button
                  onClick={() => setPreviewText(aiSuggestion.preview)}
                  className="mt-1 px-3 py-1 rounded-full text-xs"
                  style={{
                    background: "rgba(201,168,76,0.1)",
                    border: "1px solid rgba(201,168,76,0.3)",
                    color: "var(--color-gold)",
                  }}
                >
                  {aiSuggestion.preview}
                </button>
              )}
            </div>

            {/* Intro */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <label
                  className="text-xs font-semibold tracking-widest uppercase"
                  style={{ color: "var(--color-text-dim)" }}
                >
                  Intro Copy
                </label>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="text-xs px-2 py-0.5 rounded"
                  style={{
                    background: "rgba(201,168,76,0.1)",
                    color: "var(--color-gold)",
                    border: "1px solid rgba(201,168,76,0.2)",
                    opacity: generating ? 0.5 : 1,
                  }}
                >
                  🤖 Write intro
                </button>
              </div>
              <textarea
                value={intro}
                onChange={(e) => setIntro(e.target.value)}
                rows={4}
                placeholder="Opening paragraph for your email…"
                className="w-full rounded px-3 py-2 text-sm resize-none"
                style={{
                  background: "#111",
                  border: "1px solid #222",
                  color: "#e0e0e0",
                  outline: "none",
                }}
              />
              {aiSuggestion?.intro && intro !== aiSuggestion.intro && (
                <button
                  onClick={() => setIntro(aiSuggestion.intro)}
                  className="mt-1 text-xs px-2 py-0.5 rounded"
                  style={{
                    background: "rgba(201,168,76,0.1)",
                    color: "var(--color-gold)",
                    border: "1px solid rgba(201,168,76,0.2)",
                  }}
                >
                  Use AI intro
                </button>
              )}
            </div>

            {/* Segment */}
            <div className="mb-4">
              <label
                className="text-xs font-semibold tracking-widest uppercase mb-1 block"
                style={{ color: "var(--color-text-dim)" }}
              >
                Segment
              </label>
              <select
                value={segment}
                onChange={(e) => setSegment(e.target.value)}
                className="w-full rounded px-3 py-2 text-sm"
                style={{
                  background: "#111",
                  border: "1px solid #222",
                  color: "#e0e0e0",
                  outline: "none",
                }}
              >
                {SEGMENTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Send mode */}
            <div className="mb-5">
              <div className="flex gap-2 mb-2">
                {(["now", "schedule"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setSendMode(m)}
                    className="px-4 py-1.5 rounded text-xs font-semibold tracking-widest uppercase"
                    style={{
                      background: sendMode === m ? "var(--color-gold)" : "#111",
                      color: sendMode === m ? "#000" : "var(--color-text-dim)",
                      border: "1px solid #222",
                    }}
                  >
                    {m === "now" ? "Send Now" : "Schedule"}
                  </button>
                ))}
              </div>
              {sendMode === "schedule" && (
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="rounded px-3 py-2 text-sm"
                  style={{
                    background: "#111",
                    border: "1px solid #222",
                    color: "#e0e0e0",
                    outline: "none",
                  }}
                />
              )}
            </div>

            {/* Send result */}
            {sendResult && (
              <div
                className="rounded p-3 mb-4 text-sm"
                style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)", color: "var(--color-gold)" }}
              >
                ✓ Sent to {sendResult.sent} subscribers.{" "}
                {sendResult.failed > 0 && `${sendResult.failed} failed.`}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleSaveDraft}
                disabled={saving}
                className="px-4 py-2 rounded text-sm font-semibold tracking-widest uppercase"
                style={{
                  background: "#111",
                  border: "1px solid #333",
                  color: "var(--color-text-dim)",
                  opacity: saving ? 0.5 : 1,
                }}
              >
                {saving ? "Saving…" : "Save Draft"}
              </button>
              <button
                onClick={handleSend}
                disabled={sending || !subject.trim()}
                className="flex-1 py-2 rounded text-sm font-bold tracking-widest uppercase"
                style={{
                  background: sending || !subject.trim() ? "#333" : "var(--color-gold)",
                  color: "#000",
                  opacity: sending || !subject.trim() ? 0.5 : 1,
                }}
              >
                {sending ? "Sending…" : "Send Campaign"}
              </button>
            </div>
          </div>

          {/* RIGHT PANEL — Live Preview */}
          <div
            className="flex flex-col border-l overflow-hidden"
            style={{ width: 380, borderColor: "#1a1a1a", flexShrink: 0 }}
          >
            {/* Preview header */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: "#1a1a1a" }}
            >
              <span
                className="text-xs font-semibold tracking-widest uppercase"
                style={{ color: "var(--color-text-dim)" }}
              >
                Live Preview
              </span>
              <div className="flex gap-1">
                {(["desktop", "mobile"] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setPreviewDevice(d)}
                    className="px-2 py-1 rounded text-xs font-semibold"
                    style={{
                      background: previewDevice === d ? "var(--color-gold)" : "#111",
                      color: previewDevice === d ? "#000" : "var(--color-text-dim)",
                      border: "1px solid #222",
                    }}
                  >
                    {d === "desktop" ? "🖥" : "📱"}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview iframe */}
            <div className="flex-1 overflow-auto p-3 flex justify-center" style={{ background: "#0d0d0d" }}>
              <iframe
                srcDoc={previewHtml}
                title="Email preview"
                style={{
                  width: previewDevice === "mobile" ? 375 : "100%",
                  height: "100%",
                  border: "none",
                  borderRadius: 4,
                  minHeight: 500,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── SENT HISTORY TAB ─────────────────────────────────────── */}
      {activeTab === "history" && (
        <div className="flex-1 overflow-y-auto p-6">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid #1a1a1a" }}>
                {["Subject", "Template", "Segment", "Recipients", "Date", "Status"].map((h) => (
                  <th
                    key={h}
                    className="text-left py-2 px-3 text-xs font-semibold tracking-widest uppercase"
                    style={{ color: "var(--color-text-dim)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentSends.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-8 text-center text-sm"
                    style={{ color: "#444" }}
                  >
                    No campaigns sent yet.
                  </td>
                </tr>
              ) : (
                recentSends.map((s) => (
                  <tr
                    key={s.id}
                    style={{ borderBottom: "1px solid #111" }}
                  >
                    <td className="py-3 px-3" style={{ color: "#e0e0e0" }}>
                      {s.subject}
                    </td>
                    <td className="py-3 px-3" style={{ color: "var(--color-text-dim)" }}>
                      {s.templateType ?? "—"}
                    </td>
                    <td className="py-3 px-3" style={{ color: "var(--color-text-dim)" }}>
                      {s.segment ?? "—"}
                    </td>
                    <td className="py-3 px-3" style={{ color: "var(--color-gold)" }}>
                      {s.recipientCount ?? 0}
                    </td>
                    <td className="py-3 px-3" style={{ color: "var(--color-text-dim)" }}>
                      {s.sentAt ? new Date(s.sentAt).toLocaleDateString("en-GB") : "—"}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{
                          background: "rgba(34,197,94,0.15)",
                          color: "#22c55e",
                        }}
                      >
                        {s.status ?? "sent"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
