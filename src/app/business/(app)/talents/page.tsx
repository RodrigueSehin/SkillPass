import type { Metadata } from "next";
import { BadgeCheck, Target, Users } from "lucide-react";
import { Pagination } from "@/components/business/pagination";
import { TalentCard } from "@/components/business/talent-cards";
import { parseTalentTab, TalentPanel } from "@/components/business/talent-panel";
import { TalentSort } from "@/components/business/talent-sort";
import { TalentsFilters } from "@/components/business/talents-filters";
import { NoAccess, Panel, StatCard } from "@/components/business/ui";
import { requireBusiness } from "@/lib/business/context";
import {
  directoryStats,
  locationOptions,
  parseTalentFilters,
  searchTalents,
  talentScore,
  TALENTS_PER_PAGE,
} from "@/lib/business/talent-search";
import { paginate } from "@/lib/project-view";
import { getTalentDirectoryRepository } from "@/repositories";

export const metadata: Metadata = { title: "Talents" };
export const dynamic = "force-dynamic";

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const DIRECTORY_LIMIT = 500;

export default async function TalentsPage({ searchParams }: PageProps<"/business/talents">) {
  const ctx = await requireBusiness();
  if (!ctx.can("talents.view")) return <NoAccess what="de consulter les talents" />;

  const raw = await searchParams;
  const repo = getTalentDirectoryRepository();
  const filters = parseTalentFilters(raw);
  const records = await repo.listPublic(DIRECTORY_LIMIT);
  const hits = searchTalents(records, filters);
  const stats = directoryStats(records, hits);
  const { page, pages, items } = paginate(hits, Number(first(raw.page)), TALENTS_PER_PAGE);

  const certCounts = new Map<string, number>();
  for (const t of records)
    for (const c of t.certifications) certCounts.set(c.name, (certCounts.get(c.name) ?? 0) + 1);
  const certificationOptions = [
    ...new Set([
      ...[...certCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([n]) => n),
      ...filters.certs,
    ]),
  ];

  const selectedUsername = first(raw.profil);
  const detail = selectedUsername ? await repo.detail(selectedUsername) : null;
  const tab = parseTalentTab(first(raw.ptab));

  const hrefWith = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(raw)) {
      if (changes[key] !== undefined) continue;
      for (const v of Array.isArray(value) ? value : value ? [value] : []) next.append(key, v);
    }
    for (const [key, value] of Object.entries(changes)) if (value) next.set(key, value);
    const qs = next.toString();
    return qs ? `/business/talents?${qs}` : "/business/talents";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-navy text-2xl font-bold tracking-tight sm:text-3xl">
            Trouver les meilleurs talents
          </h1>
          <p className="text-muted mt-1">
            Accédez à des talents qualifiés et vérifiés, correspondant à vos besoins.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard
            icon={Users}
            tone="bg-blue-50 text-brand"
            value={stats.total.toLocaleString("fr-FR")}
            label="Talents disponibles"
          />
          <StatCard
            icon={BadgeCheck}
            tone="bg-blue-50 text-brand"
            value={stats.verified.toLocaleString("fr-FR")}
            label="Avec compétences vérifiées"
          />
          <StatCard
            icon={Target}
            tone="bg-orange-100 text-orange-600"
            value={stats.averageMatch === null ? "—" : `${stats.averageMatch}%`}
            label="Correspondance moyenne"
            caption={stats.averageMatch === null ? "choisissez des compétences" : undefined}
          />
        </div>
      </div>

      <div
        className={
          detail
            ? "grid items-start gap-6 xl:grid-cols-[280px_minmax(0,1fr)_440px]"
            : "grid items-start gap-6 xl:grid-cols-[280px_minmax(0,1fr)]"
        }
      >
        <Panel className="p-5">
          <TalentsFilters
            filters={filters}
            locations={locationOptions(records)}
            certificationOptions={certificationOptions}
          />
        </Panel>

        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-navy font-bold">
              {hits.length.toLocaleString("fr-FR")} talent{hits.length > 1 ? "s" : ""} trouvé
              {hits.length > 1 ? "s" : ""}
            </h2>
            <TalentSort current={filters.sort} />
          </div>
          {items.length === 0 ? (
            <Panel className="p-8 text-center">
              <p className="text-navy font-semibold">Aucun talent ne correspond à ces critères.</p>
              <p className="text-muted mt-1 text-sm">Élargissez la recherche ou réinitialisez les filtres.</p>
            </Panel>
          ) : (
            <ul className="space-y-3">
              {items.map((hit) => (
                <TalentCard
                  key={hit.record.id}
                  hit={hit}
                  selected={hit.record.username === selectedUsername}
                  href={hrefWith({ profil: hit.record.username, ptab: null })}
                  highlightSkills={filters.skills}
                />
              ))}
            </ul>
          )}
          <Pagination
            page={page}
            pages={pages}
            total={hits.length}
            size={TALENTS_PER_PAGE}
            noun="talents"
            hrefFor={(n) => hrefWith({ page: n > 1 ? String(n) : null })}
          />
        </div>

        {detail && (
          <TalentPanel
            detail={detail}
            score={talentScore(detail)}
            tab={tab}
            hrefFor={(t) => hrefWith({ ptab: t === "overview" ? null : t })}
            closeHref={hrefWith({ profil: null, ptab: null })}
          />
        )}
      </div>
    </div>
  );
}
