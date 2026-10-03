# API REST

Toutes les routes exigent une session Supabase (cookie) et répondent en JSON. Les données sont toujours limitées à l'utilisateur connecté.

Erreur : `{ "error": { "code": "VALIDATION | NOT_FOUND | CONFLICT | UNAUTHORIZED | INVALID_UPLOAD | RATE_LIMITED | INTERNAL", "message": "…" } }`
(400, 404, 409, 401, 400, 429, 500). Jamais de détail technique.

| Méthode              | Route                                                        | Rôle                                                                                                    |
| -------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| GET / PATCH          | `/api/profile`                                               | Profil de l'utilisateur / mise à jour (nom d'utilisateur unique, visibilité)                            |
| GET                  | `/api/skills?q=`                                             | Autocomplétion du catalogue de compétences                                                              |
| GET / POST           | `/api/talent-skills`                                         | Mes compétences (`q`, `level`, `status`, `category`, `sort`) / ajout                                    |
| GET / PATCH / DELETE | `/api/talent-skills/:id`                                     | Détail / niveau et années / suppression                                                                 |
| GET / POST           | `/api/projects` · `/api/experiences` · `/api/certifications` | Liste / création                                                                                        |
| GET / PATCH / DELETE | `/api/{projects,experiences,certifications}/:id`             | Détail / remplacement / suppression                                                                     |
| GET                  | `/api/evidence?skillId=`                                     | Preuves (filtrables par compétence)                                                                     |
| POST                 | `/api/evidence`                                              | `multipart/form-data` : `talentSkillId`, `type`, `title`, `description?`, `url?`, `projectId?`, `file?` |
| DELETE               | `/api/evidence/:id`                                          | Supprime la preuve et son fichier                                                                       |
| GET                  | `/api/evidence/:id/file`                                     | Télécharge le fichier (propriétaire uniquement)                                                         |

Règles notables : le score et le statut de vérification ne sont jamais acceptés en entrée ; `PATCH /api/talent-skills/:id` refuse de changer le niveau d'une compétence vérifiée (409) ; une certification créée est toujours `UNVERIFIED`.

### Phase 3 — Vérification

| Méthode        | Route                                         | Rôle                                                                                                |
| -------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| GET            | `/api/assessments`                            | Évaluations disponibles, dernière tentative, blocage éventuel                                       |
| POST           | `/api/assessments/:slug/start`                | Démarre (ou reprend) une tentative. `:slug` = identifiant de l'évaluation, ex. `power-apps`         |
| POST           | `/api/assessments/attempts/:attemptId/submit` | Soumet `{ answers: [{ questionId, selected }] }`. Correction côté serveur                           |
| GET            | `/api/credentials`                            | Mes credentials (badges)                                                                            |
| GET            | `/api/verify/:credentialId`                   | **Public.** Vérifie un credential `SP-XXXXXX`                                                       |
| GET / POST     | `/api/recommendations`                        | Mes demandes / création d'un lien de recommandation                                                 |
| PATCH / DELETE | `/api/recommendations/:id`                    | Publier ou refuser (`{ decision: "APPROVED" \| "DECLINED" }`) / supprimer                           |
| GET / POST     | `/api/recommend/:token`                       | **Public** (le jeton est le secret) : contexte de la demande / envoi de la recommandation           |
| GET            | `/api/verification/pending`                   | Évaluations à valider — rôles vérificateurs uniquement (403 sinon)                                  |
| POST           | `/api/verification/:attemptId/review`         | `{ decision: "approve" \| "reject", note? }` — rôles vérificateurs, jamais sur sa propre évaluation |

Les questions sont servies **sans** bonnes réponses ni explications. Codes supplémentaires : 403 `FORBIDDEN`.

À venir : `/api/assessments/*`, `/api/opportunities`, `/api/matches`, `/api/ai/*`.
