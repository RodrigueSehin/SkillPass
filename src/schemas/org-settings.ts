import { z } from "zod";
import { NOTIFICATION_CHANNELS, NOTIFICATION_KEYS, REGULATIONS, RETENTION_YEARS } from "@/types/org-settings";

const hex = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "Couleur invalide (format #RRGGBB)");
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Heure invalide");

export const brandingSchema = z.object({
  primary: hex,
  secondary: hex,
  accent: hex,
  welcomeText: z.string().trim().max(200, "Texte trop long (200 caractères)"),
  showLogo: z.boolean(),
  showName: z.boolean(),
  showCover: z.boolean(),
});

export const notificationsSchema = z
  .object({
    matrix: z.record(
      z.string(),
      z.object(
        Object.fromEntries(NOTIFICATION_CHANNELS.map((c) => [c, z.boolean()])) as Record<
          (typeof NOTIFICATION_CHANNELS)[number],
          z.ZodBoolean
        >,
      ),
    ),
    workHoursOnly: z.boolean(),
    start: time,
    end: time,
    days: z.array(z.number().int().min(0).max(6)).max(7),
  })
  .refine((n) => Object.keys(n.matrix).every((k) => NOTIFICATION_KEYS.includes(k)), "Notification inconnue")
  .refine((n) => !n.workHoursOnly || n.start < n.end, {
    message: "L'heure de fin précède l'heure de début",
    path: ["end"],
  })
  .refine((n) => !n.workHoursOnly || n.days.length > 0, {
    message: "Choisissez au moins un jour actif",
    path: ["days"],
  });

export const complianceSchema = z.object({
  regulations: z
    .array(z.enum(REGULATIONS.map((r) => r.key) as [string, ...string[]]))
    .max(REGULATIONS.length),
  retentionYears: z.coerce
    .number()
    .refine((y) => (RETENTION_YEARS as readonly number[]).includes(y), "Durée invalide"),
});

export const maintenanceSchema = z.object({ maintenance: z.boolean() });
