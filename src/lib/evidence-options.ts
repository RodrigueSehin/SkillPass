/** Choices offered by the evidence wizard. Technologies are free text: this is only a shortcut list. */
export const TECH_GROUPS = ["Power Platform", "Développement", "Cloud", "Design", "Gestion de projet", "Autres"] as const;
export type TechGroup = (typeof TECH_GROUPS)[number];

export const TECH_CATALOG: { name: string; group: TechGroup; color: string; mark: string }[] = [
  { name: "Power Apps", group: "Power Platform", color: "#742774", mark: "PA" },
  { name: "Power Automate", group: "Power Platform", color: "#0066ff", mark: "PAu" },
  { name: "Power BI", group: "Power Platform", color: "#f2c811", mark: "BI" },
  { name: "Dataverse", group: "Power Platform", color: "#107c10", mark: "DV" },
  { name: "SharePoint", group: "Power Platform", color: "#038387", mark: "SP" },
  { name: "Microsoft 365", group: "Power Platform", color: "#d83b01", mark: "365" },
  { name: "React", group: "Développement", color: "#0891b2", mark: "Re" },
  { name: "Node.js", group: "Développement", color: "#3c873a", mark: "JS" },
  { name: "Azure", group: "Cloud", color: "#0078d4", mark: "Az" },
  { name: "SQL Server", group: "Développement", color: "#cc2927", mark: "SQL" },
  { name: "MySQL", group: "Développement", color: "#00758f", mark: "My" },
  { name: "TypeScript", group: "Développement", color: "#3178c6", mark: "TS" },
  { name: "JavaScript", group: "Développement", color: "#f7df1e", mark: "JS" },
  { name: "HTML", group: "Développement", color: "#e34f26", mark: "5" },
  { name: "CSS", group: "Développement", color: "#1572b6", mark: "3" },
  { name: "Tailwind CSS", group: "Développement", color: "#06b6d4", mark: "Tw" },
  { name: "Figma", group: "Design", color: "#a259ff", mark: "Fi" },
  { name: "Linux", group: "Cloud", color: "#334155", mark: "Lx" },
  { name: "Jira", group: "Gestion de projet", color: "#2684ff", mark: "Ji" },
  { name: "Notion", group: "Autres", color: "#111827", mark: "N" },
];

export const EVIDENCE_CATEGORIES = [
  "Projet professionnel",
  "Projet personnel",
  "Projet académique",
  "Formation & certification",
  "Open source",
  "Autre",
];

export const TAG_IDEAS = ["Power Platform", "Logistique", "Gestion de projet", "Transformation digitale", "Application métier", "Automatisation"];
