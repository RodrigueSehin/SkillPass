import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Check,
  FileCheck2,
  GraduationCap,
  IdCard,
  QrCode,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

function Section({
  id,
  kicker,
  title,
  subtitle,
  children,
  className,
}: {
  id?: string;
  kicker?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn("scroll-mt-24 py-16 sm:py-20", className)}>
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          {kicker && (
            <p className="text-brand mb-3 flex items-center justify-center gap-2 text-sm font-semibold">
              <span aria-hidden className="bg-accent h-0.5 w-6 rounded-full" /> {kicker}
            </p>
          )}
          <h2 className="text-navy text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h2>
          {subtitle && <p className="mt-4 text-lg text-slate-600">{subtitle}</p>}
        </div>
        {children}
      </div>
    </section>
  );
}

const WHY = [
  {
    icon: FileCheck2,
    title: "Des preuves, pas des promesses",
    text: "Chaque compétence est reliée à des projets, certifications et évaluations concrets.",
  },
  {
    icon: ShieldCheck,
    title: "Une confiance mesurable",
    text: "Un SkillPass Score transparent, détaillé critère par critère.",
  },
  {
    icon: Target,
    title: "Des opportunités pertinentes",
    text: "Le matching s'appuie sur ce que vous savez réellement faire.",
  },
];

export function WhySection() {
  return (
    <Section
      id="a-propos"
      kicker="Pourquoi SkillPass"
      title="La couche de confiance"
      subtitle="Entre vos compétences et les opportunités professionnelles : des preuves, un score transparent, un matching pertinent."
    >
      <div className="grid gap-6 md:grid-cols-3">
        {WHY.map(({ icon: Icon, title, text }) => (
          <Card key={title} className="p-6">
            <div className="text-brand mb-4 flex size-11 items-center justify-center rounded-xl bg-blue-50">
              <Icon className="size-5" aria-hidden />
            </div>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-muted mt-2 text-sm">{text}</p>
          </Card>
        ))}
      </div>
    </Section>
  );
}

const FEATURES = [
  {
    icon: Sparkles,
    title: "Compétences & niveaux",
    text: "Déclarez, évaluez et faites vérifier vos compétences.",
  },
  { icon: FileCheck2, title: "Preuves", text: "Projets, certificats, dépôts, recommandations." },
  { icon: IdCard, title: "Passeport numérique", text: "Un profil public optimisé, prêt à partager." },
  { icon: QrCode, title: "QR & vérification", text: "Chaque credential se vérifie en un scan." },
  { icon: Search, title: "Talent search", text: "Les recruteurs trouvent par compétences prouvées." },
  { icon: Target, title: "Matching IA", text: "Score, forces et écarts pour chaque offre." },
];

