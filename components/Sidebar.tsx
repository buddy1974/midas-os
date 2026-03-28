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
  Settings,
  LogOut,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "AI Oracle", href: "/oracle", icon: Zap, badge: "AI" },
  { label: "Pipeline", href: "/pipeline", icon: Hammer },
  { label: "Finance", href: "/finance", icon: Calculator },
  { label: "CRM", href: "/crm", icon: Users },
  { label: "Campaigns", href: "/campaigns", icon: Mail, badge: "AI" },
  { label: "Market Pulse", href: "/market", icon: TrendingUp },
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
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors group"
              style={{
                backgroundColor: isActive ? "rgba(201,168,76,0.1)" : "transparent",
                color: isActive ? "var(--color-gold)" : "var(--color-text-dim)",
              }}
            >
              <Icon size={16} />
              <span className="flex-1">{item.label}</span>
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
            </Link>
          );
        })}
      </nav>

      {/* Settings divider + link */}
      <div
        className="px-3 py-3"
        style={{ borderTop: "1px solid var(--color-border)" }}
      >
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors"
          style={{
            backgroundColor: pathname === "/settings" ? "rgba(201,168,76,0.1)" : "transparent",
            color: pathname === "/settings" ? "var(--color-gold)" : "var(--color-text-dim)",
          }}
        >
          <Settings size={16} />
          <span>Settings</span>
        </Link>
      </div>

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
