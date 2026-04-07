"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { Lot } from "@/lib/schema";

// ─── Types ────────────────────────────────────────────────────────────────────

type Platform = "linkedin" | "instagram" | "facebook" | "twitter";
type Tone = "professional" | "urgent" | "educational" | "community";

interface GenerateResult {
  id: string;
  post: string;
  hashtags: string;
  hook: string;
  cta: string;
  platform: Platform;
}

interface PostRecord {
  id: string;
  lotId: string | null;
  platform: string;
  content: string;
  hashtags: string | null;
  status: string;
  tone: string;
  createdAt: string;
  lotAddress: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PLATFORMS: { id: Platform; label: string; icon: string; limit: number }[] = [
  { id: "linkedin", label: "LinkedIn", icon: "in", limit: 3000 },
  { id: "instagram", label: "Instagram", icon: "IG", limit: 2200 },
  { id: "facebook", label: "Facebook", icon: "f", limit: 63206 },
  { id: "twitter", label: "Twitter/X", icon: "𝕏", limit: 280 },
];

const TONES: { id: Tone; label: string }[] = [
  { id: "professional", label: "Professional" },
  { id: "urgent", label: "Urgent" },
  { id: "educational", label: "Educational" },
  { id: "community", label: "Community" },
];

const FILTER_PLATFORMS = ["all", "linkedin", "instagram", "facebook", "twitter"];
const FILTER_STATUSES = ["all", "draft", "approved", "posted"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatGuidePrice(pence: number): string {
  if (pence >= 1_000_000) return `£${(pence / 1_000_000).toFixed(2)}m`;
  if (pence >= 1_000) return `£${(pence / 1_000).toFixed(0)}k`;
  return `£${pence.toLocaleString("en-GB")}`;
}

function CharCount({ text, limit }: { text: string; limit: number }) {
  const len = text.length;
  const color = len > limit ? "#ef4444" : len > limit * 0.9 ? "#eab308" : "#22c55e";
  return (
    <span className="text-xs font-mono" style={{ color }}>
      {len}/{limit}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    draft: { bg: "rgba(234,179,8,0.15)", color: "#eab308" },
    approved: { bg: "rgba(59,130,246,0.15)", color: "#3b82f6" },
    posted: { bg: "rgba(34,197,94,0.15)", color: "#22c55e" },
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

// ─── Inner component (uses useSearchParams) ───────────────────────────────────

function SocialPageInner() {
  const searchParams = useSearchParams();
  const initialLotId = searchParams.get("lotId") ?? "";

  // Config state
  const [lots, setLots] = useState<Lot[]>([]);
  const [selectedLotId, setSelectedLotId] = useState(initialLotId);
  const [tone, setTone] = useState<Tone>("professional");
  const [customNotes, setCustomNotes] = useState("");

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<Partial<Record<Platform, GenerateResult>>>({});
  const [activePlatform, setActivePlatform] = useState<Platform>("linkedin");

  // Edit state
  const [editingPlatform, setEditingPlatform] = useState<Platform | null>(null);
  const [editContent, setEditContent] = useState("");
  const [copiedPlatform, setCopiedPlatform] = useState<Platform | null>(null);

  // History state
  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Fetch lots and post history
  useEffect(() => {
    fetch("/api/lots")
      .then((r) => r.json())
      .then((d: Lot[]) => { if (Array.isArray(d)) setLots(d); })
      .catch(() => null);

    void fetchHistory();
  }, []);

  // If a lotId is passed via URL, auto-select it
  useEffect(() => {
    if (initialLotId) setSelectedLotId(initialLotId);
  }, [initialLotId]);

  const fetchHistory = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterPlatform !== "all") params.set("platform", filterPlatform);
      if (filterStatus !== "all") params.set("status", filterStatus);
      const res = await fetch(`/api/social/posts?${params.toString()}`);
      const data = await res.json() as PostRecord[];
      if (Array.isArray(data)) setPosts(data);
    } catch {
      // silent
    }
  }, [filterPlatform, filterStatus]);

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  // Generate all 4 platforms in parallel
  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setResults({});
    setEditingPlatform(null);

