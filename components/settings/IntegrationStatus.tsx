"use client";

import { CheckCircle, AlertTriangle } from "lucide-react";

interface IntegrationStatusProps {
  hasDb: boolean;
  hasAuth: boolean;
  hasAnthropic: boolean;
  hasResend: boolean;
}

interface Integration {
  label: string;
  connected: boolean;
  envVar: string;
  connectedNote: string;
  disconnectedNote: string;
}

export default function IntegrationStatus({
  hasDb,
  hasAuth,
  hasAnthropic,
  hasResend,
}: IntegrationStatusProps) {
  const integrations: Integration[] = [
    {
      label: "Database (Neon)",
      connected: hasDb,
      envVar: "DATABASE_URL",
      connectedNote: "Connected",
      disconnectedNote: "Not configured",
    },
    {
      label: "Authentication",
      connected: hasAuth,
      envVar: "NEXTAUTH_SECRET",
      connectedNote: "Active",
      disconnectedNote: "Not configured",
    },
    {
      label: "AI Oracle (Anthropic)",
      connected: hasAnthropic,
      envVar: "ANTHROPIC_API_KEY",
      connectedNote: "Active",
      disconnectedNote: "Demo mode",
    },
    {
      label: "Email (Resend)",
      connected: hasResend,
      envVar: "RESEND_API_KEY",
      connectedNote: "Active",
      disconnectedNote: "Not configured",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {integrations.map((item) => (
        <div
          key={item.label}
          className="rounded-lg p-4 flex items-start gap-3"
          style={{
            backgroundColor: "var(--color-surface-2)",
            border: `1px solid ${item.connected ? "rgba(34,197,94,0.2)" : "var(--color-border)"}`,
          }}
        >
          {item.connected ? (
            <CheckCircle size={18} style={{ color: "#22c55e", flexShrink: 0, marginTop: "1px" }} />
          ) : (
            <AlertTriangle size={18} style={{ color: "#f59e0b", flexShrink: 0, marginTop: "1px" }} />
          )}
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
              {item.label}
            </p>
            <p
              className="text-xs mt-0.5"
              style={{ color: item.connected ? "#22c55e" : "#f59e0b" }}
            >
              {item.connected ? `✅ ${item.connectedNote}` : `⚠ ${item.disconnectedNote}`}
            </p>
            {!item.connected && (
              <p className="text-xs mt-1" style={{ color: "var(--color-text-dim)" }}>
                Set <code
                  className="px-1 py-0.5 rounded text-xs"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)", fontFamily: "monospace" }}
                >
                  {item.envVar}
                </code>{" "}
                in .env.local
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
