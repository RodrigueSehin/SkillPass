# Images de la page d'accueil

Déposez vos photos ici : elles remplacent automatiquement les illustrations, sans modifier le code
(rechargez la page ; en production, reconstruisez).

| Fichier | Où | Format conseillé |
| --- | --- | --- |
| `hero-talent.webp` / `.png` / `.jpg` | Portrait à droite du titre | Détourée (fond transparent), environ 900 × 1100 px |
| `slides/slide-1.webp` / `.jpg` / `.png` | Carrousel, « Pour les talents » | Paysage, environ 1200 × 900 px |
| `slides/slide-2.webp` / `.jpg` / `.png` | Carrousel, « Pour les entreprises » | idem |
| `slides/slide-3.webp` / `.jpg` / `.png` | Carrousel, « Pour les académies » | idem |

Ordre de priorité des extensions : `webp`, puis `jpg`, puis `png`. Une diapositive sans fichier garde son illustration.
Pensez à compresser les images (idéalement moins de 300 Ko chacune).

## Page de connexion

Les visuels de la page de connexion ne sont pas dans `public/` : ils sont importés dans le code depuis
`src/assets/auth/` (Next.js les optimise automatiquement).

| Fichier | Usage |
| --- | --- |
| `login-office.png` | Photo du panneau de gauche (en bas à droite, fondue dans le bleu) |
| `logo-on-dark.png` | Logo à texte blanc, pour fond bleu foncé (panneau de gauche) |
| `logo-on-light.png` | Logo à texte bleu, pour fond blanc (pied de page) |

Pour les remplacer, gardez les mêmes noms de fichiers.
