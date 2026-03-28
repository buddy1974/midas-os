import IntegrationStatus from "@/components/settings/IntegrationStatus";
import InviteButton from "@/components/settings/InviteButton";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-xs uppercase tracking-widest mb-4"
      style={{ color: "var(--color-text-dim)" }}
    >
      {children}
    </p>
  );
}

const TEAM_MEMBERS = [
  {
    name: "Sam Fongho",
    email: "sam@midaspropertyauctions.co.uk",
    role: "Admin",
    status: "Active",
    statusColor: "#22c55e",
  },
  { name: "[Member 2]", email: "—", role: "Member", status: "Pending", statusColor: "#f59e0b" },
  { name: "[Member 3]", email: "—", role: "Member", status: "Pending", statusColor: "#f59e0b" },
];

const SYSTEM_INFO = [
  { label: "Version", value: "Midas OS v2.0" },
  { label: "Build", value: "Phase 3" },
  { label: "Stack", value: "Next.js 16 · Neon · NextAuth v5" },
  { label: "Company", value: "Midas Property Auctions" },
  { label: "Reg", value: "09522321" },
];

export default function SettingsPage() {
  // Read env vars server-side — never exposed to client
  const hasDb = !!process.env.DATABASE_URL;
  const hasAuth = !!process.env.NEXTAUTH_SECRET;
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
  const hasResend = !!process.env.RESEND_API_KEY;

  return (
    <div className="max-w-3xl space-y-8">
      {/* Section 1 — Team Members */}
      <div
        className="rounded-lg p-5"
        style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <SectionTitle>Team Members</SectionTitle>
          <InviteButton />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                {["Name", "Email", "Role", "Status"].map((h) => (
                  <th
                    key={h}
                    className="pb-3 text-left text-xs font-medium tracking-wider pr-6"
                    style={{ color: "var(--color-text-dim)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TEAM_MEMBERS.map((member) => (
                <tr key={member.name} style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td className="py-3 pr-6 font-medium" style={{ color: "var(--color-text)" }}>
                    {member.name}
                  </td>
                  <td className="py-3 pr-6" style={{ color: "var(--color-text-dim)" }}>
                    {member.email}
                  </td>
                  <td className="py-3 pr-6" style={{ color: "var(--color-text-dim)" }}>
                    {member.role}
                  </td>
                  <td className="py-3">
                    <span className="text-xs font-semibold" style={{ color: member.statusColor }}>
                      {member.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2 — Integration Status */}
      <div
        className="rounded-lg p-5"
        style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
      >
        <SectionTitle>Integration Status</SectionTitle>
        <IntegrationStatus
          hasDb={hasDb}
          hasAuth={hasAuth}
          hasAnthropic={hasAnthropic}
          hasResend={hasResend}
        />
      </div>

      {/* Section 3 — System Info */}
      <div
        className="rounded-lg p-5"
        style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
      >
        <SectionTitle>System Info</SectionTitle>
        <div className="grid grid-cols-2 gap-4">
          {SYSTEM_INFO.map(({ label, value }) => (
            <div key={label}>
              <p
                className="text-xs uppercase tracking-wider"
                style={{ color: "var(--color-text-dim)" }}
              >
                {label}
              </p>
              <p className="text-sm font-medium mt-0.5" style={{ color: "var(--color-text)" }}>
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
