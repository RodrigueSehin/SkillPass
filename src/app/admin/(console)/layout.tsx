import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { ConsoleNav } from "@/components/admin/console-nav";
import { requirePlatformAdmin } from "@/lib/auth/platform-admin";
import { getPlatformAdminService } from "@/services/container";

export const dynamic = "force-dynamic";

/** Shell of the SkillPass administration console. Only the general administrator gets past this point. */
export default async function AdminConsoleLayout({ children }: LayoutProps<"/admin">) {
  const { user, profile } = await requirePlatformAdmin();
  const pending = (await getPlatformAdminService().listOrganizations(user.id, "PENDING")).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-navy text-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-4">
            <Logo href="/admin" />
            <span className="rounded-md bg-white/15 px-2.5 py-1 text-xs font-semibold">
              Console SkillPass
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/business" className="hover:underline">
              SkillPass Business
            </Link>
            <Link href="/dashboard" className="hover:underline">
              Espace talent
            </Link>
            <span className="hidden text-white/70 sm:inline">{profile.fullName}</span>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl items-start gap-6 px-4 py-6 lg:grid-cols-[250px_minmax(0,1fr)]">
        <ConsoleNav pending={pending} />
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
