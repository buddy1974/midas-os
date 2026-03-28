import { TrendingUp } from "lucide-react";
import AuctionVolumeChart from "@/components/market/AuctionVolumeChart";
import RegionalGrowthChart from "@/components/market/RegionalGrowthChart";
import CompetitorTable from "@/components/market/CompetitorTable";

interface KpiCard {
  label: string;
  value: string;
  trend: string;
  positive: boolean;
}

const KPI_CARDS: KpiCard[] = [
  { label: "Market Size 2026", value: "£496M", trend: "↑ 11.9% CAGR", positive: true },
  { label: "UK Avg House Price", value: "£289K", trend: "↑ 3.2% YoY", positive: true },
  { label: "BoE Base Rate", value: "4.50%", trend: "↓ from 5.25% peak", positive: true },
  { label: "Auction Success", value: "78%", trend: "↑ vs 75% industry avg", positive: true },
];

const INSIGHT_CARDS = [
  {
    border: "var(--color-gold)",
    title: "🎯 Opportunity Zone",
    body: "East London & Essex corridors showing 7–9% growth. Dagenham/Barking below national average — prime for BMV acquisitions before uplift arrives. Focus sourcing here.",
  },
  {
    border: "#22c55e",
    title: "📈 Trend Alert",
    body: "HMO demand up 23% in outer London. Creative finance deals closing 40% faster than standard. Auction volumes up 15.5% YoY. Residential lots increased 9.3% in Q1 2026.",
  },
  {
    border: "#60A5FA",
    title: "⚡ Rate Outlook",
    body: "BoE expected to cut to 4.0% by Q4 2026. Bridging rates stabilising at 0.65–0.85%/month. Mortgage approvals up 18% in Q1. Window to acquire before prices recover.",
  },
];

export default function MarketPage() {
  return (
    <div className="space-y-6">
      {/* Section 1 — KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {KPI_CARDS.map((card) => (
          <div
            key={card.label}
            className="rounded-lg p-5"
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
            }}
          >
            <p
              className="text-xs tracking-widest uppercase mb-3"
              style={{ color: "var(--color-text-dim)" }}
            >
              {card.label}
            </p>
            <p className="text-2xl font-semibold mb-2" style={{ color: "var(--color-text)" }}>
              {card.value}
            </p>
            <div className="flex items-center gap-1">
              <TrendingUp size={12} style={{ color: card.positive ? "#22c55e" : "#ef4444" }} />
              <span
                className="text-xs"
                style={{ color: card.positive ? "#22c55e" : "#ef4444" }}
              >
                {card.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Section 2 — Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AuctionVolumeChart />
        <RegionalGrowthChart />
      </div>

      {/* Section 3 — Intelligence cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {INSIGHT_CARDS.map((card) => (
          <div
            key={card.title}
            className="rounded-lg p-5 text-sm leading-relaxed"
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderLeft: `3px solid ${card.border}`,
              color: "var(--color-text)",
            }}
          >
            <p className="font-semibold mb-2" style={{ color: "var(--color-text)" }}>
              {card.title}
            </p>
            <p style={{ color: "var(--color-text-dim)", lineHeight: 1.7 }}>{card.body}</p>
          </div>
        ))}
      </div>

      {/* Section 4 — Competitor table */}
      <CompetitorTable />
    </div>
  );
}
