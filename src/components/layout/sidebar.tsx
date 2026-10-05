"use client";

import { DASHBOARD_NAV, DASHBOARD_SECONDARY_NAV } from "@/config/navigation";
import { SidebarLink } from "./nav-link";
import { Logo } from "./logo";
import { ProCard } from "./pro-card";

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-gradient-to-b from-[#0a1d4d] to-[#0e2a6b] p-4 lg:flex">
      <div className="px-2 py-3">
        <Logo href="/dashboard" tone="light" size="lg" priority />
      </div>
      <nav
        aria-label="Navigation principale"
        className="no-scrollbar mt-4 min-h-0 flex-1 space-y-1 overflow-y-auto"
      >
        {DASHBOARD_NAV.map((item) => (
          <SidebarLink key={item.href} item={item} />
        ))}
      </nav>
      <nav aria-label="Navigation secondaire" className="space-y-1 border-t border-white/10 pt-3">
        {DASHBOARD_SECONDARY_NAV.map((item) => (
          <SidebarLink key={item.href} item={item} />
        ))}
      </nav>
      <div className="mt-4">
        <ProCard />
      </div>
    </aside>
  );
}
