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
  { region: "Manchester", growth: 6.8 },
  { region: "Birmingham", growth: 5.9 },
  { region: "Leeds", growth: 5.2 },
  { region: "Bristol", growth: 4.1 },
  { region: "East London", growth: 3.8 },
  { region: "Outer London", growth: 2.9 },
  { region: "Central London", growth: 1.4 },
];

export default function RegionalGrowthChart() {
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
        Regional Price Growth % — 2026
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 20, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(201,168,76,0.08)"
            horizontal={false}
          />
          <XAxis
            type="number"
            tick={{ fill: "rgba(232,228,220,0.45)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `${v}%`}
          />
          <YAxis
            type="category"
            dataKey="region"
            tick={{ fill: "rgba(232,228,220,0.55)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={82}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#15151C",
              border: "1px solid rgba(201,168,76,0.18)",
              borderRadius: "6px",
              color: "#E8E4DC",
              fontSize: "12px",
            }}
            formatter={(value) => [typeof value === "number" ? `+${value}%` : String(value), "Growth"]}
          />
          <Bar dataKey="growth" fill="#C9A84C" radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
