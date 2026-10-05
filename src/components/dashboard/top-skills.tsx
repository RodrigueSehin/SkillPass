import Link from "next/link";
import { ArrowRight, ChevronRight, Sparkles } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { LEVEL_CHIP, skillVisual } from "@/config/skill-visuals";
import { cn } from "@/lib/utils/cn";
import type { TalentSkillDTO } from "@/repositories/talent-skill.repository";
import { SKILL_LEVEL_LABELS } from "@/types/skill";

export function TopSkills({ skills }: { skills: TalentSkillDTO[] }) {
  return (
    <section
      aria-labelledby="top-skills-title"
      className="border-border/60 shadow-soft min-w-0 rounded-2xl border bg-white p-6"
    >
      <div className="flex items-center justify-between gap-4">
        <h2 id="top-skills-title" className="text-navy text-lg font-bold">
          Top compétences
        </h2>
        <Link
          href="/dashboard/skills"
          className="text-brand flex items-center gap-1 text-sm font-semibold hover:underline"
        >
          Voir toutes <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>

      {skills.length === 0 ? (
        <EmptyState
          className="mt-4 border-0 py-8"
          icon={Sparkles}
          title="Aucune compétence"
          description="Ajoutez votre première compétence pour la voir apparaître ici."
        />
      ) : (
        <ul className="divide-border/60 mt-3 divide-y">
          {skills.map((skill) => {
            const { icon: Icon, tile } = skillVisual(skill.name);
            return (
              <li key={skill.id}>
                {/*
                  Flex rather than grid: the bar takes whatever room is left, so it never collapses to
                  zero width when the card is narrow. On phones it drops to its own line.
                */}
                <Link
                  href={`/dashboard/skills/${skill.id}`}
                  className="group flex flex-wrap items-center gap-x-4 gap-y-2 py-3.5 sm:flex-nowrap"
                >
                  <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", tile)}>
                    <Icon className="size-6" aria-hidden />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:w-44 sm:flex-none sm:shrink-0">
                    <span className="text-navy text-sm font-semibold">{skill.name}</span>
                    <span
                      className={cn("rounded-md px-2 py-0.5 text-xs font-semibold", LEVEL_CHIP[skill.level])}
                    >
                      {SKILL_LEVEL_LABELS[skill.level]}
                    </span>
                  </span>
                  <span
                    role="progressbar"
                    aria-label={`${skill.name} : ${skill.score}%`}
                    aria-valuenow={skill.score}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    className="order-last block h-2 basis-full overflow-hidden rounded-full bg-slate-100 sm:order-none sm:min-w-16 sm:flex-1 sm:basis-0"
                  >
                    <span
                      className="bg-brand block h-full rounded-full"
                      style={{ width: `${skill.score}%` }}
                    />
                  </span>
                  <span className="text-navy w-11 shrink-0 text-right text-sm font-bold">{skill.score}%</span>
                  <span className="text-muted hidden w-28 shrink-0 text-xs 2xl:block">
                    {skill.yearsOfExperience} an{skill.yearsOfExperience > 1 ? "s" : ""} d&apos;expérience
                  </span>
                  <ChevronRight
                    className="group-hover:text-brand hidden size-4 shrink-0 text-slate-400 sm:block"
                    aria-hidden
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
