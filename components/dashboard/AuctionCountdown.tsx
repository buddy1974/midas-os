"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const AUCTION_DATE = new Date("2026-04-14T12:00:00");

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getTimeLeft(): TimeLeft {
  const now = new Date();
  const diff = Math.max(0, AUCTION_DATE.getTime() - now.getTime());
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function AuctionCountdown() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(getTimeLeft());

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="rounded-lg p-5 h-full flex flex-col"
      style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
      }}
    >
      <p className="text-xs tracking-widest uppercase mb-4" style={{ color: "var(--color-text-dim)" }}>
        Next Auction
      </p>

      <p className="text-base font-semibold mb-1" style={{ color: "var(--color-text)" }}>
        Midas Spring Sale 2026
      </p>
      <p className="text-xs mb-6" style={{ color: "var(--color-text-dim)" }}>
        14 Apr 2026 · 12:00 noon
      </p>

      {/* Countdown */}
      <div className="grid grid-cols-4 gap-2 mb-5">
        {[
          { label: "Days", value: timeLeft.days },
          { label: "Hrs", value: timeLeft.hours },
          { label: "Min", value: timeLeft.minutes },
          { label: "Sec", value: timeLeft.seconds },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="flex flex-col items-center rounded-md py-3"
            style={{ backgroundColor: "var(--color-surface-2)" }}
          >
            <span
              className="text-xl font-semibold tabular-nums"
              style={{ color: "var(--color-gold)" }}
            >
              {pad(value)}
            </span>
            <span className="text-xs mt-0.5" style={{ color: "var(--color-text-dim)" }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      <p className="text-xs mb-6" style={{ color: "var(--color-text-dim)" }}>
        12 lots · 34 bidders enrolled
      </p>

      <Link
        href="/pipeline"
        className="mt-auto inline-block text-center py-2.5 px-4 rounded text-sm font-semibold tracking-wide transition-opacity"
        style={{
          backgroundColor: "rgba(201,168,76,0.12)",
          border: "1px solid var(--color-border)",
          color: "var(--color-gold)",
        }}
      >
        Manage Auction →
      </Link>
    </div>
  );
}
