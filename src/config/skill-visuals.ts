import {
  AppWindow,
  BarChart3,
  Bot,
  Database,
  Lightbulb,
  Palette,
  Sparkles,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import type { SkillLevel } from "@/types/skill";

export interface SkillVisual {
  icon: LucideIcon;
  /** Tailwind classes for the rounded icon tile. */
  tile: string;
}

// Order matters: "Power Automate" must be tested before the generic "automation" rule.
// Short patterns use word boundaries so that "Cuisine" is not mistaken for "UI".
const VISUALS: { match: RegExp; visual: SkillVisual }[] = [
  { match: /power\s*apps/i, visual: { icon: AppWindow, tile: "bg-fuchsia-100 text-fuchsia-700" } },
  { match: /power\s*automate/i, visual: { icon: Workflow, tile: "bg-blue-100 text-blue-700" } },
  {
    match: /dataverse|\bsql\b|base de donn/i,
    visual: { icon: Database, tile: "bg-emerald-100 text-emerald-700" },
  },
  {
    match: /power\s*bi|\banalytics|data viz/i,
    visual: { icon: BarChart3, tile: "bg-amber-100 text-amber-600" },
  },
  {
    match: /\bia\b|\bai\b|intelligence|automation|machine/i,
    visual: { icon: Bot, tile: "bg-violet-100 text-violet-700" },
  },
  { match: /\bui\b|\bux\b|\bdesign/i, visual: { icon: Palette, tile: "bg-pink-100 text-pink-600" } },
  {
    match: /\btransformation|\bstrat/i,
    visual: { icon: Lightbulb, tile: "bg-orange-100 text-orange-600" },
  },
];

const FALLBACK: SkillVisual = { icon: Sparkles, tile: "bg-blue-100 text-brand" };

/** Icon and colour for a skill, recognised by name; unknown skills get a neutral sparkle. */
export function skillVisual(name: string): SkillVisual {
  return VISUALS.find((v) => v.match.test(name))?.visual ?? FALLBACK;
}

/** Colour of the small level chip next to a skill name. */
export const LEVEL_CHIP: Record<SkillLevel, string> = {
  EXPERT: "bg-blue-50 text-brand",
  ADVANCED: "bg-green-50 text-success",
  INTERMEDIATE: "bg-violet-50 text-violet-600",
  BEGINNER: "bg-slate-100 text-slate-600",
};
