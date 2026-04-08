"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import Image from "next/image";
import type { Lot } from "@/lib/schema";

const STAGE_OPTIONS = [
  { value: "sourcing", label: "Sourcing" },
  { value: "legal_pack", label: "Legal Pack" },
  { value: "live", label: "Live" },
  { value: "completed", label: "Completed" },
  { value: "unsold", label: "Unsold" },
];

const STAGE_COLORS: Record<string, string> = {
  sourcing: "#60A5FA",
  legal_pack: "#F59E0B",
  live: "#EF4444",
  completed: "#22C55E",
  unsold: "#6B7280",
};

function formatGuidePrice(pence: number): string {
  if (pence >= 1_000_000) return `£${(pence / 1_000_000).toFixed(2)}m`;
  if (pence >= 1_000) return `£${(pence / 1_000).toFixed(0)}k`;
  return `£${pence.toLocaleString()}`;
}

interface LotDetailModalProps {
  lot: Lot;
  onClose: () => void;
  onStageChange: (id: string, stage: string) => Promise<void>;
}

export default function LotDetailModal({ lot, onClose, onStageChange }: LotDetailModalProps) {
  const router = useRouter();
  const [activeImage, setActiveImage] = useState(0);
  const [updatingStage, setUpdatingStage] = useState(false);

  const images: string[] = (() => {
    try {
      const parsed = JSON.parse(lot.images ?? "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();

  const allImages = lot.coverImage
    ? [lot.coverImage, ...images.filter((u) => u !== lot.coverImage)]
    : images;

  async function handleStageChange(stage: string) {
    setUpdatingStage(true);
    await onStageChange(lot.id, stage);
    setUpdatingStage(false);
  }

  const gold = "#c9a84c";
  const stageColor = STAGE_COLORS[lot.pipelineStage] ?? "#888";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end"
      style={{ backgroundColor: "rgba(0,0,0,0.65)" }}
      onClick={onClose}
    >
      <div
        className="relative h-full flex flex-col overflow-y-auto"
        style={{
          width: "min(520px, 100vw)",
          backgroundColor: "var(--color-surface)",
          borderLeft: "1px solid var(--color-border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 flex items-center justify-center rounded-full"
          style={{ width: "32px", height: "32px", backgroundColor: "rgba(0,0,0,0.4)", color: "#fff" }}
        >
          <X size={14} />
        </button>

        {/* Image gallery */}
        {allImages.length > 0 ? (
          <div>
            <div className="relative w-full" style={{ height: "260px", backgroundColor: "#000" }}>
              <Image
                src={allImages[activeImage]}
                alt={lot.address}
                fill
                style={{ objectFit: "cover" }}
              />
            </div>
            {allImages.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto" style={{ backgroundColor: "var(--background)" }}>
                {allImages.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className="shrink-0 rounded overflow-hidden"
                    style={{
                      width: "60px",
                      height: "44px",
                      border: i === activeImage ? `2px solid ${gold}` : "2px solid transparent",
                      position: "relative",
                    }}
                  >
                    <Image src={url} alt={`Photo ${i + 1}`} fill style={{ objectFit: "cover" }} />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div
            className="w-full flex items-center justify-center"
            style={{ height: "200px", backgroundColor: "var(--background)" }}
          >
            <div className="text-center">
              <p style={{ fontSize: "40px", opacity: 0.2 }}>📷</p>
              <p style={{ color: "var(--color-text-dim)", fontSize: "12px" }}>No photos</p>
            </div>
          </div>
        )}

        {/* Details */}
        <div className="flex-1 p-5 space-y-4">
          {/* Address + price */}
          <div>
            <h2 className="text-lg font-bold leading-snug mb-2" style={{ color: "var(--color-text)" }}>
              {lot.address}
            </h2>
            <p className="text-2xl font-bold" style={{ color: gold, fontFamily: "Georgia, serif" }}>
              {formatGuidePrice(lot.guidePrice)}
            </p>
          </div>

          {/* Meta pills */}
          <div className="flex flex-wrap gap-2">
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: `${stageColor}20`, color: stageColor, border: `1px solid ${stageColor}40` }}
            >
              {STAGE_OPTIONS.find((s) => s.value === lot.pipelineStage)?.label ?? lot.pipelineStage}
            </span>
            {lot.propertyType && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(201,168,76,0.1)", color: "var(--color-text-dim)", border: "1px solid var(--color-border)" }}>
                {lot.propertyType}
              </span>
            )}
            {lot.bedrooms && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(201,168,76,0.1)", color: "var(--color-text-dim)", border: "1px solid var(--color-border)" }}>
                {lot.bedrooms} bed
              </span>
            )}
          </div>

          {/* Fields */}
          {lot.arv && (
            <div className="flex justify-between py-2" style={{ borderBottom: "1px solid var(--color-border)" }}>
              <span style={{ color: "var(--color-text-dim)", fontSize: "13px" }}>ARV (After Refurb)</span>
              <span style={{ color: "#22c55e", fontSize: "13px", fontWeight: "600" }}>{formatGuidePrice(lot.arv)}</span>
            </div>
          )}
          {lot.soldPrice && (
            <div className="flex justify-between py-2" style={{ borderBottom: "1px solid var(--color-border)" }}>
              <span style={{ color: "var(--color-text-dim)", fontSize: "13px" }}>Sold Price</span>
              <span style={{ color: gold, fontSize: "13px", fontWeight: "600" }}>{formatGuidePrice(lot.soldPrice)}</span>
            </div>
          )}
          {lot.notes && (
            <div className="rounded p-3" style={{ backgroundColor: "var(--background)", border: "1px solid var(--color-border)" }}>
              <p style={{ color: "var(--color-text-dim)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Notes</p>
              <p style={{ color: "var(--color-text)", fontSize: "13px", lineHeight: "1.6" }}>{lot.notes}</p>
            </div>
          )}

          {/* Move stage */}
          <div>
            <label className="block mb-1.5" style={{ color: "var(--color-text-dim)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px" }}>
              Move to Stage
            </label>
            <select
              disabled={updatingStage}
              value={lot.pipelineStage}
              onChange={(e) => void handleStageChange(e.target.value)}
              className="w-full rounded px-3 py-2 text-sm outline-none disabled:opacity-50"
              style={{ backgroundColor: "var(--background)", border: "1px solid var(--color-border)", color: "var(--color-text)" }}
            >
              <option disabled value={lot.pipelineStage}>Move to →</option>
              {STAGE_OPTIONS.filter((s) => s.value !== lot.pipelineStage).map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={() => router.push(`/social?lotId=${lot.id}`)}
              className="rounded px-3 py-2.5 text-sm font-medium text-left"
              style={{ backgroundColor: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.15)", color: "rgba(201,168,76,0.7)" }}
            >
              📱 Social Post
            </button>
            <button
              onClick={() => router.push(`/viewings?lotId=${lot.id}`)}
              className="rounded px-3 py-2.5 text-sm font-medium text-left"
              style={{ backgroundColor: "rgba(99,179,237,0.06)", border: "1px solid rgba(99,179,237,0.15)", color: "rgba(99,179,237,0.7)" }}
            >
              👁 Book Viewing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
