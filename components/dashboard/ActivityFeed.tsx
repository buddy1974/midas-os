"use client";

import { useEffect, useState } from "react";
import type { ActivityLog } from "@/lib/schema";

interface FeedItem {
  color: string;
  description: string;
  time: string;
}

const FALLBACK_ITEMS: FeedItem[] = [
  { color: "#22c55e", description: "Marcus O. registered to bid", time: "2 min ago" },
  { color: "#C9A84C", description: "New subscriber: Priya Sharma", time: "14 min ago" },
  { color: "#60A5FA", description: "Legal pack downloaded · 5 Weald Lane", time: "31 min ago" },
  { color: "#F59E0B", description: "Campaign sent · £160k Creative Finance", time: "1 hr ago" },
  { color: "#22c55e", description: "LOT SOLD · 22 Fletcher Road · £187,500", time: "3 hrs ago" },
  { color: "#C9A84C", description: "VIP investor James H. · meeting request", time: "5 hrs ago" },
];

const EVENT_COLORS: Record<string, string> = {
  lot_added: "#60A5FA",
  lot_sold: "#22c55e",
  contact_added: "#C9A84C",
  campaign_sent: "#F59E0B",
  bid_registered: "#22c55e",
};

function getEventColor(eventType: string | null): string {
  if (!eventType) return "#C9A84C";
  return EVENT_COLORS[eventType] ?? "#C9A84C";
}

function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

function SkeletonRow() {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-1.5 rounded-full shrink-0 animate-pulse"
        style={{ width: "7px", height: "7px", backgroundColor: "rgba(255,255,255,0.08)" }} />
      <div className="flex-1 flex items-baseline justify-between gap-2">
        <div className="h-3 rounded animate-pulse" style={{ backgroundColor: "rgba(255,255,255,0.06)", width: "70%" }} />
        <div className="h-3 rounded animate-pulse shrink-0" style={{ backgroundColor: "rgba(255,255,255,0.04)", width: "50px" }} />
      </div>
    </div>
  );
}

export default function ActivityFeed() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActivity() {
      try {
        const res = await fetch("/api/activity");
        if (!res.ok) throw new Error("Failed");
        const rows = await res.json() as ActivityLog[];
        if (rows.length === 0) {
          setItems(FALLBACK_ITEMS);
        } else {
          setItems(
            rows.map((row) => ({
              color: getEventColor(row.eventType),
              description: row.description,
              time: formatRelativeTime(new Date(row.createdAt)),
            }))
          );
        }
      } catch {
        setItems(FALLBACK_ITEMS);
      } finally {
        setLoading(false);
      }
    }
    void fetchActivity();
  }, []);

  return (
    <div
      className="rounded-lg p-5"
      style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
      }}
    >
      <p className="text-xs tracking-widest uppercase mb-4" style={{ color: "var(--color-text-dim)" }}>
        Live Activity Feed
      </p>
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
        ) : (
          items.map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <span
                className="mt-1.5 rounded-full shrink-0"
                style={{ width: "7px", height: "7px", backgroundColor: item.color }}
              />
              <div className="flex-1 flex items-baseline justify-between gap-2">
                <p className="text-sm leading-snug" style={{ color: "var(--color-text)" }}>
                  {item.description}
                </p>
                <span className="text-xs shrink-0" style={{ color: "var(--color-text-dim)" }}>
                  {item.time}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
