"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { month: "Apr", revenue: 38000 },
  { month: "May", revenue: 52000 },
  { month: "Jun", revenue: 44000 },
  { month: "Jul", revenue: 61000 },
  { month: "Aug", revenue: 55000 },
  { month: "Sep", revenue: 73000 },
  { month: "Oct", revenue: 48000 },
  { month: "Nov", revenue: 82000 },
  { month: "Dec", revenue: 91000 },
  { month: "Jan", revenue: 67000 },
  { month: "Feb", revenue: 75000 },
  { month: "Mar", revenue: 94000 },
];

function formatGBP(value: number) {
  return `£${(value / 1000).toFixed(0)}k`;
}

export default function RevenueChart() {
  return (
    <div
      className="rounded-lg p-5 h-full"
      style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
      }}
    >
      <p className="text-xs tracking-widest uppercase mb-4" style={{ color: "var(--color-text-dim)" }}>
        Auction Revenue — 12 Months
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#C9A84C" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(201,168,76,0.08)" />
          <XAxis
            dataKey="month"
            tick={{ fill: "rgba(232,228,220,0.45)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatGBP}
            tick={{ fill: "rgba(232,228,220,0.45)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={42}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#15151C",
              border: "1px solid rgba(201,168,76,0.18)",
              borderRadius: "6px",
              color: "#E8E4DC",
              fontSize: "12px",
            }}
            formatter={(value) => [typeof value === "number" ? formatGBP(value) : String(value), "Revenue"]}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#C9A84C"
            strokeWidth={2}
            fill="url(#goldGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
