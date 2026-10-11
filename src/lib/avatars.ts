/**
 * Profile pictures: a photo the person uploaded, or one of the SkillPass avatars. Both are stored in the
 * profile's `avatar_url` column: "preset:<key>" for an avatar, a storage path for a photo.
 */

/** Small stable hash: enough to tell two storage paths apart, and safe in both server and browser bundles. */
function shortHash(text: string) {
  let h = 5381;
  for (const ch of text) h = ((h << 5) + h + ch.charCodeAt(0)) >>> 0;
  return h.toString(36);
}

export interface AvatarPreset {
  key: string;
  label: string;
  /** Gradient of the background, from top-left to bottom-right. */
  from: string;
  to: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  { key: "orbit", label: "Orbite", from: "#0a1d4d", to: "#063db2" },
  { key: "peaks", label: "Sommets", from: "#063db2", to: "#38bdf8" },
  { key: "hex", label: "Hexagone", from: "#7c3aed", to: "#c084fc" },
  { key: "wave", label: "Vague", from: "#0891b2", to: "#34d399" },
  { key: "spark", label: "Étincelle", from: "#f97316", to: "#fbbf24" },
  { key: "grid", label: "Grille", from: "#334155", to: "#64748b" },
  { key: "shield", label: "Bouclier", from: "#047857", to: "#34d399" },
  { key: "arc", label: "Arc", from: "#be123c", to: "#fb7185" },
  { key: "bolt", label: "Éclair", from: "#b45309", to: "#fcd34d" },
  { key: "leaf", label: "Feuille", from: "#15803d", to: "#86efac" },
  { key: "diamond", label: "Diamant", from: "#1d4ed8", to: "#a78bfa" },
  { key: "chip", label: "Puce", from: "#0f172a", to: "#0e7490" },
];

export type AvatarRef = { kind: "preset"; key: string } | { kind: "upload"; version: string };

const PRESET_PREFIX = "preset:";
export const presetKeys = AVATAR_PRESETS.map((p) => p.key);
export const isPresetKey = (key: string) => presetKeys.includes(key);
export const presetStored = (key: string) => `${PRESET_PREFIX}${key}`;

/** What the column holds, as something a page can display. A path becomes a short version, to refresh caches. */
export function parseAvatar(stored: string | null | undefined): AvatarRef | null {
  if (!stored) return null;
  if (stored.startsWith(PRESET_PREFIX)) {
    const key = stored.slice(PRESET_PREFIX.length);
    return isPresetKey(key) ? { kind: "preset", key } : null;
  }
  return { kind: "upload", version: shortHash(stored) };
}

/** Where a photo is served from. Presets are drawn inline and have no address. */
export const avatarSrc = (profileId: string, ref: Extract<AvatarRef, { kind: "upload" }>) =>
  `/api/avatars/${profileId}?v=${ref.version}`;

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
