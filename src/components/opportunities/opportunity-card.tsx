import { Briefcase, Clock, Globe2, GraduationCap, Laptop, MapPin, Rocket, Wallet } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { CompanyLogo } from "./company-logo";
import { OfferActions, OfferMenu, type OfferView } from "./opportunity-editor";

const BADGE: Record<string, { tone: string; icon: typeof Briefcase }> = {
  Emploi: { tone: "bg-blue-50 text-brand", icon: Briefcase },
  Remote: { tone: "bg-green-50 text-green-700", icon: Globe2 },
  Stage: { tone: "bg-violet-50 text-violet-700", icon: GraduationCap },
  Freelance: { tone: "bg-orange-50 text-orange-700", icon: Wallet },
  Projet: { tone: "bg-fuchsia-50 text-fuchsia-700", icon: Rocket },
  Alternance: { tone: "bg-cyan-50 text-cyan-700", icon: GraduationCap },
};

const MAX_SKILLS = 3;

export function OpportunityCard({ offer }: { offer: OfferView }) {
  const { tone, icon: BadgeIcon } = BADGE[offer.badge] ?? BADGE.Emploi;

  return (
    <article className="border-border/60 shadow-soft hover:shadow-lift flex h-full flex-col rounded-2xl border bg-white p-4 transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-2">
          <CompanyLogo company={offer.company} />
        </div>
        <div className="flex items-start gap-1">
          <span
            className={cn(
              "mt-1 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
              tone,
            )}
          >
            <BadgeIcon className="size-3" aria-hidden /> {offer.badge}
          </span>
          <OfferMenu offer={offer} />
        </div>
      </div>

      <p className="text-navy mt-1 text-sm font-semibold">{offer.companyName}</p>
      <h2 className="text-navy mt-1 text-[15px] leading-snug font-bold">{offer.title}</h2>

      <ul className="text-muted mt-3 space-y-1.5 text-xs">
        <li className="flex items-center gap-2">
          <MapPin className="size-3.5 shrink-0" aria-hidden /> {offer.location}
        </li>
        {offer.workMode && (
          <li className="flex items-center gap-2">
            <Laptop className="size-3.5 shrink-0" aria-hidden /> {offer.workMode}
          </li>
        )}
        {offer.commitment && (
          <li className="flex items-center gap-2">
            <Briefcase className="size-3.5 shrink-0" aria-hidden /> {offer.commitment}
          </li>
        )}
        <li className="flex items-center gap-2">
          <Clock className="size-3.5 shrink-0" aria-hidden /> Publié {offer.published}
        </li>
      </ul>

      <ul aria-label="Compétences" className="mt-3 flex flex-wrap gap-1.5">
        {offer.skills.slice(0, MAX_SKILLS).map((s) => (
          <li
            key={s.name}
            className={cn(
              "rounded-md px-2 py-1 text-[10px] font-medium",
              s.owned ? "bg-green-50 text-green-700" : "text-brand bg-blue-50",
            )}
          >
            {s.name}
          </li>
        ))}
        {offer.skills.length > MAX_SKILLS && (
          <li className="text-brand rounded-md bg-blue-50 px-2 py-1 text-[10px] font-medium">
            +{offer.skills.length - MAX_SKILLS}
          </li>
        )}
      </ul>

      <OfferActions offer={offer} />
    </article>
  );
}
