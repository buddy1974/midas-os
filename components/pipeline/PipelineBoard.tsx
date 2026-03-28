"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import type { Lot } from "@/lib/schema";
import AddLotModal from "./AddLotModal";

interface Column {
  stage: string;
  label: string;
  accentColor: string;
}

const COLUMNS: Column[] = [
  { stage: "sourcing", label: "📍 Sourcing", accentColor: "#60A5FA" },
  { stage: "legal_pack", label: "📋 Legal Pack", accentColor: "#F59E0B" },
  { stage: "live", label: "🔴 Live", accentColor: "#EF4444" },
  { stage: "completed", label: "✅ Completed", accentColor: "#22C55E" },
];

const STAGE_OPTIONS = [
  { value: "sourcing", label: "Sourcing" },
  { value: "legal_pack", label: "Legal Pack" },
  { value: "live", label: "Live" },
  { value: "completed", label: "Completed" },
  { value: "unsold", label: "Unsold" },
];

function formatPrice(pence: number) {
  const pounds = pence / 100;
  if (pounds >= 1_000_000) return `£${(pounds / 1_000_000).toFixed(2)}m`;
  if (pounds >= 1_000) return `£${(pounds / 1_000).toFixed(0)}k`;
  return `£${pounds.toFixed(0)}`;
}

// Guide price in db is stored as integer (pence).
// Display directly — spec uses integer as pence, e.g. 12000000 = £120,000
function formatGuidePrice(pence: number) {
  const pounds = pence;
  if (pounds >= 1_000_000) return `£${(pounds / 1_000_000).toFixed(2)}m`;
  if (pounds >= 1_000) return `£${(pounds / 1_000).toFixed(0)}k`;
  return `£${pounds.toLocaleString()}`;
}

function SkeletonCard() {
  return (
    <div
      className="rounded-md p-3 animate-pulse"
      style={{
        backgroundColor: "var(--color-surface-2)",
        border: "1px solid var(--color-border)",
      }}
    >
      <div className="h-3 rounded mb-2" style={{ backgroundColor: "rgba(255,255,255,0.06)", width: "80%" }} />
      <div className="h-3 rounded mb-2" style={{ backgroundColor: "rgba(255,255,255,0.04)", width: "50%" }} />
      <div className="h-6 rounded" style={{ backgroundColor: "rgba(255,255,255,0.04)", width: "100%" }} />
    </div>
  );
}

interface LotCardProps {
  lot: Lot;
  onStageChange: (id: string, stage: string) => Promise<void>;
  updating: boolean;
}

function LotCard({ lot, onStageChange, updating }: LotCardProps) {
  return (
    <div
      className="rounded-md p-3 space-y-2"
      style={{
        backgroundColor: "var(--color-surface-2)",
        border: "1px solid var(--color-border)",
      }}
    >
      <p
        className="text-sm font-medium leading-snug"
        style={{
          color: "var(--color-text)",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {lot.address}
      </p>

      <p className="text-sm font-semibold" style={{ color: "var(--color-gold)" }}>
        {formatGuidePrice(lot.guidePrice)}
      </p>

      {lot.propertyType && (
        <span
          className="inline-block text-xs px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: "rgba(201,168,76,0.1)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-dim)",
          }}
        >
          {lot.propertyType}
        </span>
      )}

      <select
        disabled={updating}
        value={lot.pipelineStage}
        onChange={(e) => onStageChange(lot.id, e.target.value)}
        className="w-full rounded px-2 py-1.5 text-xs outline-none disabled:opacity-50"
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          color: "var(--color-text-dim)",
        }}
      >
        <option disabled value={lot.pipelineStage}>
          Move to →
        </option>
        {STAGE_OPTIONS.filter((s) => s.value !== lot.pipelineStage).map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function PipelineBoard() {
  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  async function fetchLots() {
    try {
      const res = await fetch("/api/lots");
      if (!res.ok) throw new Error("Failed to load lots");
      const data = await res.json() as Lot[];
      setLots(data);
      setError("");
    } catch {
      setError("Failed to load lots. Check your database connection.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchLots();
  }, []);

  async function handleStageChange(id: string, stage: string) {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/lots/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pipeline_stage: stage }),
      });
      if (!res.ok) return;
      await fetchLots();
    } finally {
      setUpdatingId(null);
    }
  }

  const lotsByStage = (stage: string) => lots.filter((l) => l.pipelineStage === stage);

  return (
    <>
      {/* Header bar */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-xs" style={{ color: "var(--color-text-dim)" }}>
          {lots.length} lots in pipeline
        </p>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded text-sm font-semibold"
          style={{ backgroundColor: "var(--color-gold)", color: "#080809" }}
        >
          <Plus size={14} />
          Add Lot
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded text-sm text-red-400" style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
          {error}
        </div>
      )}

      {/* Kanban grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const colLots = lotsByStage(col.stage);
          return (
            <div
              key={col.stage}
              className="rounded-lg flex flex-col"
              style={{
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                minHeight: "400px",
              }}
            >
              {/* Column header */}
              <div
                className="flex items-center justify-between px-4 py-3 rounded-t-lg"
                style={{
                  borderBottom: "1px solid var(--color-border)",
                  borderLeft: `3px solid ${col.accentColor}`,
                }}
              >
                <span className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
                  {col.label}
                </span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{
                    backgroundColor: `${col.accentColor}20`,
                    color: col.accentColor,
                  }}
                >
                  {loading ? "—" : colLots.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                {loading ? (
                  <>
                    <SkeletonCard />
                    <SkeletonCard />
                  </>
                ) : colLots.length === 0 ? (
                  <p
                    className="text-xs text-center pt-8"
                    style={{ color: "var(--color-text-dim)" }}
                  >
                    No lots
                  </p>
                ) : (
                  colLots.map((lot) => (
                    <LotCard
                      key={lot.id}
                      lot={lot}
                      onStageChange={handleStageChange}
                      updating={updatingId === lot.id}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <AddLotModal
          onClose={() => setShowModal(false)}
          onCreated={(lot) => {
            setLots((prev) => [lot, ...prev]);
            setShowModal(false);
          }}
        />
      )}
    </>
  );
}
