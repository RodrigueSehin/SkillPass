import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  BarChart3,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileText,
  FileSignature,
  Globe2,
  Laptop,
  Layers,
  MapPin,
  Sparkles,
  Star,
  Target,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { CompanyLogo } from "./company-logo";

export interface DetailView {
  id: string;
  title: string;
  company: string;
  companyName: string;
  legalName: string;
  verified: boolean;
  tagline: string | null;
  location: string;
  workMode: string | null;
  workModeDetail: string | null;
  commitment: string | null;
  published: string;
  publishedDate: string;
  deadlineDate: string | null;
  experienceRange: string | null;
  salary: string | null;
  domain: string;
  description: string;
  missions: string[];
  requirements: string[];
  perks: string[];
  process: string[];
  skills: { name: string; owned: boolean }[];
  companySector: string | null;
  companySize: string | null;
  companyAbout: string | null;
  companyWebsite: string | null;
  views: number;
  applicants: number;
  match: number;
}

const panel = "rounded-2xl bg-white";

function SectionHeading({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <h2 className="text-navy flex items-center gap-3 text-lg font-bold">
      <Icon className="text-brand size-5" aria-hidden /> {children}
    </h2>
  );
}

function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 space-y-2.5">
      {items.map((item) => (
        <li key={item} className="text-navy flex items-start gap-3 text-sm">
          <CheckCircle2 className="text-brand mt-0.5 size-5 shrink-0 fill-blue-50" aria-hidden /> {item}
        </li>
      ))}
    </ul>
  );
}

export function SkillChips({ skills, optional = [] }: { skills: DetailView["skills"]; optional?: string[] }) {
  return (
    <ul className="mt-4 flex flex-wrap gap-2">
      {skills.map((s) => (
        <li
          key={s.name}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-medium",
            s.owned ? "bg-green-50 text-green-700" : "text-brand bg-blue-50",
          )}
        >
          {s.name}
        </li>
      ))}
      {optional.map((name) => (
        <li key={name} className="text-brand rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium">
          {name} (optionnel)
        </li>
      ))}
    </ul>
  );
}

function Facts({ offer }: { offer: DetailView }) {
  const rows: { icon: LucideIcon; label: string; value: string | null }[] = [
    { icon: FileSignature, label: "Type de contrat", value: offer.commitment },
    { icon: MapPin, label: "Localisation", value: offer.location },
    { icon: Laptop, label: "Mode de travail", value: offer.workModeDetail },
    { icon: CalendarDays, label: "Date de publication", value: offer.publishedDate },
    { icon: CalendarClock, label: "Date limite de candidature", value: offer.deadlineDate },
    { icon: BarChart3, label: "Niveau d'expérience", value: offer.experienceRange },
    { icon: Banknote, label: "Salaire", value: offer.salary },
    { icon: Layers, label: "Domaine", value: offer.domain },
  ];
  return (
    <dl className="space-y-4 rounded-2xl bg-blue-50/70 p-5">
      {rows
        .filter((r) => r.value)
        .map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-start gap-4">
            <Icon className="text-brand mt-0.5 size-6 shrink-0" aria-hidden />
            <div>
              <dt className="text-navy text-sm font-semibold">{label}</dt>
              <dd className="text-muted text-sm">{value}</dd>
            </div>
          </div>
        ))}
    </dl>
  );
}

export function OverviewPanel({ offer }: { offer: DetailView }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
      <div className="space-y-8">
        <section>
          <SectionHeading icon={FileText}>Description du poste</SectionHeading>
          <p className="text-navy/85 mt-3 text-sm leading-relaxed">{offer.description}</p>
        </section>
        <section>
          <SectionHeading icon={ClipboardList}>Vos principales missions</SectionHeading>
          <CheckList items={offer.missions} />
        </section>
        <section>
          <SectionHeading icon={Sparkles}>Compétences clés</SectionHeading>
          <SkillChips skills={offer.skills} />
        </section>
      </div>
      <Facts offer={offer} />
    </div>
  );
}

