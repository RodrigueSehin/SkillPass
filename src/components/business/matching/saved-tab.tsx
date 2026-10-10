import Link from "next/link";
import { Download, MapPin, Search, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { BusinessContext } from "@/lib/business/context";
import { isMatchable, PROPOSAL_THRESHOLD, scoreOffer } from "@/lib/business/matching";
import { compatibleOffers, filterSaved, parseSavedFilters } from "@/lib/business/matching-view";
import { paginate } from "@/lib/project-view";
import { getTalentDirectoryRepository } from "@/repositories";
import { removeSavedAction } from "@/app/business/matching/actions";
import { MATCH_STATUS_LABELS, MATCH_STATUS_TONES, MATCH_STATUSES } from "@/types/matching";
import { AVAILABILITY_SHORT, TalentAvatar } from "../talent-cards";
import { Pagination } from "../pagination";
import { Panel } from "../ui";
import { CopyLink } from "./copy-link";
import { first, hrefWith, loadDirectory, loadOffers, loadSaved, type Raw } from "./data";
import { MatchProfilePanel, parsePanelTab } from "./profile-panel";
import { MatchRing } from "./ring";
import { SaveButton } from "./save-button";
import { SelectAll } from "./select-all";
import { StatusSelect } from "./status-select";

const PER_PAGE = 6;
const field =
  "border-border focus-visible:ring-brand/40 h-11 rounded-xl border bg-white px-3 text-sm outline-none focus-visible:ring-2";

export async function SavedTab({ ctx, raw }: { ctx: BusinessContext; raw: Raw }) {
  const orgId = ctx.organization.id;
  const [records, offers, saved] = await Promise.all([loadDirectory(), loadOffers(orgId), loadSaved(orgId)]);
  const byProfile = new Map(records.map((t) => [t.id, t]));
  const filters = parseSavedFilters(raw);
  const filtered = filterSaved(saved, byProfile, filters);
  const { page, pages, items } = paginate(filtered, Number(first(raw.page)), PER_PAGE);
  const canSave = ctx.can("talents.shortlist");
  const open = offers.filter(isMatchable);

  const selectedId = first(raw.sel);
  const selected = filtered.find((s) => s.id === selectedId);
  const selectedTalent = selected ? byProfile.get(selected.profileId) : undefined;
  const detail = selectedTalent ? await getTalentDirectoryRepository().detail(selectedTalent.username) : null;
  const selectedOffer = selected ? offers.find((o) => o.id === selected.jobOfferId) : undefined;

  if (saved.length === 0) {
    return (
      <Panel className="p-8 text-center">
        <p className="text-navy font-semibold">Aucune correspondance sauvegardée.</p>
        <p className="text-muted mt-1 text-sm">
          Utilisez le signet d&apos;un talent, dans la recherche ou les recommandations, pour le retrouver
          ici.
        </p>
        <Link
          href="/business/matching"
          className="bg-brand mt-5 inline-flex h-11 items-center rounded-xl px-6 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Rechercher des talents
        </Link>
      </Panel>
    );
  }

  return (
    <div className={cn("grid items-start gap-6", detail ? "xl:grid-cols-[minmax(0,1fr)_420px]" : "")}>
      <div className="min-w-0 space-y-4">
        <form method="get" action="/business/matching" className="flex flex-wrap items-center gap-3">
          <input type="hidden" name="tab" value="sauvegardes" />
          <div className="relative min-w-52 flex-1">
            <Search className="text-muted pointer-events-none absolute top-3.5 left-3.5 size-4" aria-hidden />
            <input
              name="sq"
              defaultValue={filters.q}
              aria-label="Rechercher un talent sauvegardé"
              placeholder="Rechercher un talent sauvegardé…"
              className={`${field} w-full pl-10`}
            />
          </div>
          <select name="sposte" defaultValue={filters.offerId} aria-label="Poste" className={field}>
            <option value="">Tous les postes</option>
            {open.map((o) => (
              <option key={o.id} value={o.id}>
                {o.title}
              </option>
            ))}
          </select>
          <select name="statut" defaultValue={filters.status} aria-label="Statut" className={field}>
            <option value="">Tous les statuts</option>
            {MATCH_STATUSES.map((s) => (
              <option key={s} value={s}>
                {MATCH_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="border-brand/40 text-brand h-11 rounded-xl border bg-white px-5 text-sm font-semibold hover:bg-blue-50"
          >
            Filtrer
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-navy font-bold">
            {filtered.length} correspondance{filtered.length > 1 ? "s" : ""} sauvegardée
            {filtered.length > 1 ? "s" : ""}
          </h2>
          {ctx.can("talents.export") && (
            <Link
              href="/api/business/matching/export"
              prefetch={false}
              className="border-border text-navy flex h-10 items-center gap-2 rounded-xl border bg-white px-4 text-sm font-semibold hover:bg-slate-50"
            >
              <Download className="size-4" aria-hidden /> Exporter en CSV
            </Link>
          )}
        </div>

        <form id="saved-list" action={removeSavedAction} className="space-y-3">
          {items.length === 0 ? (
            <Panel className="p-8 text-center">
              <p className="text-navy font-semibold">Aucun résultat pour ces filtres.</p>
            </Panel>
          ) : (
            <ul className="space-y-3">
              {items.map((s) => {
                const t = byProfile.get(s.profileId)!;
                const availability = AVAILABILITY_SHORT[t.availability];
                const offer = offers.find((o) => o.id === s.jobOfferId);
                return (
                  <li key={s.id}>
                    <article
                      className={cn(
                        "border-border/70 shadow-soft flex flex-wrap items-center gap-4 rounded-2xl border bg-white p-4 sm:flex-nowrap",
                        s.id === selectedId && "border-brand ring-brand/20 ring-2",
                      )}
                    >
                      {canSave && (
                        <input
                          type="checkbox"
                          name="id"
                          value={s.id}
                          aria-label={`Sélectionner ${t.fullName}`}
                          className="accent-brand size-4"
                        />
                      )}
                      <TalentAvatar name={t.fullName} className="size-14 text-lg" />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-navy truncate font-bold">{t.fullName}</h3>
                        <p className="text-navy/85 truncate text-sm">{t.profession ?? t.headline ?? "—"}</p>
                        <p className="text-muted mt-1 flex flex-wrap gap-x-3 text-xs">
                          {t.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="size-3" aria-hidden /> {t.location.split(",")[0]}
                            </span>
                          )}
                          <span className="flex items-center gap-1.5">
                            <span className={cn("size-2 rounded-full", availability.tone)} aria-hidden />
                            {availability.label}
                          </span>
                          {offer && <span>Pour : {offer.title}</span>}
                        </p>
                        <ul className="mt-2 flex flex-wrap gap-1.5">
                          {t.skills.slice(0, 4).map((k) => (
                            <li
                              key={k.name}
                              className="rounded-md bg-slate-100 px-2.5 py-1 text-xs text-slate-600"
                            >
                              {k.name}
                            </li>
                          ))}
                        </ul>
                      </div>
                      {s.match !== null && (
                        <div className="text-center">
                          <MatchRing value={s.match} />
                          <p className="text-muted text-[11px]">Match</p>
                        </div>
                      )}
                      <span
                        className={cn(
                          "rounded-md px-2.5 py-1 text-xs font-semibold",
                          MATCH_STATUS_TONES[s.status],
                        )}
                      >
                        {MATCH_STATUS_LABELS[s.status]}
                      </span>
                      <Link
                        href={hrefWith(raw, { sel: s.id, ptab: null })}
                        scroll={false}
                        className="bg-brand flex h-10 items-center rounded-xl px-4 text-sm font-semibold text-white hover:bg-blue-700"
                      >
                        Voir
                      </Link>
                    </article>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            {canSave ? (
              <div className="flex items-center gap-4">
                <SelectAll formId="saved-list" label="Sélectionner tout" />
                <button
                  type="submit"
                  className="text-danger border-danger/40 flex h-10 items-center gap-2 rounded-xl border bg-white px-4 text-sm font-semibold hover:bg-red-50"
                >
                  <Trash2 className="size-4" aria-hidden /> Retirer de la liste
                </button>
              </div>
            ) : (
              <span />
            )}
          </div>
        </form>

        <Pagination
          page={page}
          pages={pages}
          total={filtered.length}
          size={PER_PAGE}
          noun="talents"
          hrefFor={(n) => hrefWith(raw, { page: n > 1 ? String(n) : null })}
        />
      </div>

      {detail && selected && (
        <MatchProfilePanel
          detail={detail}
          match={
            selectedOffer
              ? (scoreOffer(selectedOffer, detail.record)?.score ?? selected.match)
              : selected.match
          }
          wanted={selectedOffer?.skills ?? []}
          compatible={compatibleOffers(detail.record, open, scoreOffer, PROPOSAL_THRESHOLD).map(
            ({ offer: o, score }) => ({
              id: o.id,
              title: o.title,
              place: o.location,
              score,
            }),
          )}
          closeHref={hrefWith(raw, { sel: null, ptab: null })}
          saved
          canSave={canSave}
          jobOfferId={selected.jobOfferId}
          tab={parsePanelTab(first(raw.ptab))}
          tabHref={(tab) => hrefWith(raw, { ptab: tab === "resume" ? null : tab })}
          footer={
            <>
              <StatusSelect id={selected.id} status={selected.status} disabled={!canSave} />
              <div className="grid grid-cols-2 gap-3">
                <CopyLink path={`/${detail.record.username}`} />
                <SaveButton
                  username={detail.record.username}
                  saved
                  jobOfferId={selected.jobOfferId}
                  match={selected.match}
                  disabled={!canSave}
                  label="Retirer de la liste"
                  className="text-danger border-danger/40 w-full hover:bg-red-50"
                />
              </div>
            </>
          }
        />
      )}
    </div>
  );
}
