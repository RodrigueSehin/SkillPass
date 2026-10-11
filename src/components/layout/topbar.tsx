import { Bell, MessageSquare } from "lucide-react";
import type { AvatarRef } from "@/lib/avatars";
import { GlobalSearch } from "./global-search";
import { HeaderMenu } from "./header-menu";
import { Logo } from "./logo";
import { UserMenu } from "./user-menu";

export interface TopbarUser {
  name: string;
  roleLabel: string;
  canReview: boolean;
  avatar?: AvatarRef | null;
  profileId?: string;
  hasOrganization?: boolean;
  isPlatformAdmin?: boolean;
}

export function Topbar({ user }: { user: TopbarUser }) {
  return (
    <header className="border-border/70 sticky top-0 z-20 flex h-[4.5rem] items-center gap-3 border-b bg-white/85 px-4 backdrop-blur sm:px-6">
      <Logo href="/dashboard" size="sm" className="lg:hidden" />
      <GlobalSearch />
      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <HeaderMenu
          label="Notifications"
          triggerClassName="size-11 justify-center text-slate-600"
          trigger={<Bell className="size-5" aria-hidden />}
        >
          <p className="text-muted px-3 py-4 text-sm">
            Aucune notification pour l&apos;instant. Vous serez prévenu ici d&apos;une vérification, d&apos;un
            badge ou d&apos;une recommandation.
          </p>
        </HeaderMenu>
        <HeaderMenu
          label="Messages"
          triggerClassName="size-11 justify-center text-slate-600"
          trigger={<MessageSquare className="size-5" aria-hidden />}
        >
          <p className="text-muted px-3 py-4 text-sm">La messagerie arrive avec SkillPass Business.</p>
        </HeaderMenu>
        <span aria-hidden className="bg-border mx-1 hidden h-8 w-px sm:block" />
        <UserMenu
          name={user.name}
          roleLabel={user.roleLabel}
          canReview={user.canReview}
          avatar={user.avatar}
          profileId={user.profileId}
          hasOrganization={user.hasOrganization}
          isPlatformAdmin={user.isPlatformAdmin}
        />
      </div>
    </header>
  );
}
