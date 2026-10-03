# Sécurité

## En place (Phase 1)

- Routes `/dashboard`, `/business`, `/admin` protégées dans `proxy.ts` **et** dans les layouts (`requireUser`).
- Configuration Supabase absente en production → 503 sur routes protégées (jamais « fail open »).
- Validation Zod de toutes les entrées des Server Actions.
- Redirections post-login limitées aux chemins relatifs same-origin (anti open-redirect).
- Réinitialisation de mot de passe : réponse identique que le compte existe ou non (anti-énumération).
- Message d'échec de connexion générique ; erreurs techniques jamais exposées à l'utilisateur.
- `SUPABASE_SERVICE_ROLE_KEY` n'est jamais préfixée `NEXT_PUBLIC_`.

## À faire avant la Phase 2

Prisma se connecte avec un rôle direct et contourne RLS : **toute requête doit filtrer par l'utilisateur authentifié dans les services**. RLS protège l'accès via l'API Supabase (clé anon). Politiques à appliquer :

```sql
alter table profiles enable row level security;
create policy "own profile" on profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "public profiles readable" on profiles for select using (is_public);

alter table talent_skills enable row level security;
create policy "own skills" on talent_skills for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);
-- idem projects, experiences, certifications (colonne profile_id)
```

Prévus ensuite : rate limiting, uploads signés, audit logs, RBAC par rôle (`UserRole`), isolation multi-tenant.
