/** Channels a talent can be notified through. SMS is left out: nothing can send one yet. */
export const TALENT_CHANNELS = ["inApp", "email"] as const;
export type TalentChannel = (typeof TALENT_CHANNELS)[number];
export const TALENT_CHANNEL_LABELS: Record<TalentChannel, string> = { inApp: "In-app", email: "E-mail" };

export interface TalentNotificationEvent {
  key: string;
  title: string;
  text: string;
  defaults: Record<TalentChannel, boolean>;
}

const ev = (key: string, title: string, text: string, email = true): TalentNotificationEvent => ({
  key,
  title,
  text,
  defaults: { inApp: true, email },
});

export const TALENT_NOTIFICATION_GROUPS: { title: string; events: TalentNotificationEvent[] }[] = [
  {
    title: "Opportunités",
    events: [
      ev("opportunity.match", "Nouvelle opportunité", "Lorsqu'une offre correspond à votre profil."),
      ev("opportunity.deadline", "Offre sauvegardée bientôt close", "Rappel avant la date limite."),
      ev(
        "application.update",
        "Mise à jour d'une candidature",
        "Lorsqu'une entreprise fait avancer votre dossier.",
      ),
    ],
  },
  {
    title: "Compétences",
    events: [
      ev("skill.verified", "Compétence vérifiée", "Lorsqu'une de vos compétences est validée."),
      ev("assessment.result", "Résultat d'évaluation", "Lorsque le résultat d'une évaluation est prêt."),
      ev("certification.expiring", "Certification bientôt expirée", "Rappel avant l'expiration.", false),
    ],
  },
  {
    title: "Recommandations",
    events: [
      ev("recommendation.received", "Recommandation reçue", "Lorsqu'une personne vous recommande."),
      ev(
        "recommendation.pending",
        "Recommandation à valider",
        "Lorsqu'une recommandation attend votre accord.",
      ),
    ],
  },
  {
    title: "Compte",
    events: [ev("account.security", "Alerte de sécurité", "Activité inhabituelle sur votre compte.")],
  },
];

export const TALENT_NOTIFICATION_KEYS = TALENT_NOTIFICATION_GROUPS.flatMap((g) => g.events.map((e) => e.key));

export interface TalentNotificationSettings {
  matrix: Record<string, Record<TalentChannel, boolean>>;
  /** Only notify between `start` and `end`, on the active days (0 = Sunday … 6 = Saturday). */
  limitHours: boolean;
  start: string;
  end: string;
  days: number[];
}

export interface PrivacySettings {
  /** Appear in the search of companies using SkillPass Business. Needs a public profile. */
  inDirectory: boolean;
  /** Show the city on the public profile and in the company search. */
  showLocation: boolean;
}

export interface ProfileSettings {
  notifications: TalentNotificationSettings;
  privacy: PrivacySettings;
}

export const DEFAULT_PROFILE_SETTINGS: ProfileSettings = {
  notifications: {
    matrix: Object.fromEntries(
      TALENT_NOTIFICATION_GROUPS.flatMap((g) => g.events.map((e) => [e.key, { ...e.defaults }])),
    ),
    limitHours: false,
    start: "08:00",
    end: "20:00",
    days: [1, 2, 3, 4, 5],
  },
  privacy: { inDirectory: true, showLocation: true },
};

/** Settings as stored, completed with the defaults: older rows and new options never leave holes. */
export function profileSettingsWithDefaults(stored: unknown): ProfileSettings {
  const s = (stored && typeof stored === "object" ? stored : {}) as Partial<ProfileSettings>;
  const defaults = DEFAULT_PROFILE_SETTINGS;
  const matrix = { ...defaults.notifications.matrix };
  for (const [key, channels] of Object.entries(s.notifications?.matrix ?? {})) {
    if (key in matrix) matrix[key] = { ...matrix[key]!, ...channels };
  }
  return {
    notifications: { ...defaults.notifications, ...s.notifications, matrix },
    privacy: { ...defaults.privacy, ...s.privacy },
  };
}
