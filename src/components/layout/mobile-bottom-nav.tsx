"use client";

import { MOBILE_NAV } from "@/config/navigation";
import { BottomNavLink } from "./nav-link";

export function MobileBottomNav() {
  return (
    <nav
      aria-label="Navigation mobile"
      className="border-border bg-surface/95 fixed inset-x-0 bottom-0 z-30 flex border-t backdrop-blur lg:hidden"
    >
      {MOBILE_NAV.map((item) => (
        <BottomNavLink key={item.href} item={item} />
      ))}
    </nav>
  );
}