    const allPlatforms: Platform[] = ["linkedin", "instagram", "facebook", "twitter"];
    try {
      const calls = allPlatforms.map((p) =>
        fetch("/api/social/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lotId: selectedLotId || undefined,
            platform: p,
            tone,
            customNotes: customNotes.trim() || undefined,
          }),
        })
          .then((r) => r.json())
          .then((d: GenerateResult) => ({ ...d, platform: p }))
          .catch(() => null)
      );

      const outcomes = await Promise.all(calls);
      const newResults: Partial<Record<Platform, GenerateResult>> = {};
      for (const outcome of outcomes) {
        if (outcome) newResults[outcome.platform] = outcome;
      }
      setResults(newResults);
      await fetchHistory();
    } finally {
      setGenerating(false);
    }
  }, [selectedLotId, tone, customNotes, fetchHistory]);

  const handleCopy = useCallback(async (platform: Platform) => {
    const result = results[platform];
    if (!result) return;
    const text = `${result.post}\n\n${result.hashtags}`;
    await navigator.clipboard.writeText(text);
    setCopiedPlatform(platform);
    setTimeout(() => setCopiedPlatform(null), 2000);
  }, [results]);

  const handleCopyHashtags = useCallback(async (platform: Platform) => {
    const result = results[platform];
    if (!result) return;
    await navigator.clipboard.writeText(result.hashtags);
    setCopiedPlatform(platform);
    setTimeout(() => setCopiedPlatform(null), 2000);
  }, [results]);

  const handleMarkPosted = useCallback(async (id: string) => {
    await fetch(`/api/social/posts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "posted" }),
    });
    await fetchHistory();
  }, [fetchHistory]);

  const handleDelete = useCallback(async (id: string) => {
    await fetch(`/api/social/posts/${id}`, { method: "DELETE" });
    setResults((prev) => {
      const next = { ...prev };
      for (const p of Object.keys(next) as Platform[]) {
        if (next[p]?.id === id) delete next[p];
      }
      return next;
    });
    await fetchHistory();
  }, [fetchHistory]);

  const handleSaveEdit = useCallback(async (platform: Platform) => {
    const result = results[platform];
    if (!result) return;
    await fetch(`/api/social/posts/${result.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editContent }),
    });
    setResults((prev) => ({
      ...prev,
      [platform]: { ...prev[platform]!, post: editContent },
    }));
    setEditingPlatform(null);
  }, [results, editContent]);

  const handleHistoryCopy = useCallback(async (post: PostRecord) => {
    const text = post.hashtags ? `${post.content}\n\n${post.hashtags}` : post.content;
    await navigator.clipboard.writeText(text);
  }, []);

  // ─── Render ──────────────────────────────────────────────────────────────────

  const selectedLot = lots.find((l) => l.id === selectedLotId);
  const activeResult = results[activePlatform];
  const platformMeta = PLATFORMS.find((p) => p.id === activePlatform)!;

  return (
    <div
      className="flex flex-col h-full overflow-y-auto"
      style={{ background: "var(--background)" }}
    >
      {/* ── TOP: Generate Bar ─────────────────────────────────────────── */}
      <div
        className="p-6 border-b"
        style={{ borderColor: "#1a1a1a" }}
      >
        <h1
          className="text-xl font-serif tracking-widest uppercase mb-1"
          style={{ color: "var(--color-gold)", fontFamily: "Georgia, serif" }}
        >
          Social Content Generator
        </h1>
        <p className="text-sm mb-5" style={{ color: "var(--color-text-dim)" }}>
          AI writes platform-native posts from your lot data — ready to copy in seconds.
        </p>

        <div className="flex flex-wrap gap-3 items-end">
          {/* Lot selector */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--color-text-dim)" }}>
              Lot
            </label>
            <select
              value={selectedLotId}
              onChange={(e) => setSelectedLotId(e.target.value)}
              className="rounded px-3 py-2 text-sm"
              style={{
                background: "#111",
                border: "1px solid #222",
                color: "#e0e0e0",
                outline: "none",
                minWidth: 240,
              }}
            >
              <option value="">No specific lot (general post)</option>
              {lots.map((lot) => (
                <option key={lot.id} value={lot.id}>
                  {lot.address.length > 45 ? lot.address.slice(0, 45) + "…" : lot.address}
                  {" — "}
                  {formatGuidePrice(lot.guidePrice)}
                </option>
              ))}
            </select>
          </div>

          {/* Tone selector */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--color-text-dim)" }}>
              Tone
            </label>
            <div className="flex gap-1">
              {TONES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTone(t.id)}
                  className="px-3 py-2 rounded text-xs font-semibold tracking-widest"
                  style={{
                    background: tone === t.id ? "var(--color-gold)" : "#111",
                    color: tone === t.id ? "#000" : "var(--color-text-dim)",
                    border: "1px solid #222",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom notes */}
          <div className="flex flex-col gap-1 flex-1" style={{ minWidth: 200 }}>
            <label className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--color-text-dim)" }}>
              Notes (optional)
            </label>
            <input
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="e.g. 'creative finance available' or 'motivated vendor'"
              className="rounded px-3 py-2 text-sm"
              style={{
                background: "#111",
                border: "1px solid #222",
                color: "#e0e0e0",
                outline: "none",
              }}
            />
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-6 py-2 rounded text-sm font-bold tracking-widest uppercase"
            style={{
              background: generating ? "#333" : "var(--color-gold)",
              color: generating ? "#888" : "#000",
              minWidth: 160,
              height: 40,
            }}
          >
            {generating ? "ARIA is writing…" : "⚡ Generate"}
          </button>
        </div>
      </div>

      {/* ── MIDDLE: Generated Content ─────────────────────────────────── */}
      {Object.keys(results).length > 0 && (
        <div className="p-6 border-b" style={{ borderColor: "#1a1a1a" }}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--color-text-dim)" }}>
              Generated for:
            </span>
            <span className="text-xs" style={{ color: "var(--color-gold)" }}>
              {selectedLot ? selectedLot.address : "General post"}
            </span>
          </div>

          {/* Platform tabs */}
          <div className="flex gap-2 mb-4">
            {PLATFORMS.map((p) => (
              <button
                key={p.id}
                onClick={() => setActivePlatform(p.id)}
                className="px-4 py-2 rounded text-xs font-bold tracking-widest uppercase flex items-center gap-2"
                style={{
                  background: activePlatform === p.id ? "var(--color-gold)" : "#111",
                  color: activePlatform === p.id ? "#000" : results[p.id] ? "var(--color-text-dim)" : "#333",
                  border: `1px solid ${activePlatform === p.id ? "transparent" : "#1a1a1a"}`,
                }}
              >
                <span
                  className="text-xs font-bold"
                  style={{
                    width: 18,
                    height: 18,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: activePlatform === p.id ? "rgba(0,0,0,0.2)" : "rgba(201,168,76,0.15)",
                    borderRadius: 3,
                    color: activePlatform === p.id ? "#000" : "var(--color-gold)",
                    flexShrink: 0,
                  }}
                >
                  {p.icon}
                </span>
                {p.label}
                {results[p.id] && (
                  <span style={{ color: activePlatform === p.id ? "#000" : "#22c55e", fontSize: 10 }}>✓</span>
                )}
              </button>
            ))}
          </div>

          {/* Active platform panel */}
          {activeResult && (
            <div
              className="rounded-lg p-5"
              style={{ background: "#111", border: "1px solid #1a1a1a" }}
            >
              {/* Hook */}
              <div className="mb-4">
                <p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: "var(--color-text-dim)" }}>
                  Hook (first line)
                </p>
                <p className="text-base font-semibold" style={{ color: "var(--color-gold)" }}>
                  {activeResult.hook}
                </p>
              </div>

              {/* Post body */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--color-text-dim)" }}>
                    Post
                  </p>
                  <CharCount
                    text={editingPlatform === activePlatform ? editContent : activeResult.post}
                    limit={platformMeta.limit}
                  />
                </div>
                {editingPlatform === activePlatform ? (
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={10}
                    className="w-full rounded p-3 text-sm resize-none"
                    style={{
                      background: "#0a0a0a",
                      border: "1px solid rgba(201,168,76,0.4)",
                      color: "#e0e0e0",
                      outline: "none",
                      lineHeight: 1.7,
                    }}
                  />
                ) : (
                  <pre
                    className="rounded p-3 text-sm overflow-auto"
                    style={{
                      background: "#0a0a0a",
                      border: "1px solid #1a1a1a",
                      color: "#e0e0e0",
                      fontFamily: "inherit",
                      whiteSpace: "pre-wrap",
                      lineHeight: 1.7,
                    }}
                  >
                    {activeResult.post}
                  </pre>
                )}
              </div>

              {/* Hashtags */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--color-text-dim)" }}>
                    Hashtags
                  </p>
                  <button
                    onClick={() => handleCopyHashtags(activePlatform)}
                    className="text-xs px-2 py-0.5 rounded"
                    style={{
                      background: "rgba(201,168,76,0.1)",
                      color: "var(--color-gold)",
                      border: "1px solid rgba(201,168,76,0.2)",
                    }}
                  >
                    {copiedPlatform === activePlatform ? "Copied!" : "Copy all"}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {activeResult.hashtags.split(" ").filter(Boolean).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: "rgba(201,168,76,0.08)",
                        border: "1px solid rgba(201,168,76,0.3)",
                        color: "var(--color-gold)",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="mb-5">
                <p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: "var(--color-text-dim)" }}>
                  Call to action
                </p>
                <p className="text-sm" style={{ color: "#c0c0c0" }}>
                  {activeResult.cta}
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => handleCopy(activePlatform)}
                  className="px-4 py-2 rounded text-xs font-bold tracking-widest uppercase"
                  style={{ background: "var(--color-gold)", color: "#000" }}
                >
                  {copiedPlatform === activePlatform ? "✓ Copied!" : "📋 Copy Post"}
                </button>

                {editingPlatform === activePlatform ? (
                  <>
                    <button
                      onClick={() => handleSaveEdit(activePlatform)}
                      className="px-4 py-2 rounded text-xs font-bold tracking-widest uppercase"
                      style={{ background: "#22c55e", color: "#000" }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingPlatform(null)}
                      className="px-4 py-2 rounded text-xs"
                      style={{ background: "#222", color: "var(--color-text-dim)" }}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setEditingPlatform(activePlatform);
                      setEditContent(activeResult.post);
                    }}
                    className="px-4 py-2 rounded text-xs font-bold tracking-widest uppercase"
                    style={{ background: "#111", border: "1px solid #333", color: "var(--color-text-dim)" }}
                  >
                    ✏️ Edit
                  </button>
                )}

                <button
                  onClick={() => handleMarkPosted(activeResult.id)}
                  className="px-4 py-2 rounded text-xs font-bold tracking-widest uppercase"
                  style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)" }}
                >
                  ✅ Mark as Posted
                </button>

                <button
                  onClick={() => handleDelete(activeResult.id)}
                  className="px-4 py-2 rounded text-xs font-bold tracking-widest uppercase ml-auto"
                  style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}
                >
                  🗑 Delete
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── BOTTOM: Post History ───────────────────────────────────────── */}
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <h2
            className="text-sm font-semibold tracking-widest uppercase"
            style={{ color: "var(--color-text-dim)" }}
          >
            Recent Posts
          </h2>
          <span
            className="px-2 py-0.5 rounded-full text-xs font-semibold"
            style={{ background: "rgba(201,168,76,0.15)", color: "var(--color-gold)" }}
          >
            {posts.length}
          </span>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap mb-4">
          <div className="flex gap-1">
            {FILTER_PLATFORMS.map((p) => (
              <button
                key={p}
                onClick={() => setFilterPlatform(p)}
                className="px-3 py-1 rounded text-xs font-semibold capitalize"
                style={{
                  background: filterPlatform === p ? "var(--color-gold)" : "#111",
                  color: filterPlatform === p ? "#000" : "var(--color-text-dim)",
                  border: "1px solid #1a1a1a",
                }}
              >
                {p === "all" ? "All Platforms" : p}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            {FILTER_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className="px-3 py-1 rounded text-xs font-semibold capitalize"
                style={{
                  background: filterStatus === s ? "rgba(201,168,76,0.15)" : "#111",
                  color: filterStatus === s ? "var(--color-gold)" : "var(--color-text-dim)",
                  border: `1px solid ${filterStatus === s ? "rgba(201,168,76,0.3)" : "#1a1a1a"}`,
                }}
              >
                {s === "all" ? "All Statuses" : s}
              </button>
            ))}
          </div>
        </div>

        {/* History table */}
        {posts.length === 0 ? (
          <p className="text-sm" style={{ color: "#444" }}>
            No posts yet. Generate your first post above.
          </p>
        ) : (
          <div className="space-y-2">
            {posts.map((post) => {
              const platMeta = PLATFORMS.find((p) => p.id === post.platform);
              return (
                <div
                  key={post.id}
                  className="flex items-start gap-3 rounded-lg p-4"
                  style={{ background: "#111", border: "1px solid #1a1a1a" }}
                >
                  {/* Platform icon */}
                  <span
                    className="text-xs font-bold flex-shrink-0 flex items-center justify-center rounded"
                    style={{
                      width: 28,
                      height: 28,
                      background: "rgba(201,168,76,0.15)",
                      color: "var(--color-gold)",
                      marginTop: 2,
                    }}
                  >
                    {platMeta?.icon ?? post.platform.slice(0, 2).toUpperCase()}
                  </span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-semibold capitalize" style={{ color: "var(--color-gold)" }}>
                        {platMeta?.label ?? post.platform}
                      </span>
                      <span className="text-xs" style={{ color: "var(--color-text-dim)" }}>
                        {post.lotAddress ?? "General"}
                      </span>
                      <StatusBadge status={post.status} />
                      <span className="text-xs ml-auto" style={{ color: "#444" }}>
                        {new Date(post.createdAt).toLocaleDateString("en-GB")}
                      </span>
                    </div>
                    <p className="text-xs truncate" style={{ color: "#888" }}>
                      {post.content.slice(0, 80)}{post.content.length > 80 ? "…" : ""}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleHistoryCopy(post)}
                      className="px-2 py-1 rounded text-xs"
                      style={{ background: "#1a1a1a", color: "var(--color-text-dim)" }}
                      title="Copy"
                    >
                      📋
                    </button>
                    <button
                      onClick={() => {
                        // Show in generate area by matching platform if result exists
                        setActivePlatform(post.platform as Platform);
                      }}
                      className="px-2 py-1 rounded text-xs"
                      style={{ background: "#1a1a1a", color: "var(--color-text-dim)" }}
                      title="View"
                    >
                      👁
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page wrapper with Suspense for useSearchParams ───────────────────────────

export default function SocialPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full" style={{ color: "var(--color-text-dim)" }}>
          Loading…
        </div>
      }
    >
      <SocialPageInner />
    </Suspense>
  );
}
