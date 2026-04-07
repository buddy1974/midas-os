"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { Lot } from "@/lib/schema";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ViewingRow {
  id: string;
  lotId: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  viewingDate: string;
  durationMinutes: number;
  status: string;
  notes: string | null;
  confirmationSent: boolean;
  createdAt: string;
  lotAddress: string | null;
  lotGuidePrice: number | null;
}

interface Slot {
  datetime: string;
  available: boolean;
  label: string;
  weekend: boolean;
}

type FilterStatus = "all" | "scheduled" | "confirmed" | "completed" | "cancelled";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatGuidePrice(pence: number): string {
  if (pence >= 1_000_000) return `£${(pence / 1_000_000).toFixed(2)}m`;
  if (pence >= 1_000) return `£${(pence / 1_000).toFixed(0)}k`;
  return `£${pence.toLocaleString("en-GB")}`;
}

function formatViewingDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
    + " · " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function getDayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const dayStart = new Date(d);
  dayStart.setHours(0, 0, 0, 0);

  if (dayStart.getTime() === today.getTime()) return "TODAY";
  if (dayStart.getTime() === tomorrow.getTime()) return "TOMORROW";
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }).toUpperCase();
}

function groupByDay(viewingsList: ViewingRow[]): Map<string, ViewingRow[]> {
  const map = new Map<string, ViewingRow[]>();
  for (const v of viewingsList) {
    const key = new Date(v.viewingDate).toDateString();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(v);
  }
  return map;
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  scheduled: { bg: "rgba(59,130,246,0.15)", color: "#3b82f6" },
  confirmed: { bg: "rgba(201,168,76,0.15)", color: "#c9a84c" },
  completed: { bg: "rgba(34,197,94,0.15)", color: "#22c55e" },
  cancelled: { bg: "rgba(239,68,68,0.12)", color: "#ef4444" },
  no_show: { bg: "rgba(156,163,175,0.12)", color: "#9ca3af" },
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#0a0a0a",
  border: "1px solid #222",
  color: "#e0e0e0",
  borderRadius: 6,
  padding: "8px 12px",
  fontSize: 13,
  outline: "none",
};

// ─── Inner page (uses useSearchParams) ────────────────────────────────────────

