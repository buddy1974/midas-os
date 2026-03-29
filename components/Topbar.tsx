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
  "/calendar": "Calendar",
  "/inbox": "Inbox",
  "/whatsapp": "WhatsApp",
  "/newsletter": "Newsletter",
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
      <h2
        className="hidden md:block text-sm font-semibold tracking-wide"
        style={{ color: "var(--color-text)" }}
      >
        {title}
      </h2>
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
