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

/** Left panel of the sign-in pages. Anchors point at the landing page. */
export const AUTH_NAV_LINKS = [
  { href: "/#fonctionnalites", label: "Fonctionnalités" },
  { href: "/#tarifs", label: "Tarifs" },
  { href: "/#a-propos", label: "À propos" },
] as const;

/** ⚠️ Placeholder figures from the mockup, like HERO_STATS: replace with real numbers before launch. */
export const AUTH_STATS = [
  { value: "50K+", label: "Talents" },
  { value: "2K+", label: "Entreprises" },
  { value: "500+", label: "Organismes de formation" },
  { value: "95%", label: "Taux de satisfaction" },
] as const;
