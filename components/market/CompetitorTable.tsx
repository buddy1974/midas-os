import { Check, X } from "lucide-react";

interface Competitor {
  name: string;
  successRate: string;
  avgOverGuide: string;
  online: boolean;
  creativeFinance: boolean;
  coverage: string;
  highlight: boolean;
}

const competitors: Competitor[] = [
  {
    name: "Midas Property Auctions",
    successRate: "78%",
    avgOverGuide: "+12%",
    online: true,
    creativeFinance: true,
    coverage: "London / Essex",
    highlight: true,
  },
  {
    name: "Allsop",
    successRate: "92%",
    avgOverGuide: "+8%",
    online: true,
    creativeFinance: false,
    coverage: "National",
    highlight: false,
  },
  {
    name: "SDL Property Auctions",
    successRate: "81%",
    avgOverGuide: "+6%",
    online: true,
    creativeFinance: false,
    coverage: "Midlands / North",
    highlight: false,
  },
  {
    name: "Savills Auctions",
    successRate: "85%",
    avgOverGuide: "+9%",
    online: true,
    creativeFinance: false,
    coverage: "National",
    highlight: false,
  },
  {
    name: "iamsold",
    successRate: "95%",
    avgOverGuide: "+4%",
    online: true,
    creativeFinance: false,
    coverage: "National",
    highlight: false,
  },
  {
    name: "Network Auctions",
    successRate: "82%",
    avgOverGuide: "+7%",
    online: true,
    creativeFinance: false,
    coverage: "National",
    highlight: false,
  },
];

export default function CompetitorTable() {
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
        Market Position — Midas vs Competitors
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
              {[
                "Company",
                "Sales Success",
                "Avg Over Guide",
                "Online Platform",
                "Creative Finance",
                "UK Coverage",
              ].map((h) => (
                <th
                  key={h}
                  className="pb-3 text-left text-xs font-medium tracking-wider pr-4"
                  style={{ color: "var(--color-text-dim)" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {competitors.map((c) => (
              <tr
                key={c.name}
                style={{
                  borderBottom: "1px solid var(--color-border)",
                  borderLeft: c.highlight ? "3px solid var(--color-gold)" : "3px solid transparent",
                  backgroundColor: c.highlight ? "rgba(201,168,76,0.04)" : "transparent",
                }}
              >
                <td
                  className="py-3 pr-4 font-medium"
                  style={{ color: c.highlight ? "var(--color-gold)" : "var(--color-text)" }}
                >
                  {c.name}
                </td>
                <td className="py-3 pr-4 font-semibold" style={{ color: "var(--color-text)" }}>
                  {c.successRate}
                </td>
                <td
                  className="py-3 pr-4 font-semibold"
                  style={{ color: "#22c55e" }}
                >
                  {c.avgOverGuide}
                </td>
                <td className="py-3 pr-4">
                  {c.online ? (
                    <Check size={15} style={{ color: "#22c55e" }} />
                  ) : (
                    <X size={15} style={{ color: "#ef4444" }} />
                  )}
                </td>
                <td className="py-3 pr-4">
                  {c.creativeFinance ? (
                    <Check size={15} style={{ color: "#22c55e" }} />
                  ) : (
                    <X size={15} style={{ color: "#ef4444" }} />
                  )}
                </td>
                <td className="py-3" style={{ color: "var(--color-text-dim)" }}>
                  {c.coverage}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        className="mt-4 rounded p-4 text-sm"
        style={{
          backgroundColor: "rgba(201,168,76,0.06)",
          borderLeft: "3px solid var(--color-gold)",
          color: "var(--color-text)",
        }}
      >
        <strong style={{ color: "var(--color-gold)" }}>Midas competitive edge:</strong> Only auction
        house in the segment offering structured creative finance on the vendor side. Target: grow sales
        success rate to 85%+ by Q4 2026.
      </div>
    </div>
  );
}
