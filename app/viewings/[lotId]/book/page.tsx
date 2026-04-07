"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useParams } from "next/navigation";

interface LotInfo {
  id: string;
  address: string;
  guidePrice: number;
  propertyType: string | null;
  bedrooms: number | null;
  pipelineStage: string;
}

interface Slot {
  datetime: string;
  available: boolean;
  label: string;
  weekend: boolean;
}

interface SlotsByDay {
  date: string;
  label: string;
  slots: Slot[];
}

function formatGuidePrice(pence: number): string {
  if (pence >= 1_000_000) return `£${(pence / 1_000_000).toFixed(2)}m`;
  if (pence >= 1_000) return `£${(pence / 1_000).toFixed(0)}k`;
  return `£${pence.toLocaleString()}`;
}

function groupSlotsByDay(slots: Slot[]): SlotsByDay[] {
  const map = new Map<string, Slot[]>();
  for (const slot of slots) {
    const d = slot.datetime.slice(0, 10);
    if (!map.has(d)) map.set(d, []);
    map.get(d)!.push(slot);
  }
  return Array.from(map.entries()).map(([date, daySlots]) => {
    const d = new Date(date + "T00:00:00Z");
    const label = d.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: "UTC",
    });
    return { date, label, slots: daySlots };
  });
}

