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

## Phase 2 — Talent ✅ (code complet, repositories Prisma non validés sur une vraie base)

Décisions : pas de base disponible localement → repositories derrière une interface ; implémentation Prisma en production, **implémentation mémoire** (données de démo) en dev sans `DATABASE_URL`. Toutes les requêtes sont filtrées par `profileId` dans le repository. Le score et le statut de vérification ne sont jamais modifiables par l'utilisateur.

1. [x] **Compétences** — `/dashboard/skills` (liste, recherche, filtre, tri, ajout, modification, suppression) ; API `/api/skills`, `/api/talent-skills`
2. [x] Détail compétence — `/dashboard/skills/[skillId]`
3. [x] Projets — `/dashboard/projects` (+ liens projet → compétences)
4. [x] Expériences — `/dashboard/experiences`
5. [x] Certifications — `/dashboard/certifications`
6. [x] Preuves (evidence) + upload sécurisé Supabase Storage — `/dashboard/evidence`
7. [x] Profil (édition) + `/api/profile`
8. [x] Mon SkillPass — `/dashboard/skillpass` (score explicable ; « Télécharger CV » reporté)
9. [x] Profil public SEO — `/[username]` (metadata, OpenGraph, JSON-LD)
10. [x] Dashboard branché sur les services (fin des données de démo)

## Phase 3 — Verification ✅ (code complet, repositories Prisma non validés sur une vraie base)

- [x] Évaluations : banque de questions versionnée dans le code, chrono imposé par le serveur, correction côté serveur, score par domaine, délai entre tentatives
- [x] Validation humaine des évaluations critiques (rôles VERIFIER / EVALUATOR / SKILLPASS_ADMIN, jamais sur sa propre évaluation) — `/admin/verifications`
- [x] Credentials `SP-XXXXXX` (2 ans), badges, page publique `/verify/[credentialId]` avec QR code
- [x] Recommandations par lien à usage unique, modération par le propriétaire
- [x] Score SkillPass alimenté par les compétences vérifiées et les recommandations publiées
- [ ] Notifications (in-app) — reportées
- [ ] Révocation de credential par un administrateur — reportée (le statut REVOKED est géré à l'affichage)
- [ ] Expiration automatique du statut « vérifiée » d'une compétence à l'expiration du credential — reportée
- [ ] Sitemap des profils publics et des credentials — reporté

## Phase 4 — Business

Entreprises multi-tenant, offres, recherche de talents, matching, skill gap. Maquettes : `src/maquettes/skillpass_business/`.

### Étape 1 — Organisation et équipes ✅ (code complet, repositories Prisma non validés sur une vraie base)

- [x] Modèle multi-tenant : organisations, membres (rôles, permissions détaillées, invitations à usage unique valables 7 jours), départements, sites ; toutes les méthodes du repository prennent l'identifiant de l'organisation
- [x] Coque Business (`/business`) : barre latérale, recherche Ctrl K, menu de l'organisation, onboarding (création d'organisation) et page d'invitation `/business/join/[token]`
- [x] Organisation : vue d'ensemble, informations, départements, sites, logo (upload)
- [x] Équipes : membres (filtres, pagination, rôle, désactivation, retrait, relance), équipes, rôles et permissions, invitations
- [x] Assistants « Ajouter un département » et « Ajouter un membre » (4 étapes, aperçu en direct)
- [x] Plan Starter/Pro/Business/Enterprise : limite de membres appliquée à l'invitation
### Étape 2 — Offres d'emploi ✅ (repositories Prisma non validés sur une vraie base)

- [x] Liste (onglets, filtres, pagination, export CSV), assistant de création/modification en 3 étapes avec aperçu en direct, brouillon / publication / clôture / duplication / suppression
- [x] Une offre publiée est répliquée en opportunité (visible dans Opportunités côté talent, candidatures existantes), masquée avant sa date de publication et après sa date limite ; limite mensuelle du plan appliquée
- [x] SQL : `supabase/update-0013-job-offers.sql` (à lancer après 0012)
- [ ] Diffusion LinkedIn / e-mail / site carrière : choix enregistré, pas d'envoi réel

### Étape 3 — Talents ✅ (repository Prisma non validé sur une vraie base)

- [x] Recherche dans les profils publics (compétences, niveau, lieu, expérience, certifications, disponibilité), pourcentage de correspondance, panneau de profil (score, compétences, projets, expériences). Aucune coordonnée n'est exposée : le contact passe par le profil public.
- [ ] Contact direct, shortlist et export des profils — à construire avec le Matching IA

### Étape 4 — Évaluations ✅ (repositories Prisma non validés sur une vraie base)

- [x] Liste, bibliothèque de modèles, résultats et statistiques ; assistant de création en 4 étapes (9 types de questions, paramètres, programmation) ; SQL `supabase/update-0014-evaluations.sql`
- [x] Passage par lien de partage `/e/[token]` (minuteur, questions mélangées, plein écran, copier-coller limité, tentatives) ; correction des questions ouvertes par l'équipe ; seuil de réussite appliqué
- [ ] Certificat et badge délivrés au talent, surveillance webcam, dépôt de fichiers — non disponibles

### Étape 5 — Compétences ✅ (repository Prisma non validé sur une vraie base)

- [x] Catalogue calculé sur les profils publics et les offres publiées (talents, niveau moyen, demande, tendance sur 6 mois) ; référentiel propre à l'organisation (ajout, modification, suppression) proposé dans les offres et évaluations ; SQL `supabase/update-0015-organization-skills.sql`

- [ ] Tableau de bord complet, Évaluations (+ création), Analytics, Abonnement, Paramètres — étapes suivantes
- [ ] Envoi réel des invitations par e-mail — reporté (le lien est à copier)

## Phase 5 — AI

`AIService` abstrait, schémas Zod sur toutes les réponses, extraction CV, matching IA, recherche en langage naturel.

## Phase 6 — Monétisation

Plans Free/Pro/Business, `PaymentService` (Stripe), limites d'usage.

## Phase 7 — Scale

Academy, API publique, PWA, Enterprise, White label.

## Prérequis ouverts

- Contenu des évaluations : la banque actuelle (3 évaluations de 9 questions) est un contenu de départ à faire relire par des experts métier avant tout lancement.
- Pour tester la validation humaine, attribuer le rôle `VERIFIER` à un profil (`update profiles set role = 'VERIFIER' where ...`) : aucun écran n'attribue de rôle.
- `supabase/setup.sql` regroupe les migrations 0001 + 0002 et les politiques RLS.
- Appliquer `prisma/migrations/0001_init` (SQL généré, jamais exécuté) puis `supabase/policies.sql` (RLS + bucket `evidence`).
- Les repositories Prisma (compétences, projets, expériences, certifications) ne sont pas testés contre une vraie base.
- Projet Supabase + `DATABASE_URL`/`DIRECT_URL` pour valider les repositories Prisma, RLS et uploads.
- Docker Desktop (non démarré) permettrait une base Postgres locale.
