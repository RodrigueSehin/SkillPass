import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Award, CheckCircle2, ChevronRight, Lightbulb, Quote, Star, Trophy } from "lucide-react";
import { IssuerLogo } from "@/components/certifications/issuer-logo";
import { NewCertificationForm } from "@/components/certifications/new-certification-form";
import { requireUser } from "@/lib/auth/current-user";
import { getCertificationService, getSkillService } from "@/services/container";

export const metadata: Metadata = { title: "Ajouter une certification" };

const REASONS = [
  "Renforcez votre crédibilité professionnelle",
  "Augmentez votre visibilité auprès des recruteurs",
  "Validez officiellement vos compétences",
  "Accédez à plus d'opportunités",
  "Montrez votre engagement dans l'apprentissage continu",
];

const POPULAR = [
  { name: "Power Platform Developer Associate", prefix: "Microsoft Certified", issuer: "Microsoft" },
  { name: "Solutions Architect", prefix: "AWS Certified", issuer: "Amazon Web Services" },
  { name: "Cloud Architect", prefix: "Google Professional", issuer: "Google" },
  { name: "Scrum Master", prefix: "Professional Scrum Master", issuer: "Scrum.org" },
  { name: "ITIL 4 Foundation", prefix: "", issuer: "PeopleCert" },
];

const TIPS = [
  "Utilisez une image claire et lisible de votre certificat",
  "Ajoutez l'URL de vérification si disponible",
  "Reliez les compétences pertinentes",
  "Gardez vos informations à jour",
];

const CATEGORY_IDEAS = [
  "Power Platform",
  "Cloud",
  "Data & Analytics",
  "IA & Automatisation",
  "Gestion de projet",
  "Cybersécurité",
  "Agile",
];
const ISSUER_IDEAS = [
  "Microsoft",
  "Amazon Web Services",
  "Google",
  "Scrum.org",
  "PeopleCert",
  "Salesforce",
  "Cisco",
  "Oracle",
];

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function NewCertificationPage({
  searchParams,
}: PageProps<"/dashboard/certifications/new">) {
  const user = await requireUser();
  const raw = await searchParams;
  const name = first(raw.name)?.slice(0, 160);
  const issuer = first(raw.issuer)?.slice(0, 120);
  const [certifications, skills] = await Promise.all([
    getCertificationService().list(user.id),
    getSkillService().list(user.id),
  ]);
  const issuers = [...new Set([...certifications.map((c) => c.issuer), ...ISSUER_IDEAS])];
  const categories = [
    ...new Set([
      ...certifications.map((c) => c.category).filter((c): c is string => Boolean(c)),
      ...CATEGORY_IDEAS,
    ]),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/dashboard/certifications"
            className="text-muted hover:text-brand inline-flex items-center gap-2 text-sm"
          >
            <ArrowLeft className="size-4" aria-hidden /> Retour aux certifications
          </Link>
          <h1 className="text-navy mt-3 flex items-center gap-3 text-2xl font-bold tracking-tight sm:text-3xl">
            <Award className="text-brand size-9" aria-hidden /> Ajouter une certification
          </h1>
          <p className="text-muted mt-1">
            Ajoutez une certification pour valoriser vos compétences et renforcer votre crédibilité
            professionnelle.
          </p>
        </div>
        <nav aria-label="Fil d'Ariane" className="text-muted flex items-center gap-1.5 text-xs">
          <Link href="/dashboard/certifications" className="hover:text-brand">
            Certifications
          </Link>
          <ChevronRight className="size-3" aria-hidden />
          <span aria-current="page">Ajouter une certification</span>
        </nav>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <NewCertificationForm
          key={`${name ?? ""}|${issuer ?? ""}`}
          issuers={issuers}
          categories={categories}
          skillNames={skills.items.map((s) => s.name)}
          defaults={{ name, issuer }}
        />

        <aside className="grid min-w-0 gap-6 md:grid-cols-2 xl:grid-cols-1">
          <section
            aria-labelledby="why-title"
            className="border-border/60 shadow-soft rounded-2xl border bg-white p-5"
          >
            <h2 id="why-title" className="text-navy flex items-center gap-2 font-bold">
              <Trophy className="size-5 text-amber-500" aria-hidden /> Pourquoi ajouter vos certifications ?
            </h2>
            <ul className="mt-4 space-y-3">
              {REASONS.map((r) => (
                <li key={r} className="text-navy flex items-start gap-2.5 text-sm">
                  <CheckCircle2 className="text-success mt-0.5 size-4 shrink-0" aria-hidden /> {r}
                </li>
              ))}
            </ul>
            <figure className="mt-5 rounded-xl bg-blue-50 p-4">
              <Quote className="text-brand size-5" aria-hidden />
              <blockquote className="text-navy mt-1 text-sm">
                Les certifications ouvrent des portes que l&apos;expérience seule ne peut pas toujours ouvrir.
              </blockquote>
            </figure>
          </section>

          <section
            aria-labelledby="popular-title"
            className="border-border/60 shadow-soft rounded-2xl border bg-white p-5"
          >
            <h2 id="popular-title" className="text-navy flex items-center gap-2 font-bold">
              <Star className="size-5 fill-amber-400 text-amber-400" aria-hidden /> Exemples de certifications
              populaires
            </h2>
            <p className="text-muted mt-1 text-xs">Cliquez pour préremplir le formulaire.</p>
            <ul className="mt-4 space-y-3">
              {POPULAR.map((p) => {
                const full = p.prefix ? `${p.prefix}: ${p.name}` : p.name;
                return (
                  <li key={full}>
                    <Link
                      href={`/dashboard/certifications/new?name=${encodeURIComponent(full)}&issuer=${encodeURIComponent(p.issuer)}`}
                      className="flex items-center gap-3 rounded-xl p-1.5 hover:bg-blue-50"
                    >
                      <IssuerLogo issuer={p.issuer} />
                      <span className="min-w-0 text-sm">
                        <span className="text-navy block font-semibold">{p.prefix || p.name}</span>
                        <span className="text-muted block">{p.prefix ? p.name : p.issuer}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          <section
            aria-labelledby="tips-title"
            className="border-border/60 shadow-soft rounded-2xl border bg-white p-5 md:col-span-2 xl:col-span-1"
          >
            <h2 id="tips-title" className="text-navy flex items-center gap-2 font-bold">
              <Lightbulb className="size-5 text-amber-500" aria-hidden /> Conseils
            </h2>
            <ul className="text-navy marker:text-brand mt-3 list-disc space-y-2 pl-5 text-sm">
              {TIPS.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
