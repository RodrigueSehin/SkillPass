import Link from "next/link";
import { ArrowRight, Bell, ChevronRight, Lightbulb, Rocket, TrendingUp } from "lucide-react";
import { matchLabel } from "@/lib/opportunity-view";
import { CompanyLogo } from "./company-logo";
import { CreateAlertButton } from "./opportunity-editor";

const card = "border-border/60 shadow-soft rounded-2xl border bg-white p-5";

export function ProfileMatch({ percent }: { percent: number }) {
  const size = 112;
  const stroke = 11;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const filled = (percent / 100) * c;
  return (
    <section aria-labelledby="match-title" className={card}>
      <h2 id="match-title" className="text-navy font-bold">
        Mon profil correspond à
      </h2>
      <div className="mt-4 flex items-center gap-4">
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            role="img"
            aria-label={`${percent} % de correspondance`}
          >
            <g
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              fill="none"
              strokeWidth={stroke}
              strokeLinecap="round"
            >
              <circle cx={size / 2} cy={size / 2} r={r} stroke="#E2E8F0" />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                stroke="#16A34A"
                strokeDasharray={`${filled} ${c - filled}`}
              />
            </g>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center leading-tight">
            <span className="text-navy text-2xl font-extrabold">
              {percent}
              <span className="text-sm">%</span>
            </span>
            <span className="text-muted text-[9px]">de cette sélection</span>
          </div>
        </div>
        <div>
          <p className="text-success font-bold">{matchLabel(percent)}</p>
          <p className="text-muted mt-1 text-xs leading-relaxed">
            Votre profil correspond à {percent}% des opportunités de cette sélection.
          </p>
        </div>
      </div>
      <Link
        href="/dashboard/skills"
        className="text-brand border-brand/40 mt-4 flex h-10 items-center justify-center gap-2 rounded-xl border bg-blue-50/60 text-sm font-semibold hover:bg-blue-50"
      >
        <TrendingUp className="size-4" aria-hidden /> Améliorer mon profil
      </Link>
    </section>
  );
}

export function RecruitingCompanies({
  companies,
  total,
  showingAll,
  allHref,
  baseHref,
}: {
  companies: { name: string; count: number }[];
  total: number;
  showingAll: boolean;
  allHref: string;
  baseHref: (company: string) => string;
}) {
  return (
    <section aria-labelledby="companies-title" className={card}>
      <div className="flex items-center justify-between gap-2">
        <h2 id="companies-title" className="text-navy font-bold">
          Entreprises qui recrutent
        </h2>
        {total > companies.length || showingAll ? (
          <Link
            href={allHref}
            className="text-brand flex items-center gap-1 text-xs font-semibold hover:underline"
          >
            {showingAll ? "Voir moins" : "Voir tout"} <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        ) : null}
      </div>
      <ul className="mt-3 divide-y divide-slate-100">
        {companies.map((c) => (
          <li key={c.name}>
            <Link
              href={baseHref(c.name)}
              className="flex items-center gap-3 rounded-lg py-2.5 hover:bg-blue-50/60"
              aria-label={`Voir les ${c.count} opportunités de ${c.name}`}
            >
              <CompanyLogo company={c.name} className="size-10 [&>span]:scale-90" />
              <span className="min-w-0 flex-1 text-sm">
                <span className="text-navy block font-semibold">{c.name}</span>
                <span className="text-muted block text-xs">
                  {c.count} opportunité{c.count > 1 ? "s" : ""}
                </span>
              </span>
              <ChevronRight className="text-muted size-4 shrink-0" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function JobAlertsCard() {
  return (
    <section className={card}>
      <h2 className="text-navy flex items-center gap-2 font-bold">
        <Bell className="text-brand size-5 fill-current" aria-hidden /> Alertes emploi
      </h2>
      <p className="text-muted mt-2 text-sm">Gérez vos alertes pour ne rien manquer.</p>
      <CreateAlertButton variant="outline" className="text-brand border-brand/40 mt-4 w-full bg-blue-50/60" />
    </section>
  );
}

export function CareerTips() {
  return (
    <section className={card}>
      <div className="flex items-start gap-3">
        <Lightbulb className="size-8 shrink-0 text-amber-500" aria-hidden />
        <div>
          <h2 className="text-navy font-bold">Conseils carrière</h2>
          <p className="text-muted mt-1.5 text-sm">
            Complétez vos compétences clés pour augmenter vos chances.
          </p>
          <Link
            href="/dashboard/recommendations"
            className="text-brand mt-3 inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
          >
            Voir mes recommandations <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}

export function NextStepPromo() {
  return (
    <section className="from-navy to-brand shadow-lift rounded-2xl bg-gradient-to-br p-5 text-white">
      <div className="flex items-start gap-3">
        <Rocket className="size-9 shrink-0 text-amber-300" aria-hidden />
        <div>
          <h2 className="text-lg leading-snug font-bold">Prêt pour la prochaine étape ?</h2>
          <p className="mt-2 text-sm text-white/80">Des opportunités sélectionnées rien que pour vous.</p>
        </div>
      </div>
      <a
        href="#opportunities-list"
        className="bg-brand mt-5 flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white ring-1 ring-white/30 hover:bg-blue-700"
      >
        Découvrir les offres <ArrowRight className="size-4" aria-hidden />
      </a>
    </section>
  );
}
