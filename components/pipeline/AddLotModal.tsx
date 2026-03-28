"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { Lot } from "@/lib/schema";

interface AddLotModalProps {
  onClose: () => void;
  onCreated: (lot: Lot) => void;
}

const PROPERTY_TYPES = [
  "Residential Flat",
  "Terraced House",
  "Semi-Detached",
  "HMO",
  "Commercial",
  "Land",
  "Mixed Use",
];

const PIPELINE_STAGES = [
  { value: "sourcing", label: "Sourcing" },
  { value: "legal_pack", label: "Legal Pack" },
  { value: "live", label: "Live" },
  { value: "completed", label: "Completed" },
  { value: "unsold", label: "Unsold" },
];

interface FormState {
  address: string;
  guide_price: string;
  property_type: string;
  pipeline_stage: string;
  bedrooms: string;
  notes: string;
}

export default function AddLotModal({ onClose, onCreated }: AddLotModalProps) {
  const [form, setForm] = useState<FormState>({
    address: "",
    guide_price: "",
    property_type: "Terraced House",
    pipeline_stage: "sourcing",
    bedrooms: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  function validate(): boolean {
    const next: Partial<FormState> = {};
    if (!form.address.trim()) next.address = "Address is required";
    const price = Number(form.guide_price);
    if (!form.guide_price || isNaN(price) || price <= 0)
      next.guide_price = "Enter a valid guide price";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setServerError("");
    try {
      const res = await fetch("/api/lots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: form.address.trim(),
          guide_price: Number(form.guide_price),
          property_type: form.property_type,
          pipeline_stage: form.pipeline_stage,
          bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
          notes: form.notes.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setServerError(data.error ?? "Failed to create lot");
        return;
      }
      const lot = await res.json() as Lot;
      onCreated(lot);
    } catch {
      setServerError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function field(key: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
    >
      <div
        className="w-full max-w-md rounded-lg p-6 relative"
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4"
          style={{ color: "var(--color-text-dim)" }}
        >
          <X size={16} />
        </button>

        <h2 className="text-base font-semibold mb-5" style={{ color: "var(--color-text)" }}>
          Add New Lot
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: "var(--color-text-dim)" }}>
              Address *
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => field("address", e.target.value)}
              className="w-full rounded px-3 py-2 text-sm outline-none"
              style={{
                backgroundColor: "var(--color-surface-2)",
                border: `1px solid ${errors.address ? "#ef4444" : "var(--color-border)"}`,
                color: "var(--color-text)",
              }}
              placeholder="22 Fletcher Road, Birmingham, B12 9LT"
            />
            {errors.address && <p className="text-xs text-red-400 mt-1">{errors.address}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: "var(--color-text-dim)" }}>
                Guide Price (£) *
              </label>
              <input
                type="number"
                value={form.guide_price}
                onChange={(e) => field("guide_price", e.target.value)}
                className="w-full rounded px-3 py-2 text-sm outline-none"
                style={{
                  backgroundColor: "var(--color-surface-2)",
                  border: `1px solid ${errors.guide_price ? "#ef4444" : "var(--color-border)"}`,
                  color: "var(--color-text)",
                }}
                placeholder="160000"
              />
              {errors.guide_price && <p className="text-xs text-red-400 mt-1">{errors.guide_price}</p>}
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: "var(--color-text-dim)" }}>
                Bedrooms
              </label>
              <input
                type="number"
                value={form.bedrooms}
                onChange={(e) => field("bedrooms", e.target.value)}
                className="w-full rounded px-3 py-2 text-sm outline-none"
                style={{
                  backgroundColor: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text)",
                }}
                placeholder="3"
                min="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: "var(--color-text-dim)" }}>
                Property Type
              </label>
              <select
                value={form.property_type}
                onChange={(e) => field("property_type", e.target.value)}
                className="w-full rounded px-3 py-2 text-sm outline-none"
                style={{
                  backgroundColor: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text)",
                }}
              >
                {PROPERTY_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: "var(--color-text-dim)" }}>
                Stage
              </label>
              <select
                value={form.pipeline_stage}
                onChange={(e) => field("pipeline_stage", e.target.value)}
                className="w-full rounded px-3 py-2 text-sm outline-none"
                style={{
                  backgroundColor: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text)",
                }}
              >
                {PIPELINE_STAGES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: "var(--color-text-dim)" }}>
              Notes
            </label>
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
              placeholder="Optional notes..."
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
              {loading ? "Adding…" : "Add Lot"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
