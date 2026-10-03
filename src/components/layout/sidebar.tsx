"use client";

import { DASHBOARD_NAV, DASHBOARD_SECONDARY_NAV } from "@/config/navigation";
import { SidebarLink } from "./nav-link";
import { Logo } from "./logo";

export function Sidebar() {
  return (
    <aside className="bg-navy fixed inset-y-0 left-0 z-30 hidden w-64 flex-col p-4 lg:flex">
      <div className="px-2 py-3">
        <Logo href="/dashboard" tone="light" size="lg" />
      </div>
      <nav aria-label="Navigation principale" className="mt-6 flex-1 space-y-1 overflow-y-auto">
        {DASHBOARD_NAV.map((item) => (
          <SidebarLink key={item.href} item={item} />
        ))}
      </nav>
      <nav aria-label="Navigation secondaire" className="space-y-1 border-t border-white/10 pt-4">
        {DASHBOARD_SECONDARY_NAV.map((item) => (
          <SidebarLink key={item.href} item={item} />
        ))}
      </nav>
    </aside>
  );
}
