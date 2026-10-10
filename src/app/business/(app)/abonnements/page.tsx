import type { Metadata } from "next";
import {
  BarChart3,
  Briefcase,
  Check,
  ChevronDown,
  CircleCheck,
  ClipboardCheck,
  Headset,
  Plug,
  Settings,
  Sparkles,
  UserSearch,
  Users,
  type LucideIcon,
} from "lucide-react";
import { PlanCards } from "@/components/business/plan-cards";
import { PLAN_ICONS, PLAN_TINTS } from "@/components/business/plan-icons";
import { SoonBadge } from "@/components/business/settings/rows";
import { Panel } from "@/components/business/ui";
import { requireBusiness } from "@/lib/business/context";
import { formatFcfa, PLAN_COMPARISON, PLANS } from "@/lib/business/plans";
import { cn } from "@/lib/utils/cn";
import { getJobOfferService, getOrganizationService } from "@/services/container";
import type { PlanCode } from "@/types/business";

export const metadata: Metadata = { title: "Abonnement" };
export const dynamic = "force-dynamic";

const ORDER: PlanCode[] = ["STARTER", "PRO", "BUSINESS", "ENTERPRISE"];
const ROW_ICONS: Record<string, LucideIcon> = {
  "Membres de l'organisation": Users,
  "Offres d'emploi / mois": Briefcase,
  "Accès à la base de talents": UserSearch,
  "Matching IA": Sparkles,
  "Évaluations de compétences": ClipboardCheck,
  "Analytics avancés": BarChart3,
  "Intégrations (API, SIRH, …)": Plug,
  "Support dédié": Headset,
};
const FAQ = [
  {
    q: "Puis-je changer de plan à tout moment ?",
    a: "Oui. Un changement de plan prend effet tout de suite, à condition que le nouveau plan accepte le nombre actuel de membres de l'organisation. Le paiement en ligne n'étant pas encore ouvert, le changement n'est pas encore possible depuis cette page.",
  },
  {
    q: "Quels moyens de paiement acceptez-vous ?",
    a: "Le paiement en ligne n'est pas encore ouvert. Les moyens de paiement acceptés seront précisés à son ouverture.",
  },
  {
    q: "Y a-t-il un engagement de durée ?",
    a: "La durée d'engagement sera précisée à l'ouverture du paiement en ligne. La facturation annuelle offre 20 % de réduction sur le prix mensuel.",
  },
];

