"use client";

import Link from "next/link";
import { ChevronDown, ClipboardCheck, IdCard, LogOut, Settings } from "lucide-react";
import { logoutAction } from "@/app/(auth)/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { HeaderMenu } from "./header-menu";

interface UserMenuProps {
  name: string;
  roleLabel: string;
  /** Reviewer roles get a shortcut to the pending validations. */
  canReview: boolean;
}

const itemClass =
  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground hover:bg-slate-100";

export function UserMenu({ name, roleLabel, canReview }: UserMenuProps) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <HeaderMenu
      label="Menu du compte"
      panelRole="menu"
      panelClassName="w-60"
      triggerClassName="gap-3 py-1 pr-2 pl-1"
      trigger={
        <>
          <Avatar className="size-10">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className="hidden text-left leading-tight md:block">
            <span className="text-foreground block text-sm font-semibold">{name}</span>
            <span className="text-muted block text-xs">{roleLabel}</span>
          </span>
          <ChevronDown className="hidden size-4 text-slate-500 md:block" aria-hidden />
        </>
      }
    >
      <Link href="/dashboard/skillpass" role="menuitem" className={itemClass}>
        <IdCard className="size-4" aria-hidden /> Mon SkillPass
      </Link>
      <Link href="/dashboard/settings" role="menuitem" className={itemClass}>
        <Settings className="size-4" aria-hidden /> Paramètres
      </Link>
      {canReview && (
        <Link href="/admin/verifications" role="menuitem" className={itemClass}>
          <ClipboardCheck className="size-4" aria-hidden /> Validations en attente
        </Link>
      )}
      <form action={logoutAction} className="border-border mt-1 border-t pt-1">
        <button type="submit" role="menuitem" className={`${itemClass} text-danger`}>
          <LogOut className="size-4" aria-hidden /> Déconnexion
        </button>
      </form>
    </HeaderMenu>
  );
}