function ViewingsPageInner() {
  const searchParams = useSearchParams();
  const initialLotId = searchParams.get("lotId") ?? "";

  // Data
  const [viewingsList, setViewingsList] = useState<ViewingRow[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [filter, setFilter] = useState<FilterStatus>("all");

  // Booking form
  const [bookLotId, setBookLotId] = useState(initialLotId);
  const [bookDate, setBookDate] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [booking, setBooking] = useState(false);
  const [bookSuccess, setBookSuccess] = useState("");
  const [bookError, setBookError] = useState("");

  const fetchViewings = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("status", filter);
      const res = await fetch(`/api/viewings?${params.toString()}`);
      const data = await res.json() as ViewingRow[];
      if (Array.isArray(data)) setViewingsList(data);
    } catch { /* silent */ }
  }, [filter]);

  useEffect(() => {
    void fetchViewings();
    fetch("/api/lots")
      .then((r) => r.json())
      .then((d: Lot[]) => { if (Array.isArray(d)) setLots(d); })
      .catch(() => null);
  }, [fetchViewings]);

  useEffect(() => {
    if (initialLotId) setBookLotId(initialLotId);
  }, [initialLotId]);

  // Fetch slots when lot + date change
  useEffect(() => {
    if (!bookLotId || !bookDate) { setSlots([]); return; }
    setLoadingSlots(true);
    setSelectedSlot("");
    fetch(`/api/viewings/slots?lot_id=${bookLotId}&date=${bookDate}`)
      .then((r) => r.json())
      .then((d: Slot[]) => { if (Array.isArray(d)) setSlots(d); })
      .catch(() => null)
      .finally(() => setLoadingSlots(false));
  }, [bookLotId, bookDate]);

  // Stats
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const scheduledThisWeek = viewingsList.filter((v) => {
    const d = new Date(v.viewingDate);
    return (v.status === "scheduled" || v.status === "confirmed") && d >= weekStart && d <= weekEnd;
  }).length;

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const completedThisMonth = viewingsList.filter((v) => {
    const d = new Date(v.viewingDate);
    return v.status === "completed" && d >= monthStart;
  }).length;

  const total = viewingsList.length;
  const cancelled = viewingsList.filter((v) => v.status === "cancelled").length;
  const cancellationRate = total > 0 ? Math.round((cancelled / total) * 100) : 0;

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/viewings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await fetchViewings();
  }

  async function deleteViewing(id: string) {
    if (!confirm("Delete this viewing?")) return;
    await fetch(`/api/viewings/${id}`, { method: "DELETE" });
    await fetchViewings();
  }

  async function handleBook() {
    if (!bookLotId || !selectedSlot || !contactName.trim() || !contactEmail.trim()) return;
    setBooking(true);
    setBookError("");
    setBookSuccess("");
    try {
      const res = await fetch("/api/viewings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lot_id: bookLotId,
          contact_name: contactName.trim(),
          contact_email: contactEmail.trim().toLowerCase(),
          contact_phone: contactPhone.trim() || undefined,
          viewing_date: selectedSlot,
          notes: notes.trim() || undefined,
        }),
      });
      const data = await res.json() as { error?: string; message?: string; contactEmail?: string };
      if (!res.ok) {
        setBookError(data.message ?? data.error ?? "Booking failed");
      } else {
        const slot = new Date(selectedSlot);
        const dateStr = slot.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
        const timeStr = slot.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
        setBookSuccess(`Viewing booked for ${dateStr} at ${timeStr}. Confirmation email sent to ${contactEmail}.`);
        setContactName(""); setContactEmail(""); setContactPhone(""); setNotes("");
        setSelectedSlot(""); setBookDate(""); setSlots([]);
        await fetchViewings();
      }
    } finally {
      setBooking(false);
    }
  }

  // Group viewings for list
  const filtered = filter === "all" ? viewingsList : viewingsList.filter((v) => v.status === filter);
  const grouped = groupByDay(filtered);

  // Slot sections
  const morningSlots = slots.filter((s) => new Date(s.datetime).getHours() < 12);
  const afternoonSlots = slots.filter((s) => { const h = new Date(s.datetime).getHours(); return h >= 12 && h < 17; });
  const eveningSlots = slots.filter((s) => new Date(s.datetime).getHours() >= 17);

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b" style={{ borderColor: "#1a1a1a", flexShrink: 0 }}>
        <h1 className="text-xl font-serif tracking-widest uppercase" style={{ color: "var(--color-gold)", fontFamily: "Georgia, serif" }}>
          Viewing Scheduler
        </h1>
        <p className="text-xs mt-0.5" style={{ color: "var(--color-text-dim)" }}>
          Book, confirm and manage property viewings
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 px-6 py-3 border-b" style={{ borderColor: "#1a1a1a", flexShrink: 0 }}>
        {[
          { label: "Scheduled This Week", value: scheduledThisWeek },
          { label: "Completed This Month", value: completedThisMonth },
          { label: "Cancellation Rate", value: `${cancellationRate}%` },
          { label: "Total Viewings", value: total },
        ].map((s) => (
          <div key={s.label} className="rounded p-3" style={{ background: "#111", border: "1px solid #1a1a1a" }}>
            <p className="text-lg font-bold" style={{ color: "var(--color-gold)" }}>{s.value}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-dim)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Main 2-col layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT — Viewings list */}
        <div className="flex flex-col overflow-hidden border-r" style={{ flex: "0 0 60%", borderColor: "#1a1a1a" }}>
          {/* Filter tabs */}
          <div className="flex gap-1 px-4 py-3 border-b" style={{ borderColor: "#1a1a1a", flexShrink: 0 }}>
            {(["all", "scheduled", "confirmed", "completed", "cancelled"] as FilterStatus[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-3 py-1 rounded text-xs font-semibold capitalize"
                style={{
                  background: filter === f ? "var(--color-gold)" : "#111",
                  color: filter === f ? "#000" : "var(--color-text-dim)",
                  border: "1px solid #1a1a1a",
                }}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Grouped list */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {grouped.size === 0 ? (
              <p className="text-sm" style={{ color: "#444" }}>No viewings{filter !== "all" ? ` with status "${filter}"` : ""}.</p>
            ) : (
              Array.from(grouped.entries()).map(([dayKey, dayViewings]) => (
                <div key={dayKey} className="mb-5">
                  <p className="text-xs font-bold tracking-widest mb-2" style={{ color: "var(--color-gold)" }}>
                    {getDayLabel(dayViewings[0].viewingDate)} — {new Date(dayViewings[0].viewingDate).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
                  </p>
                  <div className="space-y-2">
                    {dayViewings.map((v) => {
                      const ss = STATUS_STYLE[v.status] ?? STATUS_STYLE.scheduled;
                      return (
                        <div key={v.id} className="rounded-lg p-4" style={{ background: "#111", border: "1px solid #1a1a1a" }}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate" style={{ color: "#e0e0e0" }}>
                                {v.lotAddress ?? "Unknown property"}
                              </p>
                              <p className="text-xs mt-0.5" style={{ color: "var(--color-gold)" }}>
                                {formatViewingDate(v.viewingDate)} · {v.durationMinutes}min
                              </p>
                              <p className="text-xs mt-1" style={{ color: "var(--color-text-dim)" }}>
                                {v.contactName}
                                {v.contactPhone && ` · ${v.contactPhone}`}
                              </p>
                              <p className="text-xs" style={{ color: "#555" }}>{v.contactEmail}</p>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold capitalize flex-shrink-0" style={{ background: ss.bg, color: ss.color }}>
                              {v.status}
                            </span>
                          </div>
                          <div className="flex gap-1.5 mt-3 flex-wrap">
                            {v.status === "scheduled" && (
                              <button onClick={() => updateStatus(v.id, "confirmed")} className="px-2 py-1 rounded text-xs font-semibold" style={{ background: "rgba(201,168,76,0.12)", color: "var(--color-gold)", border: "1px solid rgba(201,168,76,0.2)" }}>
                                ✅ Confirm
                              </button>
                            )}
                            {v.status === "confirmed" && (
                              <button onClick={() => updateStatus(v.id, "completed")} className="px-2 py-1 rounded text-xs font-semibold" style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}>
                                ✓ Completed
                              </button>
                            )}
                            {(v.status === "scheduled" || v.status === "confirmed") && (
                              <button onClick={() => updateStatus(v.id, "cancelled")} className="px-2 py-1 rounded text-xs" style={{ background: "#1a1a1a", color: "#ef4444" }}>
                                ❌ Cancel
                              </button>
                            )}
                            {v.status === "scheduled" && (
                              <button onClick={() => deleteViewing(v.id)} className="px-2 py-1 rounded text-xs" style={{ background: "#1a1a1a", color: "#555" }}>
                                🗑 Delete
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT — Book new viewing */}
        <div className="flex flex-col overflow-y-auto p-4" style={{ flex: "0 0 40%" }}>
          <div className="rounded-lg p-4" style={{ background: "#111", border: "1px solid #1a1a1a" }}>
            <p className="text-sm font-semibold tracking-widest uppercase mb-4" style={{ color: "var(--color-gold)" }}>
              Book a Viewing
            </p>

            {/* Property */}
            <div className="mb-3">
              <label className="text-xs font-semibold tracking-widest uppercase mb-1 block" style={{ color: "var(--color-text-dim)" }}>Property *</label>
              <select value={bookLotId} onChange={(e) => { setBookLotId(e.target.value); setSlots([]); setSelectedSlot(""); }} style={inputStyle}>
                <option value="">Select a lot…</option>
                {lots.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.address.length > 45 ? l.address.slice(0, 45) + "…" : l.address}
                    {" — "}
                    {formatGuidePrice(l.guidePrice)}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div className="mb-3">
              <label className="text-xs font-semibold tracking-widest uppercase mb-1 block" style={{ color: "var(--color-text-dim)" }}>Date *</label>
              <input
                type="date"
                value={bookDate}
                onChange={(e) => { setBookDate(e.target.value); setSelectedSlot(""); }}
                disabled={!bookLotId}
                style={{ ...inputStyle, opacity: !bookLotId ? 0.4 : 1 }}
              />
            </div>

            {/* Slot grid */}
            {bookDate && bookLotId && (
              <div className="mb-3">
                <label className="text-xs font-semibold tracking-widest uppercase mb-2 block" style={{ color: "var(--color-text-dim)" }}>
                  {loadingSlots ? "Loading slots…" : "Available Times"}
                </label>
                {!loadingSlots && slots.length > 0 && (
                  <div className="space-y-3">
                    {[
                      { label: "Morning", slotGroup: morningSlots },
                      { label: "Afternoon", slotGroup: afternoonSlots },
                      { label: "Evening", slotGroup: eveningSlots },
                    ].filter((g) => g.slotGroup.length > 0).map(({ label, slotGroup }) => (
                      <div key={label}>
                        <p className="text-xs mb-1.5" style={{ color: "#555" }}>{label}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {slotGroup.map((slot) => {
                            const isSelected = selectedSlot === slot.datetime;
                            return (
                              <button
                                key={slot.datetime}
                                disabled={!slot.available}
                                onClick={() => setSelectedSlot(slot.datetime)}
                                className="px-2.5 py-1 rounded text-xs font-semibold"
                                style={{
                                  background: isSelected
                                    ? "var(--color-gold)"
                                    : slot.available
                                    ? "rgba(201,168,76,0.08)"
                                    : "#0d0d0d",
                                  color: isSelected
                                    ? "#000"
                                    : slot.available
                                    ? "var(--color-gold)"
                                    : "#333",
                                  border: `1px solid ${isSelected ? "transparent" : slot.available ? "rgba(201,168,76,0.3)" : "#1a1a1a"}`,
                                  textDecoration: slot.available ? "none" : "line-through",
                                  cursor: slot.available ? "pointer" : "not-allowed",
                                }}
                              >
                                {slot.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {!loadingSlots && slots.length === 0 && (
                  <p className="text-xs" style={{ color: "#555" }}>No slots available for this date.</p>
                )}
              </div>
            )}

            {/* Contact details */}
            <div className="space-y-2 mb-3">
              <label className="text-xs font-semibold tracking-widest uppercase block" style={{ color: "var(--color-text-dim)" }}>Contact Details</label>
              <input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Full name *" style={inputStyle} />
              <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="Email address *" style={inputStyle} />
              <input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="Phone number" style={inputStyle} />
            </div>

            {/* Notes */}
            <div className="mb-4">
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)…" rows={2} className="resize-none" style={inputStyle} />
            </div>

            {bookError && (
              <div className="rounded p-2 mb-3 text-xs" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                {bookError}
              </div>
            )}

            {bookSuccess && (
              <div className="rounded p-2 mb-3 text-xs" style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}>
                ✓ {bookSuccess}
              </div>
            )}

            <button
              onClick={handleBook}
              disabled={booking || !bookLotId || !selectedSlot || !contactName.trim() || !contactEmail.trim()}
              className="w-full py-2.5 rounded text-sm font-bold tracking-widest uppercase"
              style={{
                background: "var(--color-gold)",
                color: "#000",
                opacity: booking || !bookLotId || !selectedSlot || !contactName.trim() || !contactEmail.trim() ? 0.4 : 1,
              }}
            >
              {booking ? "Booking…" : "📅 Book Viewing"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ViewingsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full" style={{ color: "var(--color-text-dim)" }}>Loading…</div>}>
      <ViewingsPageInner />
    </Suspense>
  );
}
