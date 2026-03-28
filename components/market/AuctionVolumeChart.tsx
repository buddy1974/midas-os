"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { month: "Apr", lots: 2840 },
  { month: "May", lots: 3120 },
  { month: "Jun", lots: 3380 },
  { month: "Jul", lots: 2950 },
  { month: "Aug", lots: 2680 },
  { month: "Sep", lots: 3290 },
  { month: "Oct", lots: 3150 },
  { month: "Nov", lots: 3420 },
  { month: "Dec", lots: 3180 },
  { month: "Jan", lots: 2750 },
  { month: "Feb", lots: 3050 },
  { month: "Mar", lots: 3310 },
];

export default function AuctionVolumeChart() {
  return (
    <div
      className="rounded-lg p-5"
      style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
      }}
    >
      <p
        className="text-xs tracking-widest uppercase mb-4"
        style={{ color: "var(--color-text-dim)" }}
      >
        UK Auction Volume — 12 Months
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(201,168,76,0.08)"
            vertical={false}
          />
          <XAxis
            dataKey="month"
            tick={{ fill: "rgba(232,228,220,0.45)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "rgba(232,228,220,0.45)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `${(v / 1000).toFixed(1)}k`}
            width={38}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#15151C",
              border: "1px solid rgba(201,168,76,0.18)",
              borderRadius: "6px",
              color: "#E8E4DC",
              fontSize: "12px",
            }}
            formatter={(value) => [typeof value === "number" ? `${value.toLocaleString()} lots` : String(value), "Volume"]}
          />
          <Bar dataKey="lots" fill="#C9A84C" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
