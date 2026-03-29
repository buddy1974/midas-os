"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

interface ShellClientProps {
  user: { name: string; email: string; role: string };
  children: React.ReactNode;
}

export default function ShellClient({ user, children }: ShellClientProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "var(--color-surface)" }}>
      <Sidebar
        user={user}
        drawerOpen={drawerOpen}
        onMenuOpen={() => setDrawerOpen(true)}
        onDrawerClose={() => setDrawerOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar onMenuOpen={() => setDrawerOpen(true)} />
        <main
          className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 pb-24 md:pb-6"
          style={{ backgroundColor: "#080809" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
