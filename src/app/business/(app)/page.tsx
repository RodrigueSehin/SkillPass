import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Building2, ChevronRight, Quote, UserPlus, UsersRound } from "lucide-react";
import heroOffice from "../../../../public/images/hero-office.png";
import { StatCard, Panel } from "@/components/business/ui";
import { requireBusiness } from "@/lib/business/context";
import { activeGrowth, pending } from "@/lib/business/org-stats";
import { PLANS, remainingSeats } from "@/lib/business/plans";
import { getOrganizationService } from "@/services/container";

export const metadata: Metadata = { title: "Tableau de bord" };
export const dynamic = "force-dynamic";

export default async function BusinessDashboardPage() {
  const ctx = await requireBusiness();
  const service = getOrganizationService();
  const orgId = ctx.organization.id;
  const [members, departments, sites] = await Promise.all([
    service.listMembers(orgId),
    service.listDepartments(orgId),
    service.listSites(orgId),
  ]);
  const growth = activeGrowth(members);
  const plan = PLANS[ctx.organization.plan];
  const left = remainingSeats(ctx.organization.plan, members.length);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-50 via-blue-100/70 to-blue-200/60 p-6 sm:p-8">
        <div className="relative z-10 max-w-md">
          <p className="text-navy text-xl font-bold">Bonjour,</p>
          <h1 className="text-navy mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {ctx.organization.name}
          </h1>
          <p className="text-navy/80 mt-3 text-sm sm:text-base">
            Trouvez, recrutez et développez les meilleurs talents.
          </p>
        </div>
        <div aria-hidden className="absolute inset-y-0 right-[22%] hidden w-[34%] md:block">
          <Image
            src={heroOffice}
            alt=""
            fill
            sizes="420px"
            className="[mask-image:linear-gradient(to_right,transparent,black_35%)] object-cover object-top"
          />
        </div>
        <figure className="shadow-soft absolute top-1/2 right-5 hidden w-[20%] min-w-44 -translate-y-1/2 rounded-2xl bg-white/80 p-4 backdrop-blur lg:block">
          <Quote className="text-brand size-6 fill-current" aria-hidden />
          <blockquote className="text-navy mt-1 text-sm leading-snug font-semibold">
            Des talents qualifiés aujourd&apos;hui pour les défis de demain.
          </blockquote>
          <span aria-hidden className="bg-orange mt-3 block h-1 w-10 rounded-full" />
        </figure>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={UsersRound}
          tone="bg-blue-50 text-brand"
          value={growth.active}
          label="Membres actifs"
          chip={
            growth.deltaPercent === null
              ? null
              : {
                  text: `${growth.deltaPercent >= 0 ? "+" : ""}${growth.deltaPercent}%`,
                  tone: growth.deltaPercent < 0 ? "down" : "up",
                }
          }
          caption={growth.deltaPercent === null ? "Nouvelle organisation" : "sur le mois dernier"}
        />
        <StatCard
          icon={Building2}
          tone="bg-violet-100 text-violet-700"
          value={departments.length}
          label="Départements"
          caption={`${sites.length} site${sites.length > 1 ? "s" : ""}`}
        />
        <StatCard
          icon={UserPlus}
          tone="bg-orange-100 text-orange-600"
          value={pending(members).length}
          label="Invitations en attente"
          caption="en attente de réponse"
        />
        <StatCard
          icon={UsersRound}
          tone="bg-green-100 text-green-700"
          value={left === null ? "∞" : left}
          label="Places restantes"
          caption={`Plan ${plan.name}`}
        />
      </div>

      <Panel className="p-6">
        <h2 className="text-navy font-bold">Actions rapides</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            {
              href: "/business/equipes/membres/nouveau",
              label: "Inviter un membre",
              show: ctx.can("team.manage"),
            },
            {
              href: "/business/organisation/departements/nouveau",
              label: "Ajouter un département",
              show: ctx.can("team.manage"),
            },
            { href: "/business/organisation", label: "Voir mon organisation", show: true },
          ]
            .filter((a) => a.show)
            .map((a) => (
              <li key={a.href}>
                <Link
                  href={a.href}
                  className="border-border text-navy flex h-12 items-center justify-between rounded-xl border bg-white px-4 text-sm font-medium hover:bg-blue-50"
                >
                  {a.label} <ChevronRight className="text-brand size-4" aria-hidden />
                </Link>
              </li>
            ))}
        </ul>
      </Panel>
    </div>
  );
}
