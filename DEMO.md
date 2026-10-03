# Démo sur la vraie base

Prérequis : `supabase/setup.sql` exécuté (12 tables) et `.env` / `.env.local` complété :

| Variable                                                                                 | Valeur attendue                                                                                                                                                                                                                    |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API                                                                                                                                                                                                             |
| `DATABASE_URL`                                                                           | Connect → **Transaction pooler** (port 6543), utilisateur `postgres.<ref>`                                                                                                                                                         |
| `DIRECT_URL`                                                                             | Connect → **Session pooler** (port 5432 sur l'hôte `…pooler.supabase.com`, utilisateur `postgres.<ref>`). La connexion directe `db.<ref>.supabase.co` est en IPv6 uniquement : elle échoue sur la plupart des réseaux domestiques. |

Le mot de passe doit être le même dans les deux URLs ; s'il contient `@ : / ? # %`, il faut l'encoder (`@` → `%40`, etc.) ou le réinitialiser avec des lettres et chiffres (Project Settings → Database).

## Créer les comptes et les données

```bash
npm run demo:seed            # affiche la cible, ne modifie rien
npm run demo:seed -- --yes   # crée les comptes et reconstruit les données de démo
```

Le script crée (ou retrouve) deux comptes Supabase Auth déjà confirmés, affiche leurs mots de passe une seule fois (ou utilise `DEMO_PASSWORD`), puis remplit le profil de démonstration. Il peut être relancé : il remet les données du talent de démo dans le même état. Il ne lit ni n'écrit rien qui appartienne à d'autres utilisateurs.

| Compte                                        | Rôle     | Sert à montrer          |
| --------------------------------------------- | -------- | ----------------------- |
| `demo@skillpass-demo.com` (Sehin G. Rodrigue) | TALENT   | tout le parcours talent |
| `verificateur@skillpass-demo.com` (Awa Koné)  | VERIFIER | la validation humaine   |

## Ce que contient la démo

7 compétences, 4 projets, 2 expériences, 3 certifications, 7 preuves, 2 badges vérifiables (Power Apps, Power Automate), 1 évaluation Dataverse en attente de validation, 3 recommandations publiées, 1 en attente de modération, 1 lien de recommandation ouvert.

## Scénario de démonstration (≈ 8 min)

1. **Landing** → « Créer mon SkillPass » (inscription en 3 étapes).
2. **Connexion** en tant que Sehin → **Dashboard** : indicateurs, complétion, score.
3. **Mon SkillPass** : score expliqué critère par critère, badges, onglets ; **Partager**.
4. **Compétences → Power Apps** : « Pourquoi cette compétence est-elle vérifiée ? », preuves, ajout d'un fichier.
5. **Évaluations** : passer Power Automate (ou Power Apps) → badge → **/verify/SP-…** dans un onglet privé (sans connexion).
6. **Recommandations** : publier celle en attente ; ouvrir le lien ouvert dans un onglet privé et écrire un témoignage.
7. **Profil public** `/sehin-rodrigue` : SEO, badges, recommandations, QR code.
8. **Se déconnecter, se connecter en vérificatrice** → `/admin/verifications` : valider l'évaluation Dataverse → le badge apparaît chez Sehin.