function BookingPageInner() {
  const params = useParams();
  const lotId = typeof params.lotId === "string" ? params.lotId : "";

  const [lot, setLot] = useState<LotInfo | null>(null);
  const [lotError, setLotError] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const fetchSlots = useCallback(async (date?: string) => {
    setSlotsLoading(true);
    setSelectedSlot("");
    try {
      const url = date
        ? `/api/viewings/slots?lot_id=${lotId}&date=${date}`
        : `/api/viewings/slots?lot_id=${lotId}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json() as Slot[];
      setSlots(data);
    } catch {
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, [lotId]);

  useEffect(() => {
    if (!lotId) return;

    fetch(`/api/public/lots/${lotId}`)
      .then((r) => r.json())
      .then((data: LotInfo | { error: string }) => {
        if ("error" in data) setLotError(data.error);
        else setLot(data);
      })
      .catch(() => setLotError("Property not found"));

    void fetchSlots();
  }, [lotId, fetchSlots]);

  async function handleBook() {
    setError("");
    if (!selectedSlot) { setError("Please select a time slot"); return; }
    if (!name.trim()) { setError("Please enter your name"); return; }
    if (!email.trim()) { setError("Please enter your email"); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/viewings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lot_id: lotId,
          contact_name: name.trim(),
          contact_email: email.trim(),
          contact_phone: phone.trim() || undefined,
          viewing_date: selectedSlot,
        }),
      });
      const data = await res.json() as { error?: string; message?: string };
      if (!res.ok) {
        setError(data.message ?? data.error ?? "Failed to book viewing");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const gold = "#c9a84c";

  if (lotError) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#0d0d0d", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif" }}>
        <div style={{ textAlign: "center", color: "#888" }}>
          <p style={{ fontSize: "14px" }}>Property not found</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#0d0d0d", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif", padding: "24px" }}>
        <div style={{ maxWidth: "520px", width: "100%", backgroundColor: "#0a0a0a", border: `1px solid ${gold}`, borderRadius: "8px", padding: "48px 36px", textAlign: "center" }}>
          <div style={{ color: "#22c55e", fontSize: "48px", marginBottom: "16px" }}>✓</div>
          <h2 style={{ color: gold, fontSize: "22px", letterSpacing: "4px", textTransform: "uppercase", marginBottom: "12px" }}>Viewing Confirmed</h2>
          <p style={{ color: "#c0c0c0", fontSize: "15px", lineHeight: "1.7", marginBottom: "24px" }}>
            Thank you, <strong style={{ color: "#e0e0e0" }}>{name}</strong>. Your viewing has been confirmed and a confirmation email has been sent to <strong style={{ color: gold }}>{email}</strong>.
          </p>
          {lot && (
            <div style={{ backgroundColor: "#111", border: "1px solid #1a1a1a", borderLeft: `3px solid ${gold}`, borderRadius: "6px", padding: "16px 20px", textAlign: "left" }}>
              <p style={{ color: "#888", fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "4px" }}>Property</p>
              <p style={{ color: "#e0e0e0", fontSize: "15px", fontWeight: "bold", marginBottom: "12px" }}>{lot.address}</p>
              <p style={{ color: "#888", fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "4px" }}>Date & Time</p>
              <p style={{ color: gold, fontSize: "14px", fontWeight: "bold" }}>
                {new Date(selectedSlot).toLocaleString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          )}
          <p style={{ color: "#555", fontSize: "12px", marginTop: "24px" }}>
            Questions? WhatsApp Sam: <span style={{ color: gold }}>07454 753318</span>
          </p>
        </div>
      </div>
    );
  }

  const grouped = groupSlotsByDay(slots);
  const availableDates = Array.from(new Set(slots.filter((s) => s.available).map((s) => s.datetime.slice(0, 10))));

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0d0d0d", fontFamily: "Georgia, serif" }}>
      {/* Header */}
      <div style={{ backgroundColor: "#000", padding: "24px 36px", textAlign: "center", borderBottom: `2px solid ${gold}` }}>
        <h1 style={{ color: gold, fontSize: "26px", letterSpacing: "6px", textTransform: "uppercase", margin: "0 0 4px 0" }}>MIDAS</h1>
        <p style={{ color: "#555", fontSize: "9px", letterSpacing: "3px", textTransform: "uppercase", margin: 0 }}>PROPERTY AUCTIONS</p>
      </div>

      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "32px 20px 80px" }}>
        <h2 style={{ color: "#e0e0e0", fontSize: "18px", fontWeight: "bold", marginBottom: "6px", letterSpacing: "1px" }}>Book a Viewing</h2>

        {/* Lot info */}
        {lot ? (
          <div style={{ backgroundColor: "#0f0f0f", border: `1px solid #1a1a1a`, borderLeft: `3px solid ${gold}`, borderRadius: "6px", padding: "16px 20px", marginBottom: "28px" }}>
            <p style={{ color: "#e0e0e0", fontSize: "16px", fontWeight: "bold", marginBottom: "6px" }}>{lot.address}</p>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <span style={{ color: gold, fontSize: "15px", fontWeight: "bold" }}>{formatGuidePrice(lot.guidePrice)}</span>
              {lot.propertyType && <span style={{ color: "#888", fontSize: "13px" }}>{lot.propertyType}</span>}
              {lot.bedrooms && <span style={{ color: "#888", fontSize: "13px" }}>{lot.bedrooms} bed</span>}
            </div>
          </div>
        ) : (
          <div style={{ backgroundColor: "#111", borderRadius: "6px", height: "68px", marginBottom: "28px", animation: "pulse 2s infinite" }} />
        )}

        {/* Date filter */}
        <div style={{ marginBottom: "20px" }}>
          <p style={{ color: "#888", fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "10px" }}>Select Date</p>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              onClick={() => { setSelectedDate(""); void fetchSlots(); }}
              style={{
                padding: "8px 16px",
                borderRadius: "4px",
                fontSize: "12px",
                cursor: "pointer",
                border: `1px solid ${!selectedDate ? gold : "#222"}`,
                backgroundColor: !selectedDate ? `${gold}15` : "#111",
                color: !selectedDate ? gold : "#888",
              }}
            >
              Next 7 Days
            </button>
            {availableDates.slice(0, 7).map((date) => {
              const d = new Date(date + "T00:00:00Z");
              const label = d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
              const isSelected = selectedDate === date;
              return (
                <button
                  key={date}
                  onClick={() => { setSelectedDate(date); void fetchSlots(date); }}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    cursor: "pointer",
                    border: `1px solid ${isSelected ? gold : "#222"}`,
                    backgroundColor: isSelected ? `${gold}15` : "#111",
                    color: isSelected ? gold : "#888",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Slot grid */}
        <div style={{ marginBottom: "32px" }}>
          <p style={{ color: "#888", fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "12px" }}>Available Times</p>

          {slotsLoading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} style={{ height: "36px", backgroundColor: "#111", borderRadius: "4px" }} />
              ))}
            </div>
          ) : grouped.length === 0 ? (
            <p style={{ color: "#555", fontSize: "13px" }}>No available slots found.</p>
          ) : (
            grouped.map(({ date, label, slots: daySlots }) => {
              const hasAvailable = daySlots.some((s) => s.available);
              if (!hasAvailable && selectedDate) return null;
              return (
                <div key={date} style={{ marginBottom: "20px" }}>
                  <p style={{ color: "#666", fontSize: "12px", marginBottom: "8px", letterSpacing: "1px" }}>{label}</p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" }}>
                    {daySlots.map((slot) => {
                      const isSelected = selectedSlot === slot.datetime;
                      return (
                        <button
                          key={slot.datetime}
                          disabled={!slot.available}
                          onClick={() => setSelectedSlot(slot.datetime)}
                          style={{
                            padding: "8px 4px",
                            borderRadius: "4px",
                            fontSize: "12px",
                            cursor: slot.available ? "pointer" : "default",
                            border: `1px solid ${isSelected ? gold : slot.available ? "#2a2a2a" : "#111"}`,
                            backgroundColor: isSelected ? `${gold}20` : slot.available ? "#111" : "#0a0a0a",
                            color: isSelected ? gold : slot.available ? "#c0c0c0" : "#333",
                            transition: "all 0.15s",
                          }}
                        >
                          {slot.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Contact form */}
        <div style={{ backgroundColor: "#0f0f0f", border: "1px solid #1a1a1a", borderRadius: "8px", padding: "24px" }}>
          <p style={{ color: "#888", fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "20px" }}>Your Details</p>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={{ color: "#888", fontSize: "11px", letterSpacing: "1px", display: "block", marginBottom: "6px" }}>FULL NAME *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. James Wilson"
                style={{ width: "100%", padding: "10px 14px", backgroundColor: "#111", border: "1px solid #222", borderRadius: "4px", color: "#e0e0e0", fontSize: "14px", boxSizing: "border-box" }}
              />
            </div>
            <div>
              <label style={{ color: "#888", fontSize: "11px", letterSpacing: "1px", display: "block", marginBottom: "6px" }}>EMAIL ADDRESS *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                style={{ width: "100%", padding: "10px 14px", backgroundColor: "#111", border: "1px solid #222", borderRadius: "4px", color: "#e0e0e0", fontSize: "14px", boxSizing: "border-box" }}
              />
            </div>
            <div>
              <label style={{ color: "#888", fontSize: "11px", letterSpacing: "1px", display: "block", marginBottom: "6px" }}>PHONE (OPTIONAL)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+44 7XXX XXXXXX"
                style={{ width: "100%", padding: "10px 14px", backgroundColor: "#111", border: "1px solid #222", borderRadius: "4px", color: "#e0e0e0", fontSize: "14px", boxSizing: "border-box" }}
              />
            </div>
          </div>

          {selectedSlot && (
            <div style={{ marginTop: "16px", padding: "12px 16px", backgroundColor: `${gold}10`, border: `1px solid ${gold}30`, borderRadius: "4px" }}>
              <p style={{ color: gold, fontSize: "13px", margin: 0 }}>
                Selected: <strong>{new Date(selectedSlot).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</strong>
              </p>
            </div>
          )}

          {error && (
            <div style={{ marginTop: "14px", padding: "10px 14px", backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "4px" }}>
              <p style={{ color: "#f87171", fontSize: "13px", margin: 0 }}>{error}</p>
            </div>
          )}

          <button
            onClick={handleBook}
            disabled={submitting || !selectedSlot}
            style={{
              marginTop: "20px",
              width: "100%",
              padding: "14px",
              backgroundColor: submitting || !selectedSlot ? "#1a1a1a" : gold,
              color: submitting || !selectedSlot ? "#555" : "#000",
              border: "none",
              borderRadius: "4px",
              fontSize: "14px",
              fontWeight: "bold",
              letterSpacing: "2px",
              textTransform: "uppercase",
              cursor: submitting || !selectedSlot ? "default" : "pointer",
              transition: "all 0.2s",
            }}
          >
            {submitting ? "Booking..." : "Confirm Viewing"}
          </button>
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: "32px" }}>
          <p style={{ color: "#444", fontSize: "12px" }}>
            Questions? WhatsApp Sam: <span style={{ color: gold }}>07454 753318</span>
          </p>
          <p style={{ color: "#333", fontSize: "11px", marginTop: "6px" }}>
            Midas Property Group · Stanmore, London HA7 1BT
          </p>
        </div>
      </div>
    </div>
  );
}

export default function BookViewingPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", backgroundColor: "#0d0d0d", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#555", fontFamily: "Georgia, serif" }}>Loading...</p>
      </div>
    }>
      <BookingPageInner />
    </Suspense>
  );
}
