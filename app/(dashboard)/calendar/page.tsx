"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Lot } from "@/lib/schema";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EventWithCount {
  id: string;
  title: string;
  description: string | null;
  eventType: string;
  status: string;
  location: string | null;
  zoomLink: string | null;
  eventDate: string;
  endTime: string | null;
  maxCapacity: number | null;
  pricePence: number | null;
  ticketLink: string | null;
  lotId: string | null;
  socialPostGenerated: boolean;
  emailSent: boolean;
  createdAt: string;
  registrantCount: number;
}

interface EventReg {
  id: string;
  eventId: string;
  name: string;
  email: string;
  phone: string | null;
  investorType: string | null;
  source: string;
  status: string;
  notes: string | null;
  registeredAt: string;
}

interface EventForm {
  title: string;
  eventType: string;
  eventDate: string;
  endTime: string;
  location: string;
  zoomLink: string;
  maxCapacity: string;
  pricePence: string;
  ticketLink: string;
  lotId: string;
  description: string;
  notes: string;
  agendaItems: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EVENT_TYPES = [
  { value: "webinar", label: "Webinar", color: "#3b82f6" },
  { value: "auction", label: "Auction", color: "#c9a84c" },
  { value: "networking", label: "Networking", color: "#22c55e" },
  { value: "workshop", label: "Workshop", color: "#a855f7" },
  { value: "viewing", label: "Viewing", color: "#f97316" },
  { value: "conference", label: "Conference", color: "#ef4444" },
];

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  draft: { bg: "rgba(156,163,175,0.15)", color: "#9ca3af" },
  upcoming: { bg: "rgba(59,130,246,0.15)", color: "#3b82f6" },
  live: { bg: "rgba(239,68,68,0.15)", color: "#ef4444" },
  completed: { bg: "rgba(34,197,94,0.15)", color: "#22c55e" },
  cancelled: { bg: "rgba(156,163,175,0.1)", color: "#6b7280" },
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const EMPTY_FORM: EventForm = {
  title: "",
  eventType: "webinar",
  eventDate: "",
  endTime: "",
  location: "",
  zoomLink: "",
  maxCapacity: "",
  pricePence: "0",
  ticketLink: "",
  lotId: "",
  description: "",
  notes: "",
  agendaItems: ["", "", ""],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTypeColor(type: string): string {
  return EVENT_TYPES.find((t) => t.value === type)?.color ?? "#888";
}

function formatEventDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }) + " · " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function formatPrice(pence: number | null): string {
  if (!pence) return "Free";
  return `£${(pence / 100).toFixed(0)}/person`;
}

