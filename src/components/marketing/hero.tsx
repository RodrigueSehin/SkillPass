import Link from "next/link";
import { ArrowRight, BadgeCheck, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SkillPassScore } from "@/components/skills/skillpass-score";
import { QRCodeCard } from "@/components/skills/qr-code-card";
import { SkillProgress } from "@/components/skills/skill-progress";

const STATS = [
  { value: "1 284", label: "Talents" },
  { value: "120+", label: "Entreprises" },
  { value: "8 900", label: "Compétences vérifiées" },
  { value: "3 400", label: "Certifications" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 -z-10 h-[600px] bg-gradient-to-b from-blue-50 to-transparent"
      />
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
        <div>
          <Badge tone="brand" className="px-3 py-1 text-sm">
            <ShieldCheck className="size-4" aria-hidden /> Le passeport numérique des compétences
          </Badge>
          <h1 className="text-navy mt-6 text-4xl leading-[1.1] font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Prouvez vos compétences. Construisez votre avenir.
          </h1>
          <p className="text-muted mt-6 max-w-xl text-lg">
            SkillPass transforme vos compétences, expériences et réalisations en un passeport professionnel
            vérifiable.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/register">
                Créer mon SkillPass <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/login">Explorer les talents</Link>
            </Button>
          </div>
          <dl className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label}>
                <dt className="text-muted text-sm">{s.label}</dt>
                <dd className="text-navy text-2xl font-bold">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <Card className="shadow-lift relative p-6 sm:p-8" aria-label="Aperçu d'un SkillPass">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <p className="flex items-center gap-1.5 text-xl font-bold">
                Sehin G. Rodrigue <BadgeCheck className="text-brand size-5" aria-label="Vérifié" />
              </p>
              <p className="text-muted text-sm">Power Platform Developer</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge tone="accent">Power Apps Advanced</Badge>
                <Badge tone="success">PL-200</Badge>
              </div>
            </div>
            <SkillPassScore score={87} verified size={128} />
          </div>
          <div className="mt-6 space-y-4">
            <SkillProgress name="Power Apps" score={95} />
            <SkillProgress name="Power Automate" score={82} />
            <SkillProgress name="Dataverse" score={80} />
          </div>
          <div className="absolute -bottom-6 -left-2 hidden sm:block">
            <QRCodeCard url="https://skillpass.com/verify/SP-9F82A1" label="SP-9F82A1" />
          </div>
        </Card>
      </div>
    </section>
  );
}
