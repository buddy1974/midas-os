"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Settings } from "lucide-react";

const PAGE_TITLES: Record<string, string> = {
  "/": "Command Centre",
  "/oracle": "AI Oracle",
  "/pipeline": "Pipeline",
  "/finance": "Finance",
  "/crm": "CRM",
  "/campaigns": "Campaigns",
  "/market": "Market Pulse",
  "/settings": "Settings",
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

export default function Topbar() {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? "Midas OS";

  return (
    <header
      className="flex items-center justify-between px-6 shrink-0"
      style={{
        height: "52px",
        backgroundColor: "var(--color-surface)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      <h2
        className="text-sm font-semibold tracking-wide"
        style={{ color: "var(--color-text)" }}
      >
        {title}
      </h2>

      <div className="flex items-center gap-4 text-xs" style={{ color: "var(--color-text-dim)" }}>
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
