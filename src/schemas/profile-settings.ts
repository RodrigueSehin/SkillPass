import { z } from "zod";
import { TALENT_CHANNELS, TALENT_NOTIFICATION_KEYS } from "@/types/profile-settings";

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Heure invalide");

const channels = z.object(
  Object.fromEntries(TALENT_CHANNELS.map((c) => [c, z.boolean()])) as Record<
    (typeof TALENT_CHANNELS)[number],
    z.ZodBoolean
  >,
);

export const talentNotificationsSchema = z.object({
  matrix: z
    .record(z.string(), channels)
    .refine(
      (m) => Object.keys(m).every((k) => TALENT_NOTIFICATION_KEYS.includes(k)),
      "Notification inconnue",
    ),
  limitHours: z.boolean(),
  start: time,
  end: time,
  days: z.array(z.number().int().min(0).max(6)).max(7),
});

export const privacySchema = z.object({ inDirectory: z.boolean(), showLocation: z.boolean() });

export const passwordChangeSchema = z
  .object({
    current: z.string().min(1, "Mot de passe actuel requis"),
    next: z
      .string()
      .min(8, "8 caractères minimum")
      .regex(/[A-Z]/, "Une majuscule requise")
      .regex(/[0-9]/, "Un chiffre requis"),
    confirm: z.string(),
  })
  .refine((v) => v.next === v.confirm, {
    path: ["confirm"],
    message: "Les mots de passe ne correspondent pas",
  })
  .refine((v) => v.next !== v.current, { path: ["next"], message: "Choisissez un nouveau mot de passe" });
