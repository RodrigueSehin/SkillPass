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
}

export const BUSINESS_NAV: BusinessNavItem[] = [
  { href: "/business", label: "Tableau de bord", icon: Home },
  { href: "/business/talents", label: "Talents", icon: Users },
  { href: "/business/offres", label: "Offres d'emploi", icon: BriefcaseBusiness },
  { href: "/business/matching", label: "Matching IA", icon: Sparkles },
  { href: "/business/competences", label: "Compétences", icon: Database },
  { href: "/business/evaluations", label: "Évaluations", icon: ClipboardCheck },
  { href: "/business/equipes", label: "Équipes", icon: UsersRound },
  { href: "/business/analytics", label: "Analytics", icon: BarChart3 },
];

export const BUSINESS_SECONDARY_NAV: BusinessNavItem[] = [
  { href: "/business/organisation", label: "Organisation", icon: Building2 },
  { href: "/business/abonnements", label: "Abonnements", icon: CreditCard },
  { href: "/business/parametres", label: "Paramètres", icon: Settings },
];

/** Sections whose screens ship in a later step: they show a short notice until then. */
export const BUSINESS_PLACEHOLDERS = ["matching", "abonnements", "parametres"];
