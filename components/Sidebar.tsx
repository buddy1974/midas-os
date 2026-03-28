"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Zap,
  Hammer,
  Calculator,
  Users,
  Mail,
  TrendingUp,
  MessageSquare,
  Calendar,
  Inbox,
  MessageCircle,
  Send,
  Settings,
  LogOut,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  badgeCount?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "Intelligence",
    items: [
      { label: "ARIA Assistant", href: "/assistant", icon: MessageSquare, badge: "AI" },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Dashboard", href: "/", icon: LayoutDashboard },
      { label: "AI Oracle", href: "/oracle", icon: Zap, badge: "AI" },
      { label: "Pipeline", href: "/pipeline", icon: Hammer },
      { label: "Finance", href: "/finance", icon: Calculator },
      { label: "CRM", href: "/crm", icon: Users },
      { label: "Campaigns", href: "/campaigns", icon: Mail, badge: "AI" },
      { label: "Market Pulse", href: "/market", icon: TrendingUp },
    ],
  },
  {
    title: "Automation",
    items: [
      { label: "Virtual Secretary", href: "/secretary", icon: Mail, badge: "NEW" },
      { label: "Smart Calendar", href: "/calendar", icon: Calendar },
      { label: "Email Inbox", href: "/inbox", icon: Inbox, badgeCount: 5 },
    ],
  },
  {
    title: "Communication",
    items: [
      { label: "WhatsApp Hub", href: "/whatsapp", icon: MessageCircle },
      { label: "Newsletter", href: "/newsletter", icon: Send },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

interface SidebarProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  async function handleSignOut() {
    await signOut({ redirect: false });
    router.push("/login");
  }

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  return (
    <aside
      className="flex flex-col h-screen shrink-0"
      style={{
        width: "220px",
        backgroundColor: "var(--color-surface)",
        borderRight: "1px solid var(--color-border)",
      }}
    >
      {/* Brand */}
      <div
        className="px-5 py-6"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        <h1
          className="text-lg font-serif tracking-widest uppercase"
          style={{ color: "var(--color-gold)" }}
        >
          Midas OS
        </h1>
        <p className="text-xs tracking-wider mt-0.5" style={{ color: "var(--color-text-dim)" }}>
          Property Intelligence
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
        {navSections.map((section) => (
          <div key={section.title}>
            <p
              className="px-3 mb-1 text-xs font-semibold tracking-widest uppercase"
              style={{ color: "var(--color-text-dim)", fontSize: "10px" }}
            >
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors"
                    style={{
                      backgroundColor: active ? "rgba(201,168,76,0.1)" : "transparent",
                      color: active ? "var(--color-gold)" : "var(--color-text-dim)",
                    }}
                  >
                    <Icon size={15} />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded font-semibold"
                        style={{
                          backgroundColor: "rgba(201,168,76,0.15)",
                          color: "var(--color-gold)",
                          fontSize: "10px",
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                    {item.badgeCount !== undefined && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                        style={{
                          backgroundColor: "var(--color-gold)",
                          color: "#0F0F13",
                          fontSize: "10px",
                          minWidth: "18px",
                          textAlign: "center",
                        }}
                      >
                        {item.badgeCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div
        className="px-4 py-4"
        style={{ borderTop: "1px solid var(--color-border)" }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div
            className="flex items-center justify-center rounded-full text-xs font-bold shrink-0"
            style={{
              width: "34px",
              height: "34px",
              backgroundColor: "rgba(201,168,76,0.15)",
              color: "var(--color-gold)",
              border: "1px solid var(--color-border)",
            }}
          >
            {initials}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-medium truncate" style={{ color: "var(--color-text)" }}>
              {user.name}
            </p>
            <p className="text-xs capitalize" style={{ color: "var(--color-text-dim)" }}>
              {user.role}
            </p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 text-xs w-full px-2 py-1.5 rounded transition-colors"
          style={{ color: "var(--color-text-dim)" }}
        >
          <LogOut size={13} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
