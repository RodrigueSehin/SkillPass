import Link from "next/link";
import { BadgeCheck, Briefcase, LayoutGrid, MapPin } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { BusinessContext } from "@/lib/business/context";
import { compatibleOffers, effectiveSkills, parseMatchSearch, runSearch } from "@/lib/business/matching-view";
import { isMatchable, scoreOffer, PROPOSAL_THRESHOLD } from "@/lib/business/matching";
import { locationOptions, TALENT_SORTS, TALENTS_PER_PAGE } from "@/lib/business/talent-search";
import { paginate } from "@/lib/project-view";
import { getTalentDirectoryRepository } from "@/repositories";
import { AVAILABILITY_SHORT, TalentAvatar } from "../talent-cards";
import { Pagination } from "../pagination";
import { Panel } from "../ui";
import { first, hrefWith, loadDirectory, loadOffers, loadSaved, type Raw } from "./data";
import { MatchProfilePanel, parsePanelTab } from "./profile-panel";
import { MatchRing } from "./ring";
import { SaveButton } from "./save-button";
import { SearchForm } from "./search-filters";

export async function SearchTab({ ctx, raw }: { ctx: BusinessContext; raw: Raw }) {
  const orgId = ctx.organization.id;
  const [records, offers, saved] = await Promise.all([loadDirectory(), loadOffers(orgId), loadSaved(orgId)]);
  const search = parseMatchSearch(raw);
  const openOffers = offers.filter(isMatchable);
  const offer = openOffers.find((o) => o.id === search.offerId);
  const hits = runSearch(records, search, offer);
  const { page, pages, items } = paginate(hits, Number(first(raw.page)), TALENTS_PER_PAGE);
  const wanted = effectiveSkills(search, offer);
  const canSave = ctx.can("talents.shortlist");
  const savedProfiles = new Set(saved.map((s) => s.profileId));

  const username = first(raw.profil);
  const detail = username ? await getTalentDirectoryRepository().detail(username) : null;
  const detailHit = detail ? hits.find((h) => h.record.id === detail.record.id) : undefined;
  const detailMatch = detail
    ? (detailHit?.match ??
      (wanted.length > 0
        ? (runSearch([detail.record], { ...search, exp: [], dispo: [], location: "", q: "" }, offer)[0]
            ?.match ?? null)
        : null))
    : null;

  return (
    <SearchForm
      wide={Boolean(detail)}
      search={search}
      offers={openOffers.map((o) => ({ id: o.id, title: o.title }))}
      locations={locationOptions(records)}
    >
      <div className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-navy font-bold">
            {hits.length.toLocaleString("fr-FR")} talent{hits.length > 1 ? "s" : ""} trouvé
            {hits.length > 1 ? "s" : ""}
          </h2>
          <nav aria-label="Trier par" className="flex items-center gap-2 text-sm">
            <span className="text-muted">Trier par :</span>
            {TALENT_SORTS.map(([key, label]) => (
              <Link
                key={key}
                href={hrefWith(raw, { sort: key === "match" ? null : key, page: null })}
                aria-current={search.sort === key ? "true" : undefined}
                className={cn(
                  "rounded-lg px-2.5 py-1.5",
                  search.sort === key ? "text-brand bg-blue-50 font-semibold" : "text-navy hover:bg-slate-50",
                )}
              >
                {label}
              </Link>
            ))}
            <LayoutGrid className="text-muted ml-2 hidden size-4 sm:block" aria-hidden />
          </nav>
        </div>

        {wanted.length === 0 && (
          <p className="text-muted rounded-xl bg-slate-50 p-3 text-sm">
            Ajoutez des compétences ou choisissez un poste pour calculer la correspondance de chaque talent.
          </p>
        )}

        {items.length === 0 ? (
          <Panel className="p-8 text-center">
            <p className="text-navy font-semibold">Aucun talent ne correspond à ces critères.</p>
            <p className="text-muted mt-1 text-sm">Élargissez la recherche ou réinitialisez les filtres.</p>
          </Panel>
        ) : (
          <ul className="space-y-3">
            {items.map(({ record: t, match }) => {
              const availability = AVAILABILITY_SHORT[t.availability];
              const wantedSet = new Set(wanted.map((w) => w.toLowerCase()));
              const skills = [...t.skills].sort(
                (a, b) =>
                  Number(wantedSet.has(b.name.toLowerCase())) - Number(wantedSet.has(a.name.toLowerCase())) ||
                  b.score - a.score,
              );
              return (
                <li key={t.id}>
                  <article
                    className={cn(
                      "border-border/70 shadow-soft flex flex-wrap items-center gap-4 rounded-2xl border bg-white p-4 sm:flex-nowrap",
                      t.username === username && "border-brand ring-brand/20 ring-2",
                    )}
                  >
                    <TalentAvatar
                      name={t.fullName}
                      avatar={t.avatar}
                      profileId={t.id}
                      className="size-16 text-xl"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-navy flex items-center gap-1.5 font-bold">
                        <span className="truncate">{t.fullName}</span>
                        {t.skills.some((s) => s.verified) && (
                          <BadgeCheck
                            className="text-brand size-4 shrink-0"
                            aria-label="Compétences vérifiées"
                          />
                        )}
                      </h3>
                      <p className="text-navy/85 truncate text-sm">{t.profession ?? t.headline ?? "—"}</p>
                      <p className="text-muted mt-1 flex flex-wrap gap-x-3 text-xs">
                        {t.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="size-3" aria-hidden /> {t.location.split(",")[0]}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Briefcase className="size-3" aria-hidden /> {t.yearsOfExperience} an
                          {t.yearsOfExperience > 1 ? "s" : ""} d&apos;expérience
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className={cn("size-2 rounded-full", availability.tone)} aria-hidden />
                          {availability.label}
                        </span>
                      </p>
                    </div>
                    <ul className="flex max-w-56 flex-wrap gap-1.5 sm:justify-end">
                      {skills.slice(0, 3).map((s) => (
                        <li
                          key={s.name}
                          className={cn(
                            "rounded-md px-2.5 py-1 text-xs font-medium",
                            wantedSet.has(s.name.toLowerCase())
                              ? "text-brand bg-blue-50"
                              : "bg-slate-100 text-slate-600",
                          )}
                        >
                          {s.name}
                        </li>
                      ))}
                      {skills.length > 3 && (
                        <li className="text-muted px-1 py-1 text-xs">+{skills.length - 3}</li>
                      )}
                    </ul>
                    {match !== null && (
                      <div className="text-center">
                        <MatchRing value={match} />
                        <p className="text-muted text-[11px]">Match</p>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Link
                        href={hrefWith(raw, { profil: t.username, ptab: null })}
                        scroll={false}
                        className="bg-brand flex h-10 items-center rounded-xl px-4 text-sm font-semibold text-white hover:bg-blue-700"
                      >
                        Voir le profil
                      </Link>
                      <SaveButton
                        username={t.username}
                        saved={savedProfiles.has(t.id)}
                        jobOfferId={offer?.id ?? null}
                        match={match}
                        disabled={!canSave}
                      />
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
        <Pagination
          page={page}
          pages={pages}
          total={hits.length}
          size={TALENTS_PER_PAGE}
          noun="talents"
          hrefFor={(n) => hrefWith(raw, { page: n > 1 ? String(n) : null })}
        />
      </div>

      {detail && (
        <MatchProfilePanel
          detail={detail}
          match={detailMatch}
          wanted={wanted}
          compatible={compatibleOffers(detail.record, openOffers, scoreOffer, PROPOSAL_THRESHOLD).map(
            ({ offer: o, score }) => ({
              id: o.id,
              title: o.title,
              place: o.location,
              score,
            }),
          )}
          closeHref={hrefWith(raw, { profil: null, ptab: null })}
          saved={savedProfiles.has(detail.record.id)}
          canSave={canSave}
          jobOfferId={offer?.id ?? null}
          tab={parsePanelTab(first(raw.ptab))}
          tabHref={(tab) => hrefWith(raw, { ptab: tab === "resume" ? null : tab })}
        />
      )}
    </SearchForm>
  );
}
