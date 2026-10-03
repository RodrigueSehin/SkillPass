# Plan de développement SkillPass

Suivi vivant des phases. Cases cochées = livré et vérifié (typecheck, lint, tests).
Méthode par fonctionnalité : besoin → modèle → schéma Zod → repository → service → API/action → composants → page → loading/error/empty → responsive → tests.

## Phase 1 — Foundation ✅
- [x] Next.js 16, TypeScript strict, Tailwind 4, ESLint, Prettier
- [x] Design system, composants UI de base, layout responsive
- [x] Landing, login, register (wizard 3 étapes), forgot-password, verify-email
- [x] Supabase Auth (proxy, callback OAuth), Prisma 7, seed
- [x] Tests Vitest + Playwright (6 E2E verts)
- [x] Dépôt GitHub poussé

## Phase 2 — Talent (en cours)
Décisions : pas de base disponible localement → repositories derrière une interface ; implémentation Prisma en production, **implémentation mémoire** (données de démo) en dev sans `DATABASE_URL`. Toutes les requêtes sont filtrées par `profileId` dans le repository. Le score et le statut de vérification ne sont jamais modifiables par l'utilisateur.

1. [x] **Compétences** — `/dashboard/skills` (liste, recherche, filtre, tri, ajout, modification, suppression) ; API `/api/skills`, `/api/talent-skills`
2. [ ] Détail compétence — `/dashboard/skills/[skillId]`
3. [x] Projets — `/dashboard/projects` (+ liens projet → compétences)
4. [x] Expériences — `/dashboard/experiences`
5. [x] Certifications — `/dashboard/certifications`
6. [ ] Preuves (evidence) + upload sécurisé Supabase Storage — `/dashboard/evidence`
7. [x] Profil (édition) + `/api/profile`
8. [x] Mon SkillPass — `/dashboard/skillpass` (score explicable ; « Télécharger CV » reporté)
9. [x] Profil public SEO — `/[username]` (metadata, OpenGraph, JSON-LD)
10. [ ] Dashboard branché sur les services (fin des données de démo)

## Phase 3 — Verification
Évaluations, credentials `SP-xxxxxx`, badges, QR `/verify/[credentialId]`, moteur de score SkillPass explicable (30/20/20/15/10/5).

## Phase 4 — Business
Entreprises multi-tenant, offres, recherche de talents, matching, skill gap.

## Phase 5 — AI
`AIService` abstrait, schémas Zod sur toutes les réponses, extraction CV, matching IA, recherche en langage naturel.

## Phase 6 — Monétisation
Plans Free/Pro/Business, `PaymentService` (Stripe), limites d'usage.

## Phase 7 — Scale
Academy, API publique, PWA, Enterprise, White label.

## Prérequis ouverts
- Les repositories Prisma (compétences, projets, expériences, certifications) ne sont pas testés contre une vraie base.
- Projet Supabase + `DATABASE_URL`/`DIRECT_URL` pour valider les repositories Prisma, RLS et uploads.
- Docker Desktop (non démarré) permettrait une base Postgres locale.
