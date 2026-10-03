# Architecture

## Flux

`UI (components) → hooks → services → Prisma / Supabase`

La logique métier vit dans `src/services`, jamais dans les composants. Les mutations passent par des Server Actions (`src/app/(auth)/actions.ts`) qui valident avec Zod (`src/schemas`) avant d'appeler un service.

## Structure

| Dossier | Contenu |
| --- | --- |
| `src/app/(marketing)` | Landing publique |
| `src/app/(auth)` | login, register (wizard 3 étapes), forgot-password, verify-email |
| `src/app/auth/callback` | Échange du code OAuth / e-mail, création idempotente du profil |
| `src/app/dashboard` | Espace talent (layout protégé, loading/error, sections à venir) |
| `src/components/ui` | Primitives (style shadcn/ui, Radix + CVA) |
| `src/components/{layout,skills,auth,marketing}` | Composants métier |
| `src/lib/auth` | Clients Supabase, session, `requireUser` |
| `src/lib/db` | Singleton Prisma (adapter `pg`) |
| `src/services` | Logique métier (`profile.service.ts`) |
| `src/config` | Navigation, données de démo |
| `prisma/` | Schéma, seed |

## Choix techniques

- **`proxy.ts`** (ex-middleware, Next 16) rafraîchit la session Supabase et redirige les routes protégées. Chaque layout protégé revérifie via `requireUser()` (défense en profondeur).
- **`getUser()`** et non `getSession()` côté serveur : le JWT est validé auprès de Supabase.
- **Prisma 7** avec `@prisma/adapter-pg` ; client généré dans `src/generated/prisma` (ignoré par git). `DIRECT_URL` pour les migrations, `DATABASE_URL` (pooler) pour le runtime.
- **Tokens de design** dans `globals.css` (`@theme`) : navy `#172554`, brand `#2563EB`, accent `#F59E0B`, success `#16A34A`.
- **Server Components par défaut** ; `"use client"` uniquement pour formulaires, navigation active, Radix.
- **Mode aperçu** sans Supabase en dev uniquement (voir README).
