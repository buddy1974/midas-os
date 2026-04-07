"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";

interface EventInfo {
  id: string;
  title: string;
  description: string | null;
  eventType: string;
  location: string | null;
  eventDate: string;
  endTime: string | null;
  pricePence: number | null;
  maxCapacity: number | null;
  registrantCount: number;
}

export default function PublicRegisterPage() {
  const params = useParams<{ id: string }>();
  const eventId = params.id;

  const [event, setEvent] = useState<EventInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [investorType, setInvestorType] = useState("general");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [full, setFull] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/events/${eventId}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then((d: { event: EventInfo; registrantCount: number } | null) => {
        if (!d) return;
        setEvent({ ...d.event, registrantCount: d.registrantCount ?? 0 });
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [eventId]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/events/${eventId}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), phone: phone.trim() || undefined, investor_type: investorType, source: "direct" }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (data.error === "Event is full") {
        setFull(true);
      } else if (data.success) {
        setSuccess(true);
      } else {
        setError(data.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [eventId, name, email, phone, investorType]);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-GB", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  const inputCss: React.CSSProperties = {
    width: "100%",
    background: "#111",
    border: "1px solid #2a2a2a",
    color: "#e0e0e0",
    borderRadius: 6,
    padding: "10px 14px",
    fontSize: 14,
    outline: "none",
  };

  if (loading) {
    return (
      <Page>
        <p style={{ color: "#888", textAlign: "center", padding: 48 }}>Loading event…</p>
      </Page>
    );
  }

  if (notFound || !event) {
    return (
      <Page>
        <h2 style={{ color: "#ef4444", marginBottom: 12 }}>Event Not Found</h2>
        <p style={{ color: "#888" }}>This event may have been removed or the link is incorrect.</p>
      </Page>
    );
  }

  const isFull = event.maxCapacity !== null && event.registrantCount >= event.maxCapacity;

  return (
    <Page>
      {/* Event info */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ color: "#888", fontSize: 12, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
          {event.eventType}
        </p>
        <h2 style={{ color: "#e0e0e0", fontSize: 24, fontWeight: "bold", marginBottom: 12, fontFamily: "Georgia, serif" }}>
          {event.title}
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
          <p style={{ color: "#c9a84c", fontSize: 14 }}>
            📅 {formatDate(event.eventDate)} · {formatTime(event.eventDate)}
            {event.endTime && " — " + formatTime(event.endTime)}
          </p>
          {event.location && (
            <p style={{ color: "#888", fontSize: 14 }}>📍 {event.location}</p>
          )}
          {event.pricePence ? (
            <p style={{ color: "#c9a84c", fontSize: 14 }}>
              🎫 £{(event.pricePence / 100).toFixed(0)}/person
            </p>
          ) : (
            <p style={{ color: "#22c55e", fontSize: 14 }}>✓ Free event</p>
          )}
        </div>
        {event.description && (
          <p style={{ color: "#999", fontSize: 14, lineHeight: 1.7 }}>{event.description}</p>
        )}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "#1a1a1a", marginBottom: 28 }} />

      {/* Form states */}
      {full || isFull ? (
        <div style={{ textAlign: "center", padding: "32px 0" }}>
          <p style={{ color: "#ef4444", fontSize: 18, fontWeight: "bold", marginBottom: 8 }}>This event is now full.</p>
          <p style={{ color: "#888", fontSize: 14 }}>Unfortunately all spaces have been taken. Please check back for future events.</p>
        </div>
      ) : success ? (
        <div style={{ textAlign: "center", padding: "32px 0" }}>
          <p style={{ color: "#22c55e", fontSize: 24, marginBottom: 12 }}>✓</p>
          <p style={{ color: "#e0e0e0", fontSize: 18, fontWeight: "bold", marginBottom: 8 }}>You&apos;re registered!</p>
          <p style={{ color: "#888", fontSize: 14 }}>
            We&apos;ll be in touch with joining details. Keep an eye on your inbox.
          </p>
          <p style={{ color: "#888", fontSize: 13, marginTop: 16 }}>
            Questions? WhatsApp Sam: <span style={{ color: "#c9a84c" }}>07454 753318</span>
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <h3 style={{ color: "#e0e0e0", fontSize: 14, fontWeight: "bold", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
            Register your place
          </h3>

          <div>
            <label style={{ display: "block", color: "#888", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Full Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your full name" style={inputCss} />
          </div>

          <div>
            <label style={{ display: "block", color: "#888", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Email Address *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="your@email.com" style={inputCss} />
          </div>

          <div>
            <label style={{ display: "block", color: "#888", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Phone (optional)</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+44 7700 000000" style={inputCss} />
          </div>

          <div>
            <label style={{ display: "block", color: "#888", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>I invest in…</label>
            <select value={investorType} onChange={(e) => setInvestorType(e.target.value)} style={inputCss}>
              <option value="btl">Buy-to-Let (BTL)</option>
              <option value="hmo">HMO Properties</option>
              <option value="commercial">Commercial Property</option>
              <option value="land">Land</option>
              <option value="general">General / Not Sure Yet</option>
            </select>
          </div>

          {error && <p style={{ color: "#ef4444", fontSize: 13 }}>{error}</p>}

          <button
            type="submit"
            disabled={submitting || !name.trim() || !email.trim()}
            style={{
              background: submitting ? "#333" : "#c9a84c",
              color: "#000",
              border: "none",
              borderRadius: 6,
              padding: "14px 0",
              fontSize: 14,
              fontWeight: "bold",
              letterSpacing: 2,
              textTransform: "uppercase",
              cursor: submitting ? "not-allowed" : "pointer",
              opacity: !name.trim() || !email.trim() ? 0.5 : 1,
            }}
          >
            {submitting ? "Registering…" : "Register Now"}
          </button>

          <p style={{ color: "#555", fontSize: 11, textAlign: "center" }}>
            By registering you agree to receive event updates from Midas Property Auctions.
          </p>
        </form>
      )}
    </Page>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", fontFamily: "Georgia, serif", display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 40, paddingBottom: 40 }}>
      <div style={{ width: "100%", maxWidth: 520, margin: "0 auto", padding: "0 20px" }}>
        {/* Midas header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <p style={{ color: "#c9a84c", fontSize: 28, letterSpacing: 8, textTransform: "uppercase", margin: 0, fontFamily: "Georgia, serif" }}>MIDAS</p>
          <p style={{ color: "#555", fontSize: 10, letterSpacing: 4, textTransform: "uppercase", margin: "4px 0 0" }}>PROPERTY AUCTIONS</p>
          <div style={{ width: 40, height: 1, background: "#c9a84c", margin: "16px auto 0" }} />
        </div>

        {/* Card */}
        <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 8, padding: "32px 28px" }}>
          {children}
        </div>

        {/* Footer */}
        <p style={{ color: "#333", fontSize: 11, textAlign: "center", marginTop: 24, lineHeight: 1.6 }}>
          Midas Property Group · Stanmore, London HA7 1BT<br />
          Sam@MidasPropertyAuctions.co.uk · 07454 753318
        </p>
      </div>
    </div>
  );
}