export default async function SubscriptionPage() {
  const ctx = await requireBusiness();
  const orgId = ctx.organization.id;
  const [members, published] = await Promise.all([
    getOrganizationService().listMembers(orgId),
    getJobOfferService().publishedThisMonth(orgId),
  ]);
  const code = ctx.organization.plan;
  const plan = PLANS[code];
  const canEdit = ctx.can("org.manage") && ctx.member.role === "ADMIN";

  return (
    <div className="space-y-6">
      <PlanCards
        header={
          <div>
            <h1 className="text-navy text-2xl font-bold tracking-tight sm:text-3xl">Abonnement</h1>
            <p className="text-muted mt-1">
              Choisissez le plan qui correspond aux besoins de votre organisation et accédez aux meilleurs
              talents.
            </p>
          </div>
        }
        current={code}
        canSwitch={process.env.NODE_ENV !== "production"}
        canEdit={canEdit}
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Panel className="min-w-0 p-5">
          <h2 className="text-navy text-lg font-bold">Comparatif des fonctionnalités</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="text-navy bg-slate-50 text-xs font-semibold">
                  <th scope="col" className="px-3 py-2.5">
                    Fonctionnalités
                  </th>
                  {ORDER.map((c) => (
                    <th
                      key={c}
                      scope="col"
                      className={cn("px-3 py-2.5 text-center", c === code && "bg-brand text-white")}
                    >
                      {PLANS[c].name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {PLAN_COMPARISON.map((row) => (
                  <tr key={row.label}>
                    <th scope="row" className="text-navy px-3 py-2.5 font-medium">
                      <span className="flex items-center gap-3">
                        {(() => {
                          const RowIcon = ROW_ICONS[row.label] ?? CircleCheck;
                          return <RowIcon className="text-muted size-4 shrink-0" aria-hidden />;
                        })()}
                        {row.label}
                      </span>
                    </th>
                    {ORDER.map((c) => {
                      const v = row.values[c];
                      return (
                        <td key={c} className={cn("px-3 py-2.5 text-center", c === code && "bg-blue-50/60")}>
                          {typeof v === "string" ? (
                            <span className="text-navy font-medium">{v}</span>
                          ) : v ? (
                            <span
                              className={cn(
                                "mx-auto flex size-5 items-center justify-center rounded-full text-white",
                                PLAN_TINTS[c].check,
                              )}
                            >
                              <Check className="size-3" strokeWidth={3} aria-label="Inclus" />
                            </span>
                          ) : (
                            <span className="block text-center text-slate-300" aria-label="Non inclus">
                              —
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-muted mt-3 text-xs">
            Pour l&apos;instant, l&apos;application applique la limite de membres et la limite d&apos;offres
            par mois ; les autres fonctionnalités arrivent au fil des étapes.
          </p>
        </Panel>

        <aside className="space-y-6">
          <Panel className="p-5">
            <h2 className="text-navy font-bold">Votre abonnement actuel</h2>
            <div className="mt-3 flex items-center gap-3">
              <span
                className={cn("flex size-12 items-center justify-center rounded-xl", PLAN_TINTS[code].tile)}
              >
                {(() => {
                  const PlanIcon = PLAN_ICONS[code];
                  return <PlanIcon className="size-6" aria-hidden />;
                })()}
              </span>
              <div>
                <p className="text-navy flex items-center gap-2 font-bold">
                  Plan {plan.name}{" "}
                  <span className="rounded-md bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
                    Actif
                  </span>
                </p>
                <p className="text-navy text-lg font-bold">
                  {plan.price === null ? "Sur devis" : `${formatFcfa(plan.price)} / mois`}
                </p>
              </div>
            </div>
            <ul className="mt-4 space-y-2.5 rounded-xl bg-slate-50 p-4 text-sm">
              <li className="flex items-center gap-2.5">
                <Users className="text-muted size-4" aria-hidden /> {members.length} membre
                {members.length > 1 ? "s" : ""} utilisé{members.length > 1 ? "s" : ""}
                {plan.maxMembers !== null ? ` sur ${plan.maxMembers}` : " (illimité)"}
              </li>
              <li className="flex items-center gap-2.5">
                <Briefcase className="text-muted size-4" aria-hidden /> {published} offre
                {published > 1 ? "s" : ""} publiée{published > 1 ? "s" : ""} ce mois
                {plan.maxJobsPerMonth !== null ? ` sur ${plan.maxJobsPerMonth}` : " (illimité)"}
              </li>
              <li className="flex items-center gap-2.5">
                <CircleCheck className="text-muted size-4" aria-hidden /> Fonctionnalités du plan {plan.name}{" "}
                incluses
              </li>
            </ul>
            <button
              type="button"
              disabled
              className="border-brand/40 text-brand mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-xl border bg-white text-sm font-semibold opacity-60"
            >
              <Settings className="size-4" aria-hidden /> Gérer mon abonnement <SoonBadge />
            </button>
            <p className="text-muted mt-3 text-xs">
              La facturation en ligne n&apos;est pas encore ouverte : aucune date de prochaine facturation.
            </p>
          </Panel>

          <Panel className="p-5">
            <h2 className="text-navy font-bold">Questions fréquentes</h2>
            <div className="mt-3 space-y-2">
              {FAQ.map((f) => (
                <details key={f.q} className="border-border/70 group rounded-xl border bg-white">
                  <summary className="text-navy flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-medium">
                    {f.q}{" "}
                    <ChevronDown
                      className="text-muted size-4 shrink-0 transition-transform group-open:rotate-180"
                      aria-hidden
                    />
                  </summary>
                  <p className="text-muted px-4 pb-3 text-sm">{f.a}</p>
                </details>
              ))}
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
