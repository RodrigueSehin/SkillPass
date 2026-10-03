# Base de données (Phase 1)

PostgreSQL via Supabase, schéma dans [prisma/schema.prisma](prisma/schema.prisma). Tables en `snake_case`, modèles en `PascalCase`.

```
profiles 1─N talent_skills N─1 skills N─1 skill_categories
profiles 1─N projects N─N skills (project_skills)
profiles 1─N experiences
profiles 1─N certifications
```

- `profiles.id` = `auth.users.id` (uuid Supabase) → permet `auth.uid() = id` dans les politiques RLS.
- `talent_skills` : unique `(profile_id, skill_id)`, niveau, score 0–100, statut de vérification.
- Suppression d'un profil : cascade sur ses données ; un `skill` référencé ne peut pas être supprimé (`Restrict`).
- `skill_evidence` : preuves rattachées à un `talent_skill` (cascade) et optionnellement à un projet. `file_path` est la clé de stockage générée par le serveur ; le nom d'origine n'est conservé que pour l'affichage.
- Index sur toutes les clés étrangères de lecture fréquente.

Tables prévues pour les phases suivantes : evidence, assessments, credentials, badges, recommendations, companies, jobs, matches, notifications, subscriptions, audit_logs.

## Migrations

Le SQL initial est dans `prisma/migrations/0001_init/migration.sql` (généré avec `prisma migrate diff`, **pas encore exécuté**). Sur une base vierge : `npx prisma migrate deploy`, puis exécuter `supabase/policies.sql` (RLS et bucket privé `evidence`).

```bash
npm run db:migrate   # prisma migrate dev
npm run db:seed      # profil démo Sehin G. Rodrigue, 7 compétences, 4 projets, 3 certifications
```
