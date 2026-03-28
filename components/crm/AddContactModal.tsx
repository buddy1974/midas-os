"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { Contact } from "@/lib/schema";

interface AddContactModalProps {
  onClose: () => void;
  onSaved: (contact: Contact) => void;
  initial?: Partial<Contact>;
  editId?: string;
}

const CONTACT_TYPES = ["investor", "buyer", "vendor", "lead"];
const STATUSES = ["hot", "warm", "cold", "vip"];

interface FormState {
  name: string;
  email: string;
  phone: string;
  contact_type: string;
  status: string;
  budget_min: string;
  budget_max: string;
  score: number;
  notes: string;
}

export default function AddContactModal({
  onClose,
  onSaved,
  initial,
  editId,
}: AddContactModalProps) {
  const [form, setForm] = useState<FormState>({
    name: initial?.name ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    contact_type: initial?.contactType ?? "lead",
    status: initial?.status ?? "cold",
    budget_min: initial?.budgetMin != null ? String(initial.budgetMin) : "",
    budget_max: initial?.budgetMax != null ? String(initial.budgetMax) : "",
    score: initial?.score ?? 0,
    notes: initial?.notes ?? "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) next.name = "Name is required";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = "Invalid email format";
    }
    if (form.score < 0 || form.score > 100) next.score = "Score must be 0–100";
    const min = form.budget_min ? Number(form.budget_min) : null;
    const max = form.budget_max ? Number(form.budget_max) : null;
    if (min !== null && max !== null && max < min) {
      next.budget_max = "Max must be ≥ min";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setServerError("");

    const payload = {
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      contact_type: form.contact_type,
      status: form.status,
      budget_min: form.budget_min ? Number(form.budget_min) : null,
      budget_max: form.budget_max ? Number(form.budget_max) : null,
      score: form.score,
      notes: form.notes.trim() || null,
    };

    try {
      const url = editId ? `/api/contacts/${editId}` : "/api/contacts";
      const method = editId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setServerError(data.error ?? "Failed to save contact");
        return;
      }
      const contact = await res.json() as Contact;
      onSaved(contact);
    } catch {
      setServerError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function field(key: keyof FormState, value: string | number) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
    >
      <div
        className="w-full max-w-md rounded-lg p-6 relative my-4"
        style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
      >
        <button onClick={onClose} className="absolute top-4 right-4" style={{ color: "var(--color-text-dim)" }}>
          <X size={16} />
        </button>

        <h2 className="text-base font-semibold mb-5" style={{ color: "var(--color-text)" }}>
          {editId ? "Edit Contact" : "Add Contact"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: "var(--color-text-dim)" }}>Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => field("name", e.target.value)}
              className="w-full rounded px-3 py-2 text-sm outline-none"
              style={{
                backgroundColor: "var(--color-surface-2)",
                border: `1px solid ${errors.name ? "#ef4444" : "var(--color-border)"}`,
                color: "var(--color-text)",
              }}
            />
            {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: "var(--color-text-dim)" }}>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => field("email", e.target.value)}
                className="w-full rounded px-3 py-2 text-sm outline-none"
                style={{
                  backgroundColor: "var(--color-surface-2)",
                  border: `1px solid ${errors.email ? "#ef4444" : "var(--color-border)"}`,
                  color: "var(--color-text)",
                }}
              />
              {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: "var(--color-text-dim)" }}>Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => field("phone", e.target.value)}
                className="w-full rounded px-3 py-2 text-sm outline-none"
                style={{
                  backgroundColor: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text)",
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: "var(--color-text-dim)" }}>Type</label>
              <select
                value={form.contact_type}
                onChange={(e) => field("contact_type", e.target.value)}
                className="w-full rounded px-3 py-2 text-sm outline-none capitalize"
                style={{
                  backgroundColor: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text)",
                }}
              >
                {CONTACT_TYPES.map((t) => (
                  <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: "var(--color-text-dim)" }}>Status</label>
              <select
                value={form.status}
                onChange={(e) => field("status", e.target.value)}
                className="w-full rounded px-3 py-2 text-sm outline-none"
                style={{
                  backgroundColor: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text)",
                }}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s} className="capitalize">{s.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: "var(--color-text-dim)" }}>Budget Min (£)</label>
              <input
                type="number"
                value={form.budget_min}
                onChange={(e) => field("budget_min", e.target.value)}
                className="w-full rounded px-3 py-2 text-sm outline-none"
                style={{
                  backgroundColor: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text)",
                }}
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: "var(--color-text-dim)" }}>Budget Max (£)</label>
              <input
                type="number"
                value={form.budget_max}
                onChange={(e) => field("budget_max", e.target.value)}
                className="w-full rounded px-3 py-2 text-sm outline-none"
                style={{
                  backgroundColor: "var(--color-surface-2)",
                  border: `1px solid ${errors.budget_max ? "#ef4444" : "var(--color-border)"}`,
                  color: "var(--color-text)",
                }}
              />
              {errors.budget_max && <p className="text-xs text-red-400 mt-1">{errors.budget_max}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: "var(--color-text-dim)" }}>
              Score: {form.score}
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={form.score}
              onChange={(e) => field("score", Number(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: "var(--color-text-dim)" }}>Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => field("notes", e.target.value)}
              rows={3}
              className="w-full rounded px-3 py-2 text-sm outline-none resize-none"
              style={{
                backgroundColor: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text)",
              }}
            />
          </div>

          {serverError && <p className="text-xs text-red-400">{serverError}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded text-sm"
              style={{
                backgroundColor: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text-dim)",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 rounded text-sm font-semibold disabled:opacity-50"
              style={{ backgroundColor: "var(--color-gold)", color: "#080809" }}
            >
              {loading ? "Saving…" : editId ? "Save Changes" : "Add Contact"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
