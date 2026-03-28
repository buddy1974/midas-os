"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";

export default function InviteButton() {
  const [toast, setToast] = useState(false);

  function handleClick() {
    setToast(true);
    setTimeout(() => setToast(false), 3000);
  }

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold"
        style={{
          backgroundColor: "rgba(201,168,76,0.12)",
          border: "1px solid var(--color-border)",
          color: "var(--color-gold)",
        }}
      >
        <UserPlus size={12} />
        Invite Member
      </button>
      {toast && (
        <div
          className="absolute right-0 top-9 z-10 px-3 py-2 rounded text-xs whitespace-nowrap"
          style={{
            backgroundColor: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-dim)",
          }}
        >
          Coming soon — invite system in Phase 4
        </div>
      )}
    </div>
  );
}
