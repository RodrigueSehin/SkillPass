/**
 * Landing page content that is meant to be edited by the team, kept out of the components.
 */

/**
 * ⚠️ Placeholder figures taken from the design mockup. Replace them with real numbers (or remove
 * the block) before the public launch: they are not computed from the database.
 */
export const HERO_STATS = [
  { value: "250K+", label: "Talents enregistrés" },
  { value: "12K+", label: "Entreprises" },
  { value: "85%", label: "Taux de satisfaction" },
] as const;

export const NAV_LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/#fonctionnalites", label: "Fonctionnalités" },
  { href: "/#tarifs", label: "Tarifs" },
  { href: "/#a-propos", label: "À propos" },
] as const;

/** Every entry is an anchor of the page: no link leads to a page that does not exist yet. */
export const RESOURCE_LINKS = [
  { href: "/#ecosysteme", label: "Comment ça marche" },
  { href: "/#talents", label: "Pour les talents" },
  { href: "/#entreprises", label: "Pour les entreprises" },
  { href: "/#academies", label: "Pour les académies" },
  { href: "/#verification", label: "Vérifier un credential" },
] as const;
