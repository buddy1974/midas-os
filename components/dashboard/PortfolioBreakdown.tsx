"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const data = [
  { name: "Residential", value: 45 },
  { name: "HMO", value: 28 },
  { name: "Commercial", value: 18 },
  { name: "Land", value: 9 },
];

const COLORS = ["#C9A84C", "#2DD4BF", "#60A5FA", "#A78BFA"];

export default function PortfolioBreakdown() {
  return (
    <div
      className="rounded-lg p-5"
      style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
      }}
    >
      <p className="text-xs tracking-widest uppercase mb-4" style={{ color: "var(--color-text-dim)" }}>
        Portfolio Breakdown
      </p>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#15151C",
              border: "1px solid rgba(201,168,76,0.18)",
              borderRadius: "6px",
              color: "#E8E4DC",
              fontSize: "12px",
            }}
            formatter={(value) => [`${value}%`, ""]}
          />
          <Legend
            formatter={(value) => (
              <span style={{ color: "rgba(232,228,220,0.6)", fontSize: "12px" }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
