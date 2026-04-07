"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { NewsletterSubscriber } from "@/lib/schema";

const INVESTOR_TYPES = ["", "btl", "hmo", "commercial", "land", "general"];
const STATUS_OPTIONS = ["", "confirmed", "unsubscribed", "pending"];
const PAGE_SIZE = 25;

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    confirmed: { bg: "rgba(34,197,94,0.15)", color: "#22c55e" },
    unsubscribed: { bg: "rgba(239,68,68,0.15)", color: "#ef4444" },
    pending: { bg: "rgba(234,179,8,0.15)", color: "#eab308" },
  };
  const style = map[status] ?? { bg: "#111", color: "#888" };
  return (
    <span
      className="px-2 py-0.5 rounded-full text-xs font-semibold capitalize"
      style={{ background: style.bg, color: style.color }}
    >
      {status}
    </span>
  );
}

export default function SubscribersPage() {
  const router = useRouter();

  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [counts, setCounts] = useState({ total: 0, confirmed: 0, unsubscribed: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");

  // Pagination
  const [page, setPage] = useState(1);

  // Add subscriber
  const [showAdd, setShowAdd] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addName, setAddName] = useState("");
  const [addType, setAddType] = useState("general");
  const [addSource, setAddSource] = useState("manual");
  const [adding, setAdding] = useState(false);

  // Bulk import
  const [bulkText, setBulkText] = useState("");
  const [importing, setImporting] = useState(false);

  const fetchSubscribers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set("status", filterStatus);
      if (filterType) params.set("investor_type", filterType);
      if (search) params.set("search", search);

      const res = await fetch(`/api/newsletter/subscribers?${params.toString()}`);
      const data = await res.json() as {
        subscribers?: NewsletterSubscriber[];
        counts?: { total: number; confirmed: number; unsubscribed: number };
      };
      setSubscribers(data.subscribers ?? []);
      if (data.counts) setCounts(data.counts);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterType, search]);

  useEffect(() => {
    fetchSubscribers();
    setPage(1);
  }, [fetchSubscribers]);

  const paginated = subscribers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(subscribers.length / PAGE_SIZE);

  const handleAdd = useCallback(async () => {
    if (!addEmail.trim()) return;
    setAdding(true);
    try {
      await fetch("/api/newsletter/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: addEmail.trim(),
          name: addName.trim() || undefined,
          investor_type: addType,
          source: addSource,
        }),
      });
      setShowAdd(false);
      setAddEmail("");
      setAddName("");
      await fetchSubscribers();
    } finally {
      setAdding(false);
    }
  }, [addEmail, addName, addType, addSource, fetchSubscribers]);

  const handleBulkImport = useCallback(async () => {
    const emails = bulkText
      .split("\n")
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.includes("@"));
    if (!emails.length) return;
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
      await fetchSubscribers();
    } finally {
      setImporting(false);
    }
  }, [bulkText, fetchSubscribers]);

  const handleExportCsv = useCallback(() => {
    const confirmed = subscribers.filter((s) => s.status === "confirmed");
    const header = "email,name,investor_type,joined_date";
    const rows = confirmed.map(
      (s) =>
        `${s.email},${s.name ?? ""},${s.investorType ?? ""},${s.createdAt ? new Date(s.createdAt).toLocaleDateString("en-GB") : ""}`
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `midas-subscribers-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [subscribers]);

  return (
    <div className="flex flex-col h-full p-6 overflow-y-auto" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.push("/newsletter")}
          className="text-xs tracking-widest uppercase"
          style={{ color: "var(--color-text-dim)" }}
        >
          ← Newsletter
        </button>
        <h1
          className="text-xl font-serif tracking-widest uppercase"
          style={{ color: "var(--color-gold)", fontFamily: "Georgia, serif" }}
        >
          Subscribers
        </h1>
        <div className="flex gap-3 ml-auto">
          <button
            onClick={handleExportCsv}
            className="px-3 py-1.5 rounded text-xs font-semibold tracking-widest uppercase"
            style={{
              background: "#111",
              border: "1px solid #333",
              color: "var(--color-text-dim)",
            }}
          >
            Export CSV
          </button>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="px-3 py-1.5 rounded text-xs font-bold tracking-widest uppercase"
            style={{
              background: "var(--color-gold)",
              color: "#000",
            }}
          >
            + Add Subscriber
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Total", value: counts.total },
          { label: "Confirmed", value: counts.confirmed },
          { label: "Unsubscribed", value: counts.unsubscribed },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded p-3 text-center"
            style={{ background: "#111", border: "1px solid #1a1a1a" }}
          >
            <p className="text-2xl font-bold" style={{ color: "var(--color-gold)" }}>
              {s.value}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--color-text-dim)" }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Add subscriber form */}
      {showAdd && (
        <div
          className="rounded p-4 mb-5"
          style={{ background: "#111", border: "1px solid rgba(201,168,76,0.3)" }}
        >
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-3"
            style={{ color: "var(--color-gold)" }}
          >
            Add Subscriber
          </p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <input
              value={addEmail}
              onChange={(e) => setAddEmail(e.target.value)}
              placeholder="Email address *"
              className="rounded px-3 py-2 text-sm"
              style={{ background: "#0a0a0a", border: "1px solid #222", color: "#e0e0e0", outline: "none" }}
            />
            <input
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              placeholder="Full name"
              className="rounded px-3 py-2 text-sm"
              style={{ background: "#0a0a0a", border: "1px solid #222", color: "#e0e0e0", outline: "none" }}
            />
            <select
              value={addType}
              onChange={(e) => setAddType(e.target.value)}
              className="rounded px-3 py-2 text-sm"
              style={{ background: "#0a0a0a", border: "1px solid #222", color: "#e0e0e0", outline: "none" }}
            >
              {["btl", "hmo", "commercial", "land", "general"].map((t) => (
                <option key={t} value={t}>{t.toUpperCase()}</option>
              ))}
            </select>
            <select
              value={addSource}
              onChange={(e) => setAddSource(e.target.value)}
              className="rounded px-3 py-2 text-sm"
              style={{ background: "#0a0a0a", border: "1px solid #222", color: "#e0e0e0", outline: "none" }}
            >
              {["manual", "website", "event", "mailchimp_import"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={adding || !addEmail.trim()}
              className="px-4 py-2 rounded text-sm font-bold tracking-widest uppercase"
              style={{
                background: "var(--color-gold)",
                color: "#000",
                opacity: adding || !addEmail.trim() ? 0.5 : 1,
              }}
            >
              {adding ? "Adding…" : "Add"}
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 rounded text-sm"
              style={{ background: "#222", color: "var(--color-text-dim)" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search email or name…"
          className="flex-1 rounded px-3 py-2 text-sm"
          style={{ background: "#111", border: "1px solid #222", color: "#e0e0e0", outline: "none" }}
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded px-3 py-2 text-sm"
          style={{ background: "#111", border: "1px solid #222", color: "#e0e0e0", outline: "none" }}
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.filter(Boolean).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded px-3 py-2 text-sm"
          style={{ background: "#111", border: "1px solid #222", color: "#e0e0e0", outline: "none" }}
        >
          <option value="">All types</option>
          {INVESTOR_TYPES.filter(Boolean).map((t) => (
            <option key={t} value={t}>{t.toUpperCase()}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded overflow-hidden mb-4" style={{ border: "1px solid #1a1a1a" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#0d0d0d", borderBottom: "1px solid #1a1a1a" }}>
              {["Email", "Name", "Type", "Status", "Source", "Joined"].map((h) => (
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
            {loading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sm" style={{ color: "#444" }}>
                  Loading…
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sm" style={{ color: "#444" }}>
                  No subscribers found.
                </td>
              </tr>
            ) : (
              paginated.map((s) => (
                <tr key={s.id} style={{ borderBottom: "1px solid #111" }}>
                  <td className="py-3 px-3" style={{ color: "#e0e0e0" }}>{s.email}</td>
                  <td className="py-3 px-3" style={{ color: "var(--color-text-dim)" }}>{s.name ?? "—"}</td>
                  <td className="py-3 px-3">
                    {s.investorType ? (
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-semibold uppercase"
                        style={{ background: "rgba(201,168,76,0.12)", color: "var(--color-gold)" }}
                      >
                        {s.investorType}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="py-3 px-3"><StatusBadge status={s.status} /></td>
                  <td className="py-3 px-3" style={{ color: "var(--color-text-dim)" }}>{s.source ?? "—"}</td>
                  <td className="py-3 px-3" style={{ color: "var(--color-text-dim)" }}>
                    {s.createdAt ? new Date(s.createdAt).toLocaleDateString("en-GB") : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded text-xs"
            style={{ background: "#111", border: "1px solid #222", color: page === 1 ? "#444" : "#e0e0e0" }}
          >
            ← Prev
          </button>
          <span className="text-xs" style={{ color: "var(--color-text-dim)" }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 rounded text-xs"
            style={{ background: "#111", border: "1px solid #222", color: page === totalPages ? "#444" : "#e0e0e0" }}
          >
            Next →
          </button>
        </div>
      )}

      {/* Bulk import */}
      <div
        className="rounded p-4"
        style={{ border: "1px solid rgba(201,168,76,0.3)", background: "rgba(201,168,76,0.04)" }}
      >
        <p className="text-xs font-semibold mb-1" style={{ color: "var(--color-gold)" }}>
          Bulk Import
        </p>
        <p className="text-xs mb-2" style={{ color: "var(--color-text-dim)" }}>
          Paste one email per line to bulk import (e.g. from Mailchimp CSV export).
        </p>
        <textarea
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          rows={5}
          placeholder="investor1@email.com&#10;investor2@email.com&#10;investor3@email.com"
          className="w-full rounded p-2 text-xs resize-none mb-2"
          style={{ background: "#0a0a0a", border: "1px solid #222", color: "#e0e0e0", outline: "none" }}
        />
        <button
          onClick={handleBulkImport}
          disabled={importing || !bulkText.trim()}
          className="px-4 py-2 rounded text-sm font-bold tracking-widest uppercase"
          style={{
            background: "var(--color-gold)",
            color: "#000",
            opacity: importing || !bulkText.trim() ? 0.5 : 1,
          }}
        >
          {importing ? "Importing…" : "Import"}
        </button>
      </div>
    </div>
  );
}
