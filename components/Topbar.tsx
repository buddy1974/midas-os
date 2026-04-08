"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, Settings } from "lucide-react";

const PAGE_TITLES: Record<string, string> = {
  "/": "Command Centre",
  "/oracle": "AI Oracle",
  "/pipeline": "Pipeline",
  "/finance": "Finance",
  "/crm": "CRM",
  "/campaigns": "Campaigns",
  "/market": "Market Pulse",
  "/settings": "Settings",
  "/assistant": "ARIA",
  "/secretary": "Secretary",
  "/calendar": "Events Manager",
  "/inbox": "Inbox",
  "/whatsapp": "WhatsApp",
  "/newsletter": "Newsletter",
  "/social": "Social Content",
  "/viewings": "Viewings",
  "/lenders": "Lender Portal",
  "/portfolio": "Portfolio Tracker",
};

const PAGE_DESCRIPTIONS: Record<string, string> = {
  "/": "Your business at a glance — revenue, lots, activity and upcoming auctions",
  "/oracle": "AI deal analyser — type any property, get a full investment verdict in 8 seconds",
  "/pipeline": "All your lots in one board — move them from sourcing to sold",
  "/finance": "5 calculators — ROI, Stamp Duty, Bridging, Cashflow and Creative Finance",
  "/crm": "All your investor contacts — search, score and filter in seconds",
  "/campaigns": "Send AI-powered email campaigns to your subscriber list",
  "/newsletter": "Your newsletter system — replacing Mailchimp, no monthly fee",
  "/social": "AI writes your LinkedIn, Instagram and Facebook posts from any lot",
  "/calendar": "Create and manage events — webinars, auctions, networking",
  "/viewings": "Book and manage property viewings — auto confirmation emails sent",
  "/lenders": "Your private lender database — find the right finance for any deal",
  "/portfolio": "Track investor portfolios — AI generates professional review reports",
  "/market": "UK auction market data — see where Midas stands vs competitors",
  "/assistant": "ARIA — your AI assistant knows your deals, contacts and pipeline",
  "/settings": "Team logins, integrations and system configuration",
  "/secretary": "Coming soon — AI email triage and auto-drafted replies",
  "/inbox": "Coming soon — priority inbox, VIP investors flagged instantly",
  "/whatsapp": "Coming soon — automated bidder alerts and overnight replies",
};

function LiveClock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    function update() {
      setTime(
        new Date().toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return <span>{time}</span>;
}

interface TopbarProps {
  onMenuOpen: () => void;
}

export default function Topbar({ onMenuOpen }: TopbarProps) {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? "Midas OS";
  const description = PAGE_DESCRIPTIONS[pathname] ?? "";

  return (
    <header
      className="flex items-center shrink-0 px-4 md:px-6"
      style={{
        height: "52px",
        backgroundColor: "var(--color-surface)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      {/* Mobile layout */}
      <div className="flex md:hidden items-center w-full gap-3">
        <button
          onClick={onMenuOpen}
          className="flex items-center justify-center rounded-md"
          style={{ color: "var(--color-text-dim)", minWidth: "44px", minHeight: "44px" }}
        >
          <Menu size={20} />
        </button>
        <span
          className="flex-1 text-center text-sm font-serif tracking-widest uppercase"
          style={{ color: "var(--color-gold)" }}
        >
          Midas OS
        </span>
        <span
          className="text-xs font-medium text-right"
          style={{ color: "var(--color-text-dim)", minWidth: "44px" }}
        >
          {title}
        </span>
      </div>

      {/* Desktop layout */}
      <div className="hidden md:flex items-center gap-0 min-w-0">
        <h2
          className="text-sm font-semibold tracking-wide shrink-0"
          style={{ color: "var(--color-text)" }}
        >
          {title}
        </h2>
        {description && (
          <>
            <span style={{ color: "#c9a84c", opacity: 0.5, margin: "0 8px", fontSize: "12px" }}>·</span>
            <span
              className="text-xs truncate"
              style={{ color: "rgba(232,228,220,0.4)" }}
            >
              {description}
            </span>
          </>
        )}
      </div>
      <div
        className="hidden md:flex ml-auto items-center gap-4 text-xs"
        style={{ color: "var(--color-text-dim)" }}
      >
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block rounded-full"
            style={{ width: "6px", height: "6px", backgroundColor: "#22c55e" }}
          />
          All Systems Online
        </span>
        <LiveClock />
        <button className="transition-colors" style={{ color: "var(--color-text-dim)" }}>
          <Settings size={15} />
        </button>
      </div>
    </header>
  );
}
