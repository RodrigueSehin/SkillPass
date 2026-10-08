/** Channels a notification can reach a member through. */
export const NOTIFICATION_CHANNELS = ["inApp", "email", "sms"] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];
export const NOTIFICATION_CHANNEL_LABELS: Record<NotificationChannel, string> = {
  inApp: "In-app",
  email: "E-mail",
  sms: "SMS",
};

export interface NotificationEvent {
  key: string;
  title: string;
  text: string;
  /** Default channels. */
  defaults: Record<NotificationChannel, boolean>;
}

const ev = (key: string, title: string, text: string, sms = false): NotificationEvent => ({
  key,
  title,
  text,
  defaults: { inApp: true, email: true, sms },
});

export const NOTIFICATION_GROUPS: { title: string; events: NotificationEvent[] }[] = [
  {
    title: "Talents",
    events: [
      ev("talent.new", "Nouveau talent inscrit", "Lorsqu'un nouveau talent rejoint votre vivier."),
      ev(
        "talent.recommendation",
        "Recommandation reçue",
        "Lorsqu'un talent reçoit une nouvelle recommandation.",
      ),
    ],
  },
  {
    title: "Offres d'emploi",
    events: [
      ev("job.application", "Nouvelle candidature", "Lorsqu'une offre reçoit une candidature."),
      ev("job.expiring", "Offre proche d'expiration", "Rappel avant la date de clôture.", true),
      ev("job.published", "Offre publiée avec succès", "Confirmation de publication."),
    ],
  },
  {
    title: "Évaluations",
    events: [
      ev("evaluation.completed", "Évaluation complétée", "Lorsqu'un talent termine une évaluation."),
      ev("evaluation.result", "Résultat d'évaluation disponible", "Lorsqu'un résultat est prêt."),
    ],
  },
  {
    title: "Organisation",
    events: [
      ev("org.member", "Nouveau membre", "Lorsqu'un membre rejoint votre organisation."),
      ev("org.settings", "Modification des paramètres", "Lorsqu'un changement important est effectué.", true),
      ev("org.security", "Alerte de sécurité", "Activité suspecte sur le compte.", true),
    ],
  },
];

export const NOTIFICATION_KEYS = NOTIFICATION_GROUPS.flatMap((g) => g.events.map((e) => e.key));
export const WEEK_DAYS = [
  [1, "Lun"],
  [2, "Mar"],
  [3, "Mer"],
  [4, "Jeu"],
  [5, "Ven"],
  [6, "Sam"],
  [0, "Dim"],
] as const;

export interface NotificationSettings {
  matrix: Record<string, Record<NotificationChannel, boolean>>;
  /** Only send between `start` and `end`, on the active days. */
  workHoursOnly: boolean;
  start: string;
  end: string;
  /** 0 = Sunday … 6 = Saturday. */
  days: number[];
}

export interface BrandingSettings {
  /** Colour of the navigation and the titles. */
  primary: string;
  /** Colour of the highlights (stars, crown). */
  secondary: string;
  /** Colour of the buttons and links. */
  accent: string;
  welcomeText: string;
  showLogo: boolean;
  showName: boolean;
  showCover: boolean;
}

export const REGULATIONS = [
  { key: "RGPD", title: "RGPD", text: "Règlement général sur la protection des données (UE)" },
  {
    key: "CI-2013-450",
    title: "Loi n°2013-450",
    text: "Protection des données à caractère personnel (Côte d'Ivoire)",
  },
  { key: "ISO-27001", title: "ISO 27001", text: "Système de management de la sécurité de l'information" },
  { key: "OTHER", title: "Autres", text: "Autres réglementations spécifiques à votre secteur" },
] as const;
export const RETENTION_YEARS = [1, 2, 3, 5, 10] as const;

export interface ComplianceSettings {
  regulations: string[];
  /** How long candidate data is kept, in years. Declared here: nothing deletes data automatically yet. */
  retentionYears: number;
}

export interface OrgSettings {
  /** Only administrators can enter while it is on. */
  maintenance: boolean;
  branding: BrandingSettings;
  notifications: NotificationSettings;
  compliance: ComplianceSettings;
}

export const DEFAULT_BRANDING: BrandingSettings = {
  primary: "#011e50",
  secondary: "#ffb800",
  accent: "#063db2",
  welcomeText: "Trouvez, recrutez et développez les meilleurs talents.",
  showLogo: true,
  showName: true,
  showCover: true,
};

export const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  matrix: Object.fromEntries(
    NOTIFICATION_GROUPS.flatMap((g) => g.events.map((e) => [e.key, { ...e.defaults }])),
  ),
  workHoursOnly: true,
  start: "08:00",
  end: "18:00",
  days: [1, 2, 3, 4, 5],
};

export const DEFAULT_ORG_SETTINGS: OrgSettings = {
  maintenance: false,
  branding: DEFAULT_BRANDING,
  notifications: DEFAULT_NOTIFICATIONS,
  compliance: { regulations: [], retentionYears: 5 },
};

/** Settings as stored, completed with the defaults: older rows and new options never leave holes. */
export function withDefaults(stored: unknown): OrgSettings {
  const s = (stored && typeof stored === "object" ? stored : {}) as Partial<OrgSettings>;
  const matrix = { ...DEFAULT_NOTIFICATIONS.matrix };
  for (const [key, channels] of Object.entries(s.notifications?.matrix ?? {})) {
    if (key in matrix) matrix[key] = { ...matrix[key]!, ...channels };
  }
  return {
    maintenance: Boolean(s.maintenance),
    branding: { ...DEFAULT_BRANDING, ...s.branding },
    notifications: { ...DEFAULT_NOTIFICATIONS, ...s.notifications, matrix },
    compliance: { ...DEFAULT_ORG_SETTINGS.compliance, ...s.compliance },
  };
}