function buildCalendarGrid(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const grid: (Date | null)[] = [];
  for (let i = 0; i < firstDay; i++) grid.push(null);
  for (let d = 1; d <= daysInMonth; d++) grid.push(new Date(year, month, d));
  while (grid.length < 42) grid.push(null);
  return grid;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_COLORS[status] ?? STATUS_COLORS.draft;
  return (
    <span
      className="px-2 py-0.5 rounded-full text-xs font-semibold capitalize"
      style={{ background: s.bg, color: s.color }}
    >
      {status}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  const color = getTypeColor(type);
  const label = EVENT_TYPES.find((t) => t.value === type)?.label ?? type;
  return (
    <span
      className="px-2 py-0.5 rounded-full text-xs font-semibold capitalize"
      style={{ background: `${color}22`, color }}
    >
      {label}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CalendarPage() {
  const router = useRouter();

  // View state
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  // Data
  const [eventsData, setEventsData] = useState<EventWithCount[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventWithCount | null>(null);
  const [form, setForm] = useState<EventForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{ emailSubject: string; socialHook: string; agenda: string[] } | null>(null);

  // Registrants panel
  const [panelEvent, setPanelEvent] = useState<EventWithCount | null>(null);
  const [registrations, setRegistrations] = useState<EventReg[]>([]);
  const [loadingRegs, setLoadingRegs] = useState(false);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/events");
      const data = await res.json() as EventWithCount[];
      if (Array.isArray(data)) setEventsData(data);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    void fetchEvents();
    fetch("/api/lots")
      .then((r) => r.json())
      .then((d: Lot[]) => { if (Array.isArray(d)) setLots(d); })
      .catch(() => null);
  }, [fetchEvents]);

  // Stats
  const now = new Date();
  const upcoming = eventsData.filter((e) => e.status === "upcoming" || e.status === "live");
  const totalRegistrants = eventsData.reduce((s, e) => s + (e.registrantCount ?? 0), 0);
  const thisMonth = eventsData.filter((e) => {
    const d = new Date(e.eventDate);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const revenue = eventsData.reduce((s, e) => {
    return s + ((e.pricePence ?? 0) / 100) * (e.registrantCount ?? 0);
  }, 0);

  // Calendar grid
  const grid = buildCalendarGrid(currentMonth.getFullYear(), currentMonth.getMonth());

  function getEventsForDay(day: Date) {
    return eventsData.filter((e) => isSameDay(new Date(e.eventDate), day));
  }

  const dayEvents = selectedDay ? getEventsForDay(selectedDay) : [];

  // Modal helpers
  function openCreate() {
    setEditingEvent(null);
    setForm(EMPTY_FORM);
    setAiSuggestion(null);
    setShowModal(true);
  }

  function openEdit(ev: EventWithCount) {
    setEditingEvent(ev);
    const d = new Date(ev.eventDate);
    const toLocal = (iso: string | null) => {
      if (!iso) return "";
      const dt = new Date(iso);
      return dt.toISOString().slice(0, 16);
    };
    setForm({
      title: ev.title,
      eventType: ev.eventType,
      eventDate: toLocal(ev.eventDate),
      endTime: toLocal(ev.endTime),
      location: ev.location ?? "",
      zoomLink: ev.zoomLink ?? "",
      maxCapacity: ev.maxCapacity?.toString() ?? "",
      pricePence: ((ev.pricePence ?? 0) / 100).toString(),
      ticketLink: ev.ticketLink ?? "",
      lotId: ev.lotId ?? "",
      description: ev.description ?? "",
      notes: "",
      agendaItems: ["", "", ""],
    });
    setAiSuggestion(null);
    setShowModal(true);
  }

  function setField(key: keyof EventForm, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setAgendaItem(i: number, value: string) {
    setForm((prev) => {
      const items = [...prev.agendaItems];
      items[i] = value;
      return { ...prev, agendaItems: items };
    });
  }

  function addAgendaItem() {
    setForm((prev) => ({ ...prev, agendaItems: [...prev.agendaItems, ""] }));
  }

  function removeAgendaItem(i: number) {
    setForm((prev) => ({
      ...prev,
      agendaItems: prev.agendaItems.filter((_, idx) => idx !== i),
    }));
  }

  async function handleAiGenerate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/events/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          event_type: form.eventType,
          event_date: form.eventDate,
          location: form.location,
          price: form.pricePence,
          notes: form.notes,
        }),
      });
      const data = await res.json() as { description: string; emailSubject: string; socialHook: string; agenda: string[] };
      setField("description", data.description ?? "");
      const filledAgenda = (data.agenda ?? []).map((a) => a);
      while (filledAgenda.length < 3) filledAgenda.push("");
      setForm((prev) => ({ ...prev, agendaItems: filledAgenda }));
      setAiSuggestion({ emailSubject: data.emailSubject, socialHook: data.socialHook, agenda: data.agenda });
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave(status: "draft" | "upcoming") {
    if (!form.title.trim() || !form.eventDate) return;
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        event_type: form.eventType,
        status,
        event_date: form.eventDate,
        end_time: form.endTime || undefined,
        location: form.location || undefined,
        zoom_link: form.zoomLink || undefined,
        max_capacity: form.maxCapacity ? parseInt(form.maxCapacity) : undefined,
        price_pence: form.pricePence ? Math.round(parseFloat(form.pricePence) * 100) : 0,
        ticket_link: form.ticketLink || undefined,
        lot_id: form.lotId || undefined,
        description: form.description || undefined,
      };

      if (editingEvent) {
        await fetch(`/api/events/${editingEvent.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      await fetchEvents();
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(ev: EventWithCount) {
    if (!confirm(`Delete "${ev.title}"? This cannot be undone.`)) return;
    await fetch(`/api/events/${ev.id}`, { method: "DELETE" });
    await fetchEvents();
  }

  async function handleCancel(ev: EventWithCount) {
    await fetch(`/api/events/${ev.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    });
    await fetchEvents();
  }

  // Registrants panel
  async function openRegistrantsPanel(ev: EventWithCount) {
    setPanelEvent(ev);
    setLoadingRegs(true);
    setRegistrations([]);
    try {
      const res = await fetch(`/api/events/${ev.id}/registrations`);
      const data = await res.json() as { registrations: EventReg[] };
      setRegistrations(data.registrations ?? []);
    } finally {
      setLoadingRegs(false);
    }
  }

  async function updateRegStatus(regId: string, status: string, eventId: string) {
    await fetch(`/api/events/${eventId}/registrations`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registrationId: regId, status }),
    });
    if (panelEvent) await openRegistrantsPanel(panelEvent);
  }

  function exportRegsCsv() {
    const header = "name,email,phone,investor_type,source,status,registered_at";
    const rows = registrations.map(
      (r) => `${r.name},${r.email},${r.phone ?? ""},${r.investorType ?? ""},${r.source},${r.status},${r.registeredAt}`
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `registrants-${panelEvent?.title ?? "event"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b" style={{ borderColor: "#1a1a1a", flexShrink: 0 }}>
        <div>
          <h1 className="text-xl font-serif tracking-widest uppercase" style={{ color: "var(--color-gold)", fontFamily: "Georgia, serif" }}>
            Events Manager
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-dim)" }}>
            Webinars · Auctions · Networking · Workshops
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView(view === "calendar" ? "list" : "calendar")}
            className="px-3 py-1.5 rounded text-xs font-semibold tracking-widest uppercase"
            style={{ background: "#111", border: "1px solid #222", color: "var(--color-text-dim)" }}
          >
            {view === "calendar" ? "📋 List View" : "📅 Calendar View"}
          </button>
          <button
            onClick={openCreate}
            className="px-3 py-1.5 rounded text-xs font-bold tracking-widest uppercase"
            style={{ background: "var(--color-gold)", color: "#000" }}
          >
            + Create Event
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 px-6 py-3 border-b" style={{ borderColor: "#1a1a1a", flexShrink: 0 }}>
        {[
          { label: "Upcoming Events", value: upcoming.length },
          { label: "Total Registrants", value: totalRegistrants },
          { label: "This Month", value: thisMonth.length },
          { label: "Revenue", value: `£${revenue.toLocaleString("en-GB", { minimumFractionDigits: 0 })}` },
        ].map((s) => (
          <div key={s.label} className="rounded p-3" style={{ background: "#111", border: "1px solid #1a1a1a" }}>
            <p className="text-lg font-bold" style={{ color: "var(--color-gold)" }}>{s.value}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-dim)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── CALENDAR VIEW ────────────────────────────────────── */}
        {view === "calendar" && (
          <>
            <div className="flex-1 flex flex-col overflow-hidden p-4">
              {/* Month nav */}
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                  className="px-3 py-1.5 rounded text-sm"
                  style={{ background: "#111", border: "1px solid #222", color: "var(--color-text-dim)" }}
                >
                  ←
                </button>
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-semibold" style={{ color: "#e0e0e0" }}>
                    {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </h2>
                  <button
                    onClick={() => setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1))}
                    className="px-2 py-0.5 rounded text-xs"
                    style={{ background: "rgba(201,168,76,0.12)", color: "var(--color-gold)", border: "1px solid rgba(201,168,76,0.2)" }}
                  >
                    Today
                  </button>
                </div>
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                  className="px-3 py-1.5 rounded text-sm"
                  style={{ background: "#111", border: "1px solid #222", color: "var(--color-text-dim)" }}
                >
                  →
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 mb-1">
                {DAYS.map((d) => (
                  <div key={d} className="text-center text-xs font-semibold py-1" style={{ color: "var(--color-text-dim)" }}>
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 flex-1 gap-px" style={{ background: "#1a1a1a" }}>
                {grid.map((day, i) => {
                  if (!day) {
                    return <div key={i} style={{ background: "#0a0a0a" }} />;
                  }
                  const dayEvs = getEventsForDay(day);
                  const isToday = isSameDay(day, today);
                  const isSelected = selectedDay && isSameDay(day, selectedDay);
                  return (
                    <div
                      key={i}
                      onClick={() => setSelectedDay(isSelected ? null : day)}
                      className="p-1.5 cursor-pointer overflow-hidden"
                      style={{
                        background: isSelected ? "rgba(201,168,76,0.08)" : "#0d0d0d",
                        border: isSelected ? "1px solid rgba(201,168,76,0.3)" : "1px solid transparent",
                        minHeight: 72,
                      }}
                    >
                      <span
                        className="text-xs font-semibold"
                        style={{
                          color: isToday ? "var(--color-gold)" : "#666",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: isToday ? 22 : "auto",
                          height: isToday ? 22 : "auto",
                          borderRadius: isToday ? "50%" : 0,
                          background: isToday ? "rgba(201,168,76,0.2)" : "transparent",
                        }}
                      >
                        {day.getDate()}
                      </span>
                      <div className="mt-1 space-y-0.5">
                        {dayEvs.slice(0, 3).map((ev) => (
                          <div
                            key={ev.id}
                            className="truncate rounded px-1 text-xs"
                            style={{
                              background: `${getTypeColor(ev.eventType)}22`,
                              color: getTypeColor(ev.eventType),
                              fontSize: 10,
                              lineHeight: "16px",
                            }}
                          >
                            {ev.title}
                          </div>
                        ))}
                        {dayEvs.length > 3 && (
                          <div className="text-xs" style={{ color: "#555", fontSize: 10 }}>
                            +{dayEvs.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Day detail side panel */}
            {selectedDay && (
              <div
                className="flex flex-col border-l overflow-y-auto"
                style={{ width: 320, borderColor: "#1a1a1a", flexShrink: 0 }}
              >
                <div className="px-4 py-3 border-b" style={{ borderColor: "#1a1a1a" }}>
                  <p className="text-sm font-semibold" style={{ color: "#e0e0e0" }}>
                    {selectedDay.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--color-text-dim)" }}>
                    {dayEvents.length === 0 ? "No events" : `${dayEvents.length} event${dayEvents.length > 1 ? "s" : ""}`}
                  </p>
                </div>
                <div className="flex-1 p-4 space-y-3">
                  {dayEvents.length === 0 ? (
                    <p className="text-xs" style={{ color: "#444" }}>No events on this day.</p>
                  ) : (
                    dayEvents.map((ev) => (
                      <div key={ev.id} className="rounded p-3" style={{ background: "#111", border: "1px solid #1a1a1a" }}>
                        <TypeBadge type={ev.eventType} />
                        <p className="text-sm font-semibold mt-2" style={{ color: "#e0e0e0" }}>{ev.title}</p>
                        <p className="text-xs mt-1" style={{ color: "var(--color-text-dim)" }}>
                          {new Date(ev.eventDate).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                          {ev.endTime && " — " + new Date(ev.endTime).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--color-text-dim)" }}>
                          {ev.location ?? "Location TBC"}
                        </p>
                        <p className="text-xs mt-1" style={{ color: "var(--color-gold)" }}>
                          {ev.registrantCount} registered
                        </p>
                        <div className="flex gap-1 mt-2">
                          <button
                            onClick={() => openRegistrantsPanel(ev)}
                            className="px-2 py-1 rounded text-xs"
                            style={{ background: "#1a1a1a", color: "var(--color-text-dim)" }}
                          >
                            👥
                          </button>
                          <button
                            onClick={() => openEdit(ev)}
                            className="px-2 py-1 rounded text-xs"
                            style={{ background: "#1a1a1a", color: "var(--color-text-dim)" }}
                          >
                            ✏️
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── LIST VIEW ──────────────────────────────────────────── */}
        {view === "list" && (
          <div className="flex-1 overflow-y-auto p-6">
            {/* Upcoming */}
            <section className="mb-8">
              <h2 className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--color-text-dim)" }}>
                Upcoming Events
              </h2>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {eventsData
                  .filter((e) => e.status === "upcoming" || e.status === "live" || e.status === "draft")
                  .map((ev) => (
                    <EventCard
                      key={ev.id}
                      ev={ev}
                      onEdit={() => openEdit(ev)}
                      onRegistrants={() => openRegistrantsPanel(ev)}
                      onSocial={() => router.push(`/social?lotId=${ev.lotId ?? ""}`)}
                      onCancel={() => handleCancel(ev)}
                      onDelete={() => handleDelete(ev)}
                    />
                  ))}
              </div>
            </section>

            {/* Past */}
            {eventsData.some((e) => e.status === "completed" || e.status === "cancelled") && (
              <section>
                <h2 className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--color-text-dim)" }}>
                  Past Events
                </h2>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {eventsData
                    .filter((e) => e.status === "completed" || e.status === "cancelled")
                    .map((ev) => (
                      <EventCard
                        key={ev.id}
                        ev={ev}
                        onEdit={() => openEdit(ev)}
                        onRegistrants={() => openRegistrantsPanel(ev)}
                        onSocial={() => router.push(`/social`)}
                        onCancel={() => handleCancel(ev)}
                        onDelete={() => handleDelete(ev)}
                      />
                    ))}
                </div>
              </section>
            )}

            {eventsData.length === 0 && (
              <p className="text-sm" style={{ color: "#444" }}>No events yet. Create your first event.</p>
            )}
          </div>
        )}

        {/* ── REGISTRANTS PANEL ─────────────────────────────────── */}
        {panelEvent && (
          <>
            <div
              className="fixed inset-0 z-40"
              style={{ background: "rgba(0,0,0,0.5)" }}
              onClick={() => setPanelEvent(null)}
            />
            <div
              className="fixed right-0 top-0 bottom-0 z-50 flex flex-col overflow-hidden"
              style={{ width: 480, background: "var(--color-surface)", borderLeft: "1px solid #1a1a1a" }}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#1a1a1a" }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#e0e0e0" }}>{panelEvent.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--color-text-dim)" }}>Registrants</p>
                </div>
                <button onClick={() => setPanelEvent(null)} style={{ color: "var(--color-text-dim)" }}>✕</button>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-4 gap-2 px-5 py-3 border-b" style={{ borderColor: "#1a1a1a" }}>
                {["registered", "attended", "no_show", "cancelled"].map((s) => {
                  const cnt = registrations.filter((r) => r.status === s).length;
                  return (
                    <div key={s} className="text-center">
                      <p className="text-lg font-bold" style={{ color: "var(--color-gold)" }}>{cnt}</p>
                      <p className="text-xs capitalize" style={{ color: "var(--color-text-dim)" }}>{s.replace("_", " ")}</p>
                    </div>
                  );
                })}
              </div>

              {/* Table */}
              <div className="flex-1 overflow-y-auto">
                {loadingRegs ? (
                  <p className="p-5 text-sm" style={{ color: "#444" }}>Loading…</p>
                ) : registrations.length === 0 ? (
                  <p className="p-5 text-sm" style={{ color: "#444" }}>No registrations yet.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: "1px solid #1a1a1a" }}>
                        {["Name", "Email", "Type", "Status", "Actions"].map((h) => (
                          <th key={h} className="text-left px-4 py-2 text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--color-text-dim)" }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {registrations.map((r) => (
                        <tr key={r.id} style={{ borderBottom: "1px solid #111" }}>
                          <td className="px-4 py-2" style={{ color: "#e0e0e0" }}>{r.name}</td>
                          <td className="px-4 py-2 text-xs" style={{ color: "var(--color-text-dim)" }}>{r.email}</td>
                          <td className="px-4 py-2 text-xs" style={{ color: "var(--color-text-dim)" }}>{r.investorType ?? "—"}</td>
                          <td className="px-4 py-2">
                            <span className="text-xs capitalize" style={{ color: r.status === "attended" ? "#22c55e" : r.status === "no_show" ? "#ef4444" : "var(--color-text-dim)" }}>
                              {r.status.replace("_", " ")}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex gap-1">
                              <button onClick={() => updateRegStatus(r.id, "attended", panelEvent.id)} title="Attended" className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}>✅</button>
                              <button onClick={() => updateRegStatus(r.id, "no_show", panelEvent.id)} title="No Show" className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>🚫</button>
                              <button onClick={() => updateRegStatus(r.id, "cancelled", panelEvent.id)} title="Cancel" className="text-xs px-1.5 py-0.5 rounded" style={{ background: "#1a1a1a", color: "#666" }}>❌</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="px-5 py-4 border-t flex gap-2" style={{ borderColor: "#1a1a1a" }}>
                <button
                  onClick={exportRegsCsv}
                  className="px-3 py-1.5 rounded text-xs font-semibold tracking-widest uppercase"
                  style={{ background: "#111", border: "1px solid #333", color: "var(--color-text-dim)" }}
                >
                  Export CSV
                </button>
                <a
                  href={`/events/${panelEvent.id}/register`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded text-xs font-semibold tracking-widest uppercase"
                  style={{ background: "rgba(201,168,76,0.12)", color: "var(--color-gold)", border: "1px solid rgba(201,168,76,0.3)" }}
                >
                  🔗 Public Reg Link
                </a>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── CREATE / EDIT MODAL ────────────────────────────────────── */}
      {showModal && (
        <>
          <div
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.7)" }}
            onClick={() => setShowModal(false)}
          />
          <div
            className="fixed inset-y-4 left-1/2 z-50 flex flex-col overflow-hidden rounded-lg"
            style={{ width: 600, transform: "translateX(-50%)", background: "var(--color-surface)", border: "1px solid #222" }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#1a1a1a" }}>
              <h2 className="text-sm font-semibold tracking-widest uppercase" style={{ color: "var(--color-gold)" }}>
                {editingEvent ? "Edit Event" : "Create Event"}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ color: "var(--color-text-dim)" }}>✕</button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {/* Title */}
              <Field label="Title *">
                <input value={form.title} onChange={(e) => setField("title", e.target.value)} placeholder="Event title" className="w-full rounded px-3 py-2 text-sm" style={inputStyle} />
              </Field>

              {/* Type + Date */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Event Type *">
                  <select value={form.eventType} onChange={(e) => setField("eventType", e.target.value)} className="w-full rounded px-3 py-2 text-sm" style={inputStyle}>
                    {EVENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </Field>
                <Field label="Date & Time *">
                  <input type="datetime-local" value={form.eventDate} onChange={(e) => setField("eventDate", e.target.value)} className="w-full rounded px-3 py-2 text-sm" style={inputStyle} />
                </Field>
              </div>

              {/* End time + Location */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="End Time">
                  <input type="datetime-local" value={form.endTime} onChange={(e) => setField("endTime", e.target.value)} className="w-full rounded px-3 py-2 text-sm" style={inputStyle} />
                </Field>
                <Field label="Location *">
                  <input value={form.location} onChange={(e) => setField("location", e.target.value)} placeholder="Zoom / Address / Venue" className="w-full rounded px-3 py-2 text-sm" style={inputStyle} />
                </Field>
              </div>

              {/* Zoom link (shown when zoom/online) */}
              {form.location.toLowerCase().includes("zoom") && (
                <Field label="Zoom Link">
                  <input type="url" value={form.zoomLink} onChange={(e) => setField("zoomLink", e.target.value)} placeholder="https://zoom.us/j/..." className="w-full rounded px-3 py-2 text-sm" style={inputStyle} />
                </Field>
              )}

              {/* Capacity + Price + Ticket */}
              <div className="grid grid-cols-3 gap-3">
                <Field label="Max Capacity">
                  <input type="number" value={form.maxCapacity} onChange={(e) => setField("maxCapacity", e.target.value)} placeholder="Unlimited" className="w-full rounded px-3 py-2 text-sm" style={inputStyle} />
                </Field>
                <Field label="Ticket Price £">
                  <input type="number" value={form.pricePence} onChange={(e) => setField("pricePence", e.target.value)} placeholder="0 = free" className="w-full rounded px-3 py-2 text-sm" style={inputStyle} />
                </Field>
                <Field label="Ticket Link">
                  <input type="url" value={form.ticketLink} onChange={(e) => setField("ticketLink", e.target.value)} placeholder="https://..." className="w-full rounded px-3 py-2 text-sm" style={inputStyle} />
                </Field>
              </div>

              {/* Lot selector */}
              <Field label="Link to Lot (optional)">
                <select value={form.lotId} onChange={(e) => setField("lotId", e.target.value)} className="w-full rounded px-3 py-2 text-sm" style={inputStyle}>
                  <option value="">No specific lot</option>
                  {lots.map((l) => (
                    <option key={l.id} value={l.id}>{l.address}</option>
                  ))}
                </select>
              </Field>

              {/* Notes */}
              <Field label="Notes (for AI)">
                <input value={form.notes} onChange={(e) => setField("notes", e.target.value)} placeholder="e.g. keynote speakers, special guests…" className="w-full rounded px-3 py-2 text-sm" style={inputStyle} />
              </Field>

              {/* AI generate button */}
              <button
                onClick={handleAiGenerate}
                disabled={generating || !form.title.trim()}
                className="w-full py-2 rounded text-sm font-bold tracking-widest uppercase"
                style={{
                  background: generating ? "#333" : "rgba(201,168,76,0.12)",
                  color: generating ? "#888" : "var(--color-gold)",
                  border: "1px solid rgba(201,168,76,0.3)",
                  opacity: !form.title.trim() ? 0.4 : 1,
                }}
              >
                {generating ? "ARIA is writing…" : "🤖 AI Write Description"}
              </button>

              {/* AI suggestions */}
              {aiSuggestion && (
                <div className="rounded p-3 text-xs space-y-1" style={{ background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.2)" }}>
                  <p style={{ color: "var(--color-gold)" }}>✨ Suggested email subject:</p>
                  <p style={{ color: "#c0c0c0" }}>{aiSuggestion.emailSubject}</p>
                  <p className="mt-1" style={{ color: "var(--color-gold)" }}>Social hook:</p>
                  <p style={{ color: "#c0c0c0" }}>{aiSuggestion.socialHook}</p>
                </div>
              )}

              {/* Description */}
              <Field label="Description">
                <textarea value={form.description} onChange={(e) => setField("description", e.target.value)} rows={5} placeholder="Compelling event description…" className="w-full rounded px-3 py-2 text-sm resize-none" style={inputStyle} />
              </Field>

              {/* Agenda */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--color-text-dim)" }}>Agenda</label>
                  <button onClick={addAgendaItem} className="text-xs px-2 py-0.5 rounded" style={{ background: "#1a1a1a", color: "var(--color-text-dim)" }}>+ Add item</button>
                </div>
                <div className="space-y-1.5">
                  {form.agendaItems.map((item, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-xs pt-2.5 w-4 flex-shrink-0" style={{ color: "#555" }}>{i + 1}.</span>
                      <input
                        value={item}
                        onChange={(e) => setAgendaItem(i, e.target.value)}
                        placeholder={`Agenda item ${i + 1}`}
                        className="flex-1 rounded px-3 py-1.5 text-sm"
                        style={inputStyle}
                      />
                      <button onClick={() => removeAgendaItem(i)} className="text-xs px-1.5 rounded" style={{ background: "#1a1a1a", color: "#666" }}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-2 px-6 py-4 border-t" style={{ borderColor: "#1a1a1a" }}>
              <button
                onClick={() => handleSave("draft")}
                disabled={saving || !form.title.trim() || !form.eventDate}
                className="px-4 py-2 rounded text-sm font-semibold tracking-widest uppercase"
                style={{ background: "#111", border: "1px solid #333", color: "var(--color-text-dim)", opacity: saving ? 0.5 : 1 }}
              >
                Save as Draft
              </button>
              <button
                onClick={() => handleSave("upcoming")}
                disabled={saving || !form.title.trim() || !form.eventDate}
                className="flex-1 py-2 rounded text-sm font-bold tracking-widest uppercase"
                style={{ background: "var(--color-gold)", color: "#000", opacity: saving ? 0.5 : 1 }}
              >
                {saving ? "Saving…" : editingEvent ? "Save Changes" : "Save & Publish"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── EventCard component ───────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: "#0a0a0a",
  border: "1px solid #222",
  color: "#e0e0e0",
  outline: "none",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold tracking-widest uppercase mb-1 block" style={{ color: "var(--color-text-dim)" }}>{label}</label>
      {children}
    </div>
  );
}

interface EventCardProps {
  ev: EventWithCount;
  onEdit: () => void;
  onRegistrants: () => void;
  onSocial: () => void;
  onCancel: () => void;
  onDelete: () => void;
}

function EventCard({ ev, onEdit, onRegistrants, onSocial, onCancel, onDelete }: EventCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const fillPct = ev.maxCapacity ? Math.min(100, Math.round((ev.registrantCount / ev.maxCapacity) * 100)) : 0;

  return (
    <div className="rounded-lg p-4" style={{ background: "#111", border: "1px solid #1a1a1a" }}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex gap-2 flex-wrap">
          <TypeBadge type={ev.eventType} />
          <StatusBadge status={ev.status} />
        </div>
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="text-xs px-2 py-1 rounded" style={{ background: "#1a1a1a", color: "var(--color-text-dim)" }}>⋮</button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-7 z-20 rounded shadow-lg" style={{ background: "#1a1a1a", border: "1px solid #333", minWidth: 140 }}>
                <button onClick={() => { onCancel(); setShowMenu(false); }} className="block w-full text-left px-4 py-2 text-xs" style={{ color: "var(--color-text-dim)" }}>Cancel Event</button>
                <button onClick={() => { onDelete(); setShowMenu(false); }} className="block w-full text-left px-4 py-2 text-xs" style={{ color: "#ef4444" }}>Delete</button>
              </div>
            </>
          )}
        </div>
      </div>

      <h3 className="text-base font-semibold mb-1" style={{ color: "#e0e0e0" }}>{ev.title}</h3>
      <p className="text-xs mb-0.5" style={{ color: "var(--color-gold)" }}>{formatEventDate(ev.eventDate)}</p>
      <p className="text-xs mb-2" style={{ color: "var(--color-text-dim)" }}>
        {ev.location ?? "Location TBC"} · {formatPrice(ev.pricePence)}
      </p>

      {/* Registrants count + progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs" style={{ color: "var(--color-text-dim)" }}>
            {ev.registrantCount} registered{ev.maxCapacity ? ` / ${ev.maxCapacity}` : ""}
          </span>
          {ev.maxCapacity && (
            <span className="text-xs" style={{ color: fillPct >= 90 ? "#ef4444" : "var(--color-text-dim)" }}>{fillPct}%</span>
          )}
        </div>
        {ev.maxCapacity && (
          <div className="w-full rounded-full h-1" style={{ background: "#1a1a1a" }}>
            <div className="h-1 rounded-full" style={{ width: `${fillPct}%`, background: fillPct >= 90 ? "#ef4444" : "var(--color-gold)" }} />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-1.5 flex-wrap">
        <button onClick={onRegistrants} className="px-2.5 py-1.5 rounded text-xs font-semibold" style={{ background: "#1a1a1a", color: "var(--color-text-dim)" }}>👥 Registrants</button>
        <button onClick={onSocial} className="px-2.5 py-1.5 rounded text-xs font-semibold" style={{ background: "#1a1a1a", color: "var(--color-text-dim)" }}>📱 Post</button>
        <button onClick={onEdit} className="px-2.5 py-1.5 rounded text-xs font-semibold" style={{ background: "#1a1a1a", color: "var(--color-text-dim)" }}>✏️ Edit</button>
      </div>
    </div>
  );
}

