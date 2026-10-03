import {
  Award,
  BookOpenCheck,
  Briefcase,
  FolderKanban,
  HelpCircle,
  Home,
  IdCard,
  Layers,
  type LucideIcon,
  MessageSquareQuote,
  Settings,
  Sparkles,
  Target,
  User,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const DASHBOARD_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/dashboard/skillpass", label: "Mon SkillPass", icon: IdCard },
  { href: "/dashboard/skills", label: "Compétences", icon: Sparkles },
  { href: "/dashboard/assessments", label: "Évaluations", icon: BookOpenCheck },
  { href: "/dashboard/certifications", label: "Certifications", icon: Award },
  { href: "/dashboard/experiences", label: "Expériences", icon: Briefcase },
  { href: "/dashboard/projects", label: "Projets", icon: FolderKanban },
  { href: "/dashboard/portfolio", label: "Portfolio", icon: Layers },
  { href: "/dashboard/recommendations", label: "Recommandations", icon: MessageSquareQuote },
  { href: "/dashboard/opportunities", label: "Opportunités", icon: Target },
];

export const DASHBOARD_SECONDARY_NAV: NavItem[] = [
  { href: "/dashboard/settings", label: "Paramètres", icon: Settings },
  { href: "/dashboard/help", label: "Aide", icon: HelpCircle },
];

/** Five-entry bottom bar used on mobile. */
export const MOBILE_NAV: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dashboard/skills", label: "Skills", icon: Sparkles },
  { href: "/dashboard/skillpass", label: "Pass", icon: IdCard },
  { href: "/dashboard/opportunities", label: "Jobs", icon: Target },
  { href: "/dashboard/settings", label: "Profile", icon: User },
];

/** Slugs rendered by the placeholder route until each feature ships. */
export const PLACEHOLDER_SECTIONS = [...DASHBOARD_NAV, ...DASHBOARD_SECONDARY_NAV]
  .map((item) => item.href.replace("/dashboard/", ""))
  .filter((slug) => slug !== "/dashboard");
