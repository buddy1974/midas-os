"use client";

import { useState } from "react";
import ROITab from "@/components/finance/ROITab";
import SDLTTab from "@/components/finance/SDLTTab";
import BridgingTab from "@/components/finance/BridgingTab";
import CashflowTab from "@/components/finance/CashflowTab";
import CreativeTab from "@/components/finance/CreativeTab";

const TABS = [
  { id: "roi", label: "ROI Calculator" },
  { id: "sdlt", label: "Stamp Duty" },
  { id: "bridging", label: "Bridging Loan" },
  { id: "cashflow", label: "Cashflow" },
  { id: "creative", label: "Creative Finance" },
];

export default function FinancePage() {
  const [active, setActive] = useState("roi");

  return (
    <div className="space-y-5">
      {/* Tab navigation */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className="px-4 py-2 rounded-full text-sm font-medium transition-colors"
              style={{
                backgroundColor: isActive ? "var(--color-gold)" : "var(--color-surface)",
                color: isActive ? "#080809" : "var(--color-text-dim)",
                border: isActive ? "none" : "1px solid var(--color-border)",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div>
        {active === "roi" && <ROITab />}
        {active === "sdlt" && <SDLTTab />}
        {active === "bridging" && <BridgingTab />}
        {active === "cashflow" && <CashflowTab />}
        {active === "creative" && <CreativeTab />}
      </div>
    </div>
  );
}
