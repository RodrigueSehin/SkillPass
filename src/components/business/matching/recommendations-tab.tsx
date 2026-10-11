import Link from "next/link";
import { BadgeCheck, Briefcase, Check, ExternalLink, Lightbulb, MapPin, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { BusinessContext } from "@/lib/business/context";
import { isMatchable, matchTalents } from "@/lib/business/matching";
import {
  applyRefinement,
  parseRefinement,
  parseTier,
  refineOffer,
  strengths,
  tierCounts,
  tierOf,
  TIERS,
} from "@/lib/business/matching-view";
import { paginate } from "@/lib/project-view";
import { JOB_CONTRACT_LABELS } from "@/types/job-offer";
import { TalentAvatar } from "../talent-cards";
import { Pagination } from "../pagination";
import { Panel } from "../ui";
import { first, hrefWith, loadDirectory, loadOffers, loadSaved, type Raw } from "./data";
import { MatchRing } from "./ring";
import { RefineForm } from "./refine-form";
import { SaveButton } from "./save-button";

const PER_PAGE = 5;
const DATE = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const CRITERIA = [
  ["Compétences requises", 60, "bg-brand"],
  ["Compétences vérifiées", 10, "bg-emerald-500"],
  ["Certifications", 10, "bg-orange"],
  ["Expérience demandée", 10, "bg-violet-500"],
  ["Lieu et disponibilité", 10, "bg-slate-400"],
] as const;

export async function RecommendationsTab({ ctx, raw }: { ctx: BusinessContext; raw: Raw }) {
  const orgId = ctx.organization.id;
  const [records, allOffers, saved] = await Promise.all([
    loadDirectory(),
    loadOffers(orgId),
    loadSaved(orgId),
  ]);
  const offers = allOffers.filter(isMatchable);
  const offer = offers.find((o) => o.id === first(raw.offre)) ?? offers.find((o) => o.skills.length > 0);

  if (!offer) {
    return (
      <Panel className="p-8 text-center">
        <p className="text-navy font-semibold">Aucune offre à analyser.</p>
        <p className="text-muted mt-1 text-sm">
          Créez une offre avec ses compétences requises pour recevoir des recommandations.
        </p>
        {ctx.can("jobs.create") && (
          <Link
            href="/business/offres/nouvelle"
            className="bg-orange mt-5 inline-flex h-11 items-center rounded-xl px-6 text-sm font-semibold text-white hover:bg-orange-600"
          >
            Publier une offre
          </Link>
        )}
      </Panel>
    );
  }

  const refinement = parseRefinement(raw);
  const scored = refineOffer(offer, refinement);
  const all = applyRefinement(matchTalents(scored, records), refinement);
  const counts = tierCounts(all);
  const tier = parseTier(first(raw.niveau));
  const sort = first(raw.tri) === "experience" ? "experience" : "score";
  const shown = (tier === "all" ? all : all.filter((m) => tierOf(m.score) === tier)).sort((a, b) =>
    sort === "experience" ? b.record.yearsOfExperience - a.record.yearsOfExperience || b.score - a.score : 0,
  );
  const { page, pages, items } = paginate(shown, Number(first(raw.page)), PER_PAGE);
  const savedProfiles = new Set(saved.map((s) => s.profileId));
  const canSave = ctx.can("talents.shortlist");
  const tierLabel = (key: string, label: string) => `${label} (${counts[key as keyof typeof counts]})`;

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 space-y-4">
        {offers.length > 1 && (
          <nav aria-label="Offres" className="flex gap-2 overflow-x-auto pb-1">
            {offers.map((o) => (
              <Link
                key={o.id}
                href={hrefWith({}, { tab: "recommandations", offre: o.id })}
                aria-current={o.id === offer.id ? "page" : undefined}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-1.5 text-sm",
                  o.id === offer.id
                    ? "border-brand text-brand bg-blue-50 font-semibold"
                    : "border-border text-navy bg-white hover:bg-slate-50",
                )}
              >
                {o.title}
              </Link>
            ))}
          </nav>
        )}

        <Panel className="flex flex-wrap items-center gap-4 p-5">
          <span className="text-brand flex size-14 items-center justify-center rounded-2xl bg-blue-50">
            <Briefcase className="size-7" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-navy truncate text-xl font-bold">{offer.title}</h2>
            <p className="text-muted mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="text-brand rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold">
                {JOB_CONTRACT_LABELS[offer.contract]}
              </span>
              {offer.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5" aria-hidden /> {offer.location}
                </span>
              )}
              {offer.publishedAt && <span>Publiée le {DATE.format(new Date(offer.publishedAt))}</span>}
              {!offer.publishedAt && <span>Brouillon</span>}
            </p>
          </div>
          <Link
            href={`/business/offres/${offer.id}/modifier`}
            className="border-brand/40 text-brand flex h-11 items-center gap-2 rounded-xl border bg-white px-4 text-sm font-semibold hover:bg-blue-50"
          >
            Voir l&apos;offre <ExternalLink className="size-4" aria-hidden />
          </Link>
        </Panel>

        <p className="flex items-start gap-3 rounded-2xl bg-blue-50/70 p-4 text-sm">
          <Sparkles className="text-brand mt-0.5 size-5 shrink-0" aria-hidden />
          <span>
            <strong className="text-navy">
              SkillPass a analysé {records.length.toLocaleString("fr-FR")} profil
              {records.length > 1 ? "s" : ""} public
              {records.length > 1 ? "s" : ""} et identifié {all.length} talent{all.length > 1 ? "s" : ""}{" "}
              pertinent
              {all.length > 1 ? "s" : ""} pour cette offre.
            </strong>
            <br />
            <span className="text-navy/80">
              Les recommandations sont basées sur les compétences, l&apos;expérience, les certifications et la
              disponibilité.
            </span>
          </span>
        </p>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav aria-label="Niveau de pertinence" className="flex flex-wrap gap-2">
            {TIERS.map(([key, label]) => (
              <Link
                key={key}
                href={hrefWith(raw, { niveau: key === "all" ? null : key, page: null })}
                aria-current={tier === key ? "true" : undefined}
                className={cn(
                  "rounded-xl border px-4 py-2 text-sm font-medium",
                  tier === key
                    ? "bg-brand border-brand text-white"
                    : "border-border text-navy bg-white hover:bg-slate-50",
                )}
              >
                {tierLabel(key, label)}
              </Link>
            ))}
          </nav>
          <nav aria-label="Trier par" className="flex items-center gap-2 text-sm">
            <span className="text-muted">Trier par :</span>
            {(
              [
                ["score", "Pertinence"],
                ["experience", "Expérience"],
              ] as const
            ).map(([key, label]) => (
              <Link
                key={key}
                href={hrefWith(raw, { tri: key === "score" ? null : key, page: null })}
                className={cn(
                  "rounded-lg px-2.5 py-1.5",
                  sort === key ? "text-brand bg-blue-50 font-semibold" : "text-navy hover:bg-slate-50",
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {items.length === 0 ? (
          <Panel className="p-8 text-center">
            <p className="text-navy font-semibold">Aucun talent à recommander pour ces critères.</p>
            <p className="text-muted mt-1 text-sm">
              Assouplissez les critères à droite ou revenez quand de nouveaux profils seront publics.
            </p>
          </Panel>
        ) : (
          <ul className="space-y-3">
            {items.map((m) => {
              const t = m.record;
              const points = strengths(t, scored.skills).slice(0, 3);
              return (
                <li key={t.id}>
                  <article className="border-border/70 shadow-soft flex flex-wrap items-start gap-4 rounded-2xl border bg-white p-4 sm:flex-nowrap">
                    <TalentAvatar
                      name={t.fullName}
                      avatar={t.avatar}
                      profileId={t.id}
                      className="size-16 text-xl"
                    />
                    <div className="min-w-0 sm:w-56">
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
                      <p className="text-muted mt-1 text-xs">
                        {t.location?.split(",")[0]} · {t.yearsOfExperience} an
                        {t.yearsOfExperience > 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="text-center">
                      <MatchRing value={m.score} />
                      <p className="text-muted text-[11px]">Match</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-navy text-xs font-bold">Points forts</p>
                      <ul className="mt-1 space-y-1">
                        {points.map((p) => (
                          <li key={p} className="flex items-start gap-1.5 text-xs">
                            <Check
                              className="mt-0.5 size-3.5 shrink-0 rounded-full bg-green-600 p-0.5 text-white"
                              aria-hidden
                            />
                            {p}
                          </li>
                        ))}
                      </ul>
                      {m.missingSkills.length > 0 && (
                        <p className="text-muted mt-1.5 text-xs">Manque : {m.missingSkills.join(", ")}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={hrefWith({}, { poste: offer.id, profil: t.username })}
                        className="bg-brand flex h-10 items-center rounded-xl px-4 text-sm font-semibold text-white hover:bg-blue-700"
                      >
                        Voir profil
                      </Link>
                      <SaveButton
                        username={t.username}
                        saved={savedProfiles.has(t.id)}
                        jobOfferId={offer.id}
                        match={m.score}
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
          total={shown.length}
          size={PER_PAGE}
          noun="talents"
          hrefFor={(n) => hrefWith(raw, { page: n > 1 ? String(n) : null })}
        />
      </div>

      <aside className="space-y-4">
        <Panel className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-navy font-bold">Contexte de l&apos;offre</h3>
            <Link
              href={`/business/offres/${offer.id}/modifier`}
              className="text-brand text-xs font-semibold hover:underline"
            >
              Voir l&apos;offre
            </Link>
          </div>
          <dl className="mt-3 space-y-1.5 text-sm">
            <dt className="text-navy font-semibold">{offer.title}</dt>
            <dd className="text-muted">
              {JOB_CONTRACT_LABELS[offer.contract]} · {offer.location}
            </dd>
            <dd className="text-muted">Expérience : {offer.experience}</dd>
          </dl>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {scored.skills.map((s) => (
              <li key={s} className="text-brand rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium">
                {s}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel className="p-5">
          <h3 className="text-navy mb-3 font-bold">Critères de matching</h3>
          <ul className="space-y-2.5">
            {CRITERIA.map(([label, weight, tone]) => (
              <li key={label} className="grid grid-cols-[1fr_88px_36px] items-center gap-2 text-sm">
                <span className="text-navy">{label}</span>
                <span className="h-2 rounded-full bg-slate-100">
                  <span className={cn("block h-2 rounded-full", tone)} style={{ width: `${weight}%` }} />
                </span>
                <span className="text-navy text-right font-semibold">{weight}%</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel className="bg-violet-50/60 p-5">
          <h3 className="text-navy mb-2 flex items-center gap-2 font-bold">
            <Lightbulb className="size-5 text-violet-600" aria-hidden /> Pourquoi ces recommandations ?
          </h3>
          <ul className="space-y-1.5 text-sm">
            {[
              "Correspondance des compétences requises",
              "Certifications demandées et vérifiées",
              "Niveau d'expérience demandé par l'offre",
              "Disponibilité et localisation",
            ].map((r) => (
              <li key={r} className="flex items-start gap-2">
                <Check
                  className="mt-0.5 size-4 shrink-0 rounded-full bg-violet-600 p-0.5 text-white"
                  aria-hidden
                />
                {r}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel className="p-5">
          <RefineForm
            offerId={offer.id}
            offerSkills={offer.skills}
            refinement={refinement}
            canRun={ctx.can("talents.recommendations")}
          />
        </Panel>
      </aside>
    </div>
  );
}
