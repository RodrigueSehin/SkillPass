# SkillPass

> Prove your skills. Own your future.

Passeport numérique des compétences : profil → compétences → preuves → évaluation → validation → badges → SkillPass → opportunités.

**État : Phase 3 — Vérification terminée** (talent complet + évaluations, badges, credentials vérifiables, recommandations).

## Stack

Next.js 16 (App Router, `proxy.ts`) · React 19 · TypeScript strict · Tailwind CSS 4 · Radix UI · Supabase Auth · PostgreSQL + Prisma 7 · Zod · React Hook Form · Vitest · Playwright.

## Installation

```bash
npm install
cp .env.example .env.local   # puis renseigner Supabase + DATABASE_URL
npm run db:generate
npm run db:migrate           # crée les tables
npm run db:seed              # données de démonstration
npm run dev                  # http://localhost:3000
```

Sans variables Supabase, hors production, l'application démarre en **mode aperçu** : le dashboard est accessible avec un utilisateur de démonstration. En production, une configuration manquante bloque les routes protégées (503).

### Configuration Supabase

1. Créer un projet Supabase, copier URL + anon key dans `.env.local`.
2. Auth → URL Configuration : ajouter `http://localhost:3000/auth/callback`.
3. Auth → Providers : activer Email, Google, Azure (Microsoft), LinkedIn (OIDC).
4. Après `db:migrate`, appliquer les politiques RLS décrites dans [SECURITY.md](SECURITY.md).

## Scripts

| Commande                                | Rôle                                                    |
| --------------------------------------- | ------------------------------------------------------- |
| `npm run dev` / `build` / `start`       | Next.js                                                 |
| `npm run typecheck` / `lint` / `format` | Qualité                                                 |
| `npm test`                              | Tests unitaires et composants (Vitest)                  |
| `npm run e2e`                           | Tests E2E (Playwright, `npx playwright install` requis) |
| `npm run db:*`                          | Prisma (generate, migrate, seed, studio)                |

## Documentation

[ARCHITECTURE.md](ARCHITECTURE.md) · [DATABASE.md](DATABASE.md) · [SECURITY.md](SECURITY.md) · [API.md](API.md) · [PLAN.md](PLAN.md). `AI.md` arrive avec la Phase 5.
