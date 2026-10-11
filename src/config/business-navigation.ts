import type { BusinessFeature } from "@/lib/plans/entitlements";
import {
  BarChart3,
  Building2,
  ClipboardCheck,
  CreditCard,
  Database,
  Home,
  Settings,
  Sparkles,
  Users,
  UsersRound,
  BriefcaseBusiness,
  type LucideIcon,
} from "lucide-react";

export interface BusinessNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** The plan feature the section belongs to: a plan without it does not show the entry. */
  feature?: BusinessFeature;
}

export const BUSINESS_NAV: BusinessNavItem[] = [
  { href: "/business", label: "Tableau de bord", icon: Home },
  { href: "/business/talents", label: "Talents", icon: Users },
  { href: "/business/offres", label: "Offres d'emploi", icon: BriefcaseBusiness },
  { href: "/business/matching", label: "Matching IA", icon: Sparkles, feature: "matching" },
  { href: "/business/competences", label: "Compétences", icon: Database },
  { href: "/business/evaluations", label: "Évaluations", icon: ClipboardCheck, feature: "evaluations" },
  { href: "/business/equipes", label: "Équipes", icon: UsersRound },
  { href: "/business/analytics", label: "Analytics", icon: BarChart3, feature: "analytics" },
];

export const BUSINESS_SECONDARY_NAV: BusinessNavItem[] = [
  { href: "/business/organisation", label: "Organisation", icon: Building2 },
  { href: "/business/abonnements", label: "Abonnements", icon: CreditCard },
  { href: "/business/parametres", label: "Paramètres", icon: Settings },
];
