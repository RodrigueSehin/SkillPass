"use client";

import Link from "next/link";
import { Building2, ChevronDown, ClipboardCheck, IdCard, LogOut, Settings, ShieldCheck } from "lucide-react";
import { logoutAction } from "@/app/(auth)/actions";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import type { AvatarRef } from "@/lib/avatars";
import { HeaderMenu } from "./header-menu";

interface UserMenuProps {
  name: string;
  roleLabel: string;
  /** Reviewer roles get a shortcut to the pending validations. */
  canReview: boolean;
  avatar?: AvatarRef | null;
  profileId?: string;
  /** Holds a role in a company: the menu offers the switch to SkillPass Business. */
  hasOrganization?: boolean;
  /** The general administrator of SkillPass: the menu offers the administration console. */
  isPlatformAdmin?: boolean;
}

const itemClass =
  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground hover:bg-slate-100";

export function UserMenu({
  name,
  roleLabel,
  canReview,
  avatar,
  profileId,
  hasOrganization,
  isPlatformAdmin,
}: UserMenuProps) {
  return (
    <HeaderMenu
      label="Menu du compte"
      panelRole="menu"
      panelClassName="w-60"
      triggerClassName="gap-3 py-1 pr-2 pl-1"
      trigger={
        <>
          <ProfileAvatar
            name={name}
            avatar={avatar}
            profileId={profileId}
            className="bg-navy size-10 text-sm text-white"
          />
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
      {hasOrganization && (
        <Link href="/business" role="menuitem" className={itemClass}>
          <Building2 className="size-4" aria-hidden /> Organisation
        </Link>
      )}
      {isPlatformAdmin && (
        <Link href="/admin" role="menuitem" className={itemClass}>
          <ShieldCheck className="size-4" aria-hidden /> Console SkillPass
        </Link>
      )}
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
