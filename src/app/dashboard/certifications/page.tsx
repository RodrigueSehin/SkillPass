import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Award, ChevronRight, ClipboardCheck } from "lucide-react";
import heroPhoto from "@/assets/skills/hero.jpg";
import {
  AddCertificationButton,
  CertificationEditor,
} from "@/components/certifications/certification-editor";
import { CertificationCard } from "@/components/certifications/certification-card";
import {
  CertificationFilters,
  CertificationSort,
  CertificationTabs,
} from "@/components/certifications/certification-controls";
import { CertificationStatus, UpcomingExpiries } from "@/components/certifications/certification-side";
import type { ItemView } from "@/components/resources/resource-manager";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/current-user";
import { certificationStats, filterCertifications } from "@/lib/certification-status";
import { getCertificationService } from "@/services/container";

export const metadata: Metadata = { title: "Certifications" };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function CertificationsPage({ searchParams }: PageProps<"/dashboard/certifications">) {
  const user = await requireUser();
  const raw = await searchParams;
  const all = await getCertificationService().list(user.id);
  const today = new Date().toISOString().slice(0, 10);

  const shown = filterCertifications(
    all,
    {
      tab: first(raw.tab),
      q: first(raw.q),
      issuer: first(raw.issuer),
      verification: first(raw.verification),
      sort: first(raw.sort),
    },
    today,
  );
  const stats = certificationStats(all, today);
  const issuers = [
    ...all.reduce((m, c) => m.set(c.issuer, (m.get(c.issuer) ?? 0) + 1), new Map<string, number>()),
  ]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "fr"));
  const counts = {
    all: stats.total,
    obtained: stats.active + stats.expiring,
    expiring: stats.expiring,
    expired: stats.expired,
  };

  const view = (c: (typeof all)[number]): ItemView => ({
    id: c.id,
    title: c.name,
    subtitle: c.issuer,
    lines: [],
    badges: [],
    links: [],
    values: {
      name: c.name,
      issuer: c.issuer,
      issueDate: c.issueDate,
      expirationDate: c.expirationDate ?? "",
      credentialId: c.credentialId ?? "",
      credentialUrl: c.credentialUrl ?? "",
    },
  });

  return (
    <CertificationEditor>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-navy flex items-center gap-3 text-2xl font-bold tracking-tight sm:text-3xl">
              <Award className="text-brand size-8" aria-hidden /> Certifications
            </h1>
            <p className="text-muted mt-1">
              Valorisez vos acquis et prouvez vos compétences avec des certifications reconnues.
            </p>
          </div>
          <nav aria-label="Fil d'Ariane" className="text-muted flex items-center gap-1.5 text-xs">
            <Link href="/dashboard" className="hover:text-brand">
              Accueil
            </Link>
            <ChevronRight className="size-3" aria-hidden /> <span aria-current="page">Certifications</span>
          </nav>
        </div>

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 space-y-6">
            <section
              aria-label="Présentation"
              className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-50 via-blue-100/70 to-blue-200/60 p-6 sm:p-8"
            >
              <div className="relative z-10 max-w-lg">
                <h2 className="text-navy text-2xl leading-tight font-extrabold sm:text-3xl">
                  Des certifications pour aller plus loin.
                </h2>
                <p className="text-navy/80 mt-3 text-sm sm:text-base">
                  Ajoutez vos certifications reconnues, renforcez votre crédibilité et faites-les vérifier.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <AddCertificationButton />
                  <Link
                    href="/dashboard/assessments"
                    className="text-brand border-brand/40 inline-flex h-11 items-center gap-2 rounded-xl border bg-white/70 px-5 text-sm font-semibold hover:bg-white"
                  >
                    <ClipboardCheck className="size-4" aria-hidden /> Passer une évaluation
                  </Link>
                </div>
              </div>
              <div aria-hidden className="absolute inset-y-0 right-0 hidden w-2/5 md:block">
                <Image
                  src={heroPhoto}
                  alt=""
                  fill
                  sizes="(min-width: 1280px) 360px, 280px"
                  className="[mask-image:linear-gradient(to_right,transparent,black_35%)] object-cover object-top"
                />
              </div>
            </section>

            <CertificationTabs counts={counts} />

            <div className="grid items-start gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
              <CertificationFilters issuers={issuers} />
              <section aria-label="Liste des certifications" className="min-w-0">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-navy text-lg font-bold">
                    {shown.length === all.length
                      ? `${all.length} certification${all.length > 1 ? "s" : ""}`
                      : `${shown.length} sur ${all.length} certifications`}
                  </h2>
                  <CertificationSort />
                </div>
                {all.length === 0 ? (
                  <EmptyState
                    icon={Award}
                    title="Aucune certification pour l'instant"
                    description="Ajoutez vos certifications pour les faire apparaître sur votre SkillPass."
                    action={<AddCertificationButton />}
                  />
                ) : shown.length === 0 ? (
                  <EmptyState
                    icon={Award}
                    title="Aucun résultat"
                    description="Modifiez vos filtres pour élargir la recherche."
                  />
                ) : (
                  <ul className="grid gap-4 min-[1800px]:grid-cols-3 sm:grid-cols-2">
                    {shown.map((c) => (
                      <li key={c.id}>
                        <CertificationCard cert={c} item={view(c)} today={today} />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </div>

          <aside className="grid min-w-0 gap-6 md:grid-cols-2 xl:grid-cols-1">
            <CertificationStatus stats={stats} year={today.slice(0, 4)} />
            <UpcomingExpiries items={all} today={today} />
          </aside>
        </div>
      </div>
    </CertificationEditor>
  );
}
