import { Bell, MessageSquare, Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Logo } from "./logo";
import { logoutAction } from "@/app/(auth)/actions";

interface TopbarProps {
  userName: string;
}

export function Topbar({ userName }: TopbarProps) {
  const initials = userName
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-surface/90 px-4 backdrop-blur sm:px-6">
      <Logo href="/dashboard" className="lg:hidden" />
      <form role="search" className="relative ml-auto hidden max-w-md flex-1 sm:ml-0 sm:block">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
        <input
          type="search"
          aria-label="Rechercher"
          placeholder="Rechercher une compétence, un projet…"
          className="h-10 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-sm"
        />
      </form>
      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Messages">
          <MessageSquare />
        </Button>
        <form action={logoutAction}>
          <Button variant="ghost" size="sm" type="submit" className="hidden sm:inline-flex">
            Déconnexion
          </Button>
        </form>
        <Avatar aria-label={userName}>
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
