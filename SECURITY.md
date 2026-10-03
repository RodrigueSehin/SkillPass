# Sécurité

## En place (Phase 1)

- Routes `/dashboard`, `/business`, `/admin` protégées dans `proxy.ts` **et** dans les layouts (`requireUser`).
- Configuration Supabase absente en production → 503 sur routes protégées (jamais « fail open »).
- Validation Zod de toutes les entrées des Server Actions.
- Redirections post-login limitées aux chemins relatifs same-origin (anti open-redirect).
- Réinitialisation de mot de passe : réponse identique que le compte existe ou non (anti-énumération).
- Message d'échec de connexion générique ; erreurs techniques jamais exposées à l'utilisateur.
- `SUPABASE_SERVICE_ROLE_KEY` n'est jamais préfixée `NEXT_PUBLIC_`.

## Uploads de preuves (Phase 2)

- Liste blanche : PDF, PNG, JPEG, WebP, 5 Mo maximum. Le type déclaré est confronté aux **premiers octets** du fichier (un exécutable renommé en .pdf est refusé).
- Clé de stockage générée côté serveur (`<profileId>/<uuid>.<ext>`) : le nom du fichier utilisateur n'entre jamais dans le chemin. Le nom affiché est nettoyé.
- Bucket privé. Les fichiers ne sont servis que par `GET /api/evidence/:id/file`, après contrôle de propriété, avec `nosniff`, `CSP: sandbox` et `no-store` (URL signée de 60 s avec Supabase).
- Limite de 20 envois/minute/utilisateur. **Limiteur en mémoire, par instance** : à remplacer par un store partagé (Redis) avant de déployer plusieurs instances.
- Une preuve ne peut s'attacher qu'à une compétence ou un projet appartenant à l'utilisateur ; les types générés par la plateforme (ASSESSMENT, RECOMMENDATION) ne sont pas créables à la main.
- Le statut de vérification (compétences, certifications, preuves) n'est modifiable par aucun endpoint utilisateur.

## Politiques RLS

Le fichier `supabase/policies.sql` contient les politiques ci-dessous pour toutes les tables de la Phase 2. Rappel :

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