export function FeaturesSection() {
  return (
    <Section
      id="fonctionnalites"
      kicker="Fonctionnalités"
      title="Tout ce qu'il faut pour prouver"
      className="bg-surface"
    >
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <div
            key={title}
            className="border-border hover:shadow-soft rounded-2xl border p-6 transition-shadow"
          >
            <Icon className="text-brand size-6" aria-hidden />
            <h3 className="mt-4 font-semibold">{title}</h3>
            <p className="text-muted mt-1 text-sm">{text}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

const AUDIENCES = [
  {
    id: "talents",
    icon: UserRound,
    title: "Pour les talents",
    points: [
      "Passeport public partageable",
      "Badges et credentials vérifiables",
      "Opportunités qui vous correspondent",
    ],
  },
  {
    id: "entreprises",
    icon: Building2,
    title: "Pour les entreprises",
    points: [
      "Recherche par compétences prouvées",
      "Matching et analyse des écarts",
      "Vérification instantanée des credentials",
    ],
  },
  {
    id: "academies",
    icon: GraduationCap,
    title: "Pour les académies",
    points: [
      "Émission de badges et certifications",
      "Suivi des cohortes",
      "Insertion professionnelle mesurable",
    ],
  },
];

export function AudiencesSection() {
  return (
    <Section id="audiences" kicker="Pour tous" title="Un produit, trois publics" className="bg-surface">
      <div className="grid gap-6 md:grid-cols-3">
        {AUDIENCES.map(({ id, icon: Icon, title, points }) => (
          <Card key={id} id={id} className="p-6">
            <Icon className="text-accent size-7" aria-hidden />
            <h3 className="mt-4 text-lg font-semibold">{title}</h3>
            <ul className="mt-4 space-y-2">
              {points.map((p) => (
                <li key={p} className="text-muted flex items-start gap-2 text-sm">
                  <Check className="text-success mt-0.5 size-4 shrink-0" aria-hidden /> {p}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </Section>
  );
}

export function TrustSection() {
  return (
    <Section
      id="verification"
      kicker="Confiance"
      title="Vérifiable en un scan"
      subtitle="Chaque credential SkillPass possède un identifiant unique et une page de vérification publique."
    >
      <Card className="mx-auto max-w-xl p-6 text-center">
        <Badge tone="success" className="px-3 py-1 text-sm">
          <ShieldCheck className="size-4" aria-hidden /> Credential vérifié
        </Badge>
        <p className="mt-4 text-xl font-bold">Power Apps Advanced</p>
        <p className="text-muted">Sehin G. Rodrigue · SP-9F82A1</p>
        <p className="text-muted mt-2 text-sm">Émis en juin 2026 · Statut : valide</p>
      </Card>
    </Section>
  );
}

const PLANS = [
  {
    name: "Free",
    price: "0 FCFA",
    note: "Pour démarrer",
    features: ["Profil public", "5 compétences", "3 projets", "QR Code", "CV numérique"],
    featured: false,
  },
  {
    name: "Pro",
    price: "3 000 – 5 000 FCFA",
    note: "par mois",
    features: ["Compétences illimitées", "Portfolio & badges", "Évaluations", "Assistant IA", "Analytics"],
    featured: true,
  },
  {
    name: "Business",
    price: "dès 100 000 FCFA",
    note: "par mois",
    features: ["Recherche de talents", "Matching IA", "Skill gap d'équipe", "API", "HR analytics"],
    featured: false,
  },
];

export function PricingSection() {
  return (
    <Section id="tarifs" kicker="Tarifs" title="Tarifs simples" className="bg-surface">
      <div className="grid gap-6 lg:grid-cols-3">
        {PLANS.map((plan) => (
          <Card
            key={plan.name}
            className={cn("flex flex-col p-6", plan.featured && "border-brand shadow-lift")}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              {plan.featured && <Badge tone="brand">Populaire</Badge>}
            </div>
            <p className="text-navy mt-4 text-3xl font-bold">{plan.price}</p>
            <p className="text-muted text-sm">{plan.note}</p>
            <ul className="my-6 flex-1 space-y-2">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <Check className="text-success size-4" aria-hidden /> {f}
                </li>
              ))}
            </ul>
            <Button asChild variant={plan.featured ? "primary" : "outline"}>
              <Link href="/register">Choisir {plan.name}</Link>
            </Button>
          </Card>
        ))}
      </div>
    </Section>
  );
}

export function FinalCta() {
  return (
    <section className="px-4 py-16 sm:px-6">
      <div className="bg-navy mx-auto max-w-5xl rounded-3xl px-6 py-14 text-center text-white sm:px-12">
        <h2 className="text-3xl font-bold sm:text-4xl">Prove your skills. Own your future.</h2>
        <p className="mx-auto mt-4 max-w-xl text-blue-100">
          Créez votre SkillPass gratuitement et transformez vos compétences en preuves.
        </p>
        <Button asChild size="lg" variant="accent" className="mt-8">
          <Link href="/register">
            Créer mon SkillPass <ArrowRight />
          </Link>
        </Button>
      </div>
    </section>
  );
}