export function CompanyPanel({ offer }: { offer: DetailView }) {
  return (
    <section className={cn(panel, "space-y-4")}>
      <SectionHeading icon={Globe2}>À propos de {offer.legalName}</SectionHeading>
      <dl className="text-sm">
        {offer.companySector && (
          <div className="flex gap-2">
            <dt className="text-muted w-24">Secteur</dt>
            <dd className="text-navy font-medium">{offer.companySector}</dd>
          </div>
        )}
        {offer.companySize && (
          <div className="mt-1 flex gap-2">
            <dt className="text-muted w-24">Taille</dt>
            <dd className="text-navy font-medium">{offer.companySize}</dd>
          </div>
        )}
      </dl>
      <p className="text-navy/85 text-sm leading-relaxed">
        {offer.companyAbout ?? "Aucune présentation disponible."}
      </p>
      {offer.companyWebsite && (
        <a
          href={offer.companyWebsite}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
        >
          Site web <ArrowRight className="size-4" aria-hidden />
        </a>
      )}
    </section>
  );
}

export function RolePanel({ offer }: { offer: DetailView }) {
  return (
    <div className="space-y-8">
      <section>
        <SectionHeading icon={FileText}>Description du poste</SectionHeading>
        <p className="text-navy/85 mt-3 text-sm leading-relaxed">{offer.description}</p>
      </section>
      <section>
        <SectionHeading icon={ClipboardList}>Vos principales missions</SectionHeading>
        <CheckList items={offer.missions} />
      </section>
    </div>
  );
}

export function ProfilePanel({ offer }: { offer: DetailView }) {
  return (
    <div className="space-y-8">
      <section>
        <SectionHeading icon={Target}>Profil recherché</SectionHeading>
        <CheckList items={offer.requirements} />
      </section>
      <section>
        <SectionHeading icon={Sparkles}>Compétences clés</SectionHeading>
        <SkillChips skills={offer.skills} />
      </section>
    </div>
  );
}

export function PerksPanel({ offer }: { offer: DetailView }) {
  return (
    <section>
      <SectionHeading icon={Star}>Avantages</SectionHeading>
      <CheckList items={offer.perks} />
    </section>
  );
}

export function ProcessPanel({ offer }: { offer: DetailView }) {
  return (
    <section>
      <SectionHeading icon={CalendarCheck}>Processus de recrutement</SectionHeading>
      <ol className="mt-4 space-y-3">
        {offer.process.map((step, i) => (
          <li key={step} className="flex items-center gap-4">
            <span className="bg-brand flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white">
              {i + 1}
            </span>
            <span className="text-navy text-sm font-medium">{step}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function AboutCompanyCard({ offer }: { offer: DetailView }) {
  return (
    <section
      aria-labelledby="about-company"
      className="border-border/60 shadow-soft rounded-2xl border bg-white p-5"
    >
      <h2 id="about-company" className="text-navy font-bold">
        À propos de l&apos;entreprise
      </h2>
      <div className="mt-4 flex items-center gap-4">
        <CompanyLogo company={offer.company} className="size-16 [&>span]:scale-110" />
        <div>
          <p className="text-navy font-bold">{offer.legalName}</p>
          {offer.companySector && <p className="text-muted text-sm">{offer.companySector}</p>}
          {offer.companySize && <p className="text-muted text-sm">{offer.companySize}</p>}
        </div>
      </div>
      {offer.companyAbout && (
        <p className="text-navy/85 mt-4 text-sm leading-relaxed">{offer.companyAbout}</p>
      )}
      <Link
        href={`/dashboard/opportunities?company=${encodeURIComponent(offer.company)}`}
        className="text-brand mt-4 inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
      >
        Voir le profil de l&apos;entreprise <ArrowRight className="size-4" aria-hidden />
      </Link>
    </section>
  );
}
