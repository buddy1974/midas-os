import { TrendingUp } from "lucide-react";

interface KpiCard {
  label: string;
  value: string;
  trend: string;
  positive: boolean;
}

const cards: KpiCard[] = [
  { label: "Revenue YTD", value: "£487,000", trend: "↑ 34% vs last year", positive: true },
  { label: "Active Lots", value: "14", trend: "↑ 3 this week", positive: true },
  { label: "Subscribers", value: "2,847", trend: "↑ 12% this month", positive: true },
  { label: "Conversion Rate", value: "78%", trend: "↑ 5pts vs Q4", positive: true },
];

export default function KpiCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-lg p-5"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
          }}
        >
          <p className="text-xs tracking-widest uppercase mb-3" style={{ color: "var(--color-text-dim)" }}>
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
  );
}
