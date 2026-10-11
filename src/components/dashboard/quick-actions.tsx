import Link from "next/link";
import { BarChart3, MessageSquarePlus, Plus, UserRoundCheck, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

// "Télécharger mon CV" is in the mockup but CV export does not exist yet: the slot goes to the
// closest real action instead of a dead button.
const ACTIONS: { href: string; label: string; icon: LucideIcon; tile: string }[] = [
  {
    href: "/dashboard/settings",
    label: "Compléter mon profil",
    icon: UserRoundCheck,
    tile: "bg-blue-100 text-brand",
  },
  {
    href: "/dashboard/assessments",
    label: "Passer une évaluation",
    icon: BarChart3,
    tile: "bg-blue-100 text-brand",
  },
  { href: "/dashboard/projects", label: "Ajouter un projet", icon: Plus, tile: "bg-brand text-white" },
  {
    href: "/dashboard/recommendations",
    label: "Demander une recommandation",
    icon: MessageSquarePlus,
    tile: "bg-blue-100 text-brand",
  },
];

export function QuickActions({ showAssessments }: { showAssessments: boolean }) {
  return (
    <nav aria-label="Actions rapides">
      <ul className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {ACTIONS.filter((a) => showAssessments || a.href !== "/dashboard/assessments").map(
          ({ href, label, icon: Icon, tile }) => (
            <li key={href}>
              <Link
                href={href}
                className="border-border/60 shadow-soft hover:shadow-lift flex h-full flex-col items-center gap-3 rounded-2xl border bg-white px-3 py-5 text-center transition-all hover:-translate-y-0.5"
              >
                <span className={cn("flex size-12 items-center justify-center rounded-full", tile)}>
                  <Icon className="size-6" aria-hidden />
                </span>
                <span className="text-navy text-sm leading-snug font-medium">{label}</span>
              </Link>
            </li>
          ),
        )}
      </ul>
    </nav>
  );
}
