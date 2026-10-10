import { MATCH_STATUS_LABELS, type SavedMatchDTO } from "@/types/matching";
import type { JobOfferDTO } from "@/types/job-offer";
import type { TalentRecord } from "@/types/talent";

/** A cell that starts like a formula would run in a spreadsheet: neutralize it. */
const cell = (value: string | number) => {
  const text = String(value);
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
};

export function matchingCsv(saved: SavedMatchDTO[], records: TalentRecord[], offers: JobOfferDTO[]) {
  const byProfile = new Map(records.map((t) => [t.id, t]));
  const header = [
    "Nom",
    "Poste",
    "Lieu",
    "Expérience (ans)",
    "Compétences",
    "Statut",
    "Offre",
    "Match (%)",
    "Profil public",
  ];
  const lines = saved.flatMap((s) => {
    const t = byProfile.get(s.profileId);
    if (!t) return [];
    return [
      [
        t.fullName,
        t.profession ?? t.headline ?? "",
        t.location ?? "",
        t.yearsOfExperience,
        t.skills.map((k) => k.name).join(", "),
        MATCH_STATUS_LABELS[s.status],
        offers.find((o) => o.id === s.jobOfferId)?.title ?? "",
        s.match ?? "",
        `/${t.username}`,
      ],
    ];
  });
  // The BOM makes Excel read the accents as UTF-8.
  return `﻿${[header, ...lines].map((row) => row.map(cell).join(";")).join("\r\n")}\r\n`;
}
