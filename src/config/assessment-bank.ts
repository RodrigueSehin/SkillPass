/**
 * Assessment content, versioned in code.
 *
 * Correct answers live ONLY here: they are never sent to the browser, and the database stores
 * the user's selections plus the bank version they were scored against.
 * The questions below are a starter bank and should be reviewed by domain experts before launch.
 * Bump BANK_VERSION whenever a question or its correct answer changes.
 */
export const BANK_VERSION = 1;

export const ASSESSMENT_DOMAINS = ["KNOWLEDGE", "PRACTICAL", "ARCHITECTURE"] as const;
export type AssessmentDomain = (typeof ASSESSMENT_DOMAINS)[number];

export const DOMAIN_LABELS: Record<AssessmentDomain, string> = {
  KNOWLEDGE: "Connaissances",
  PRACTICAL: "Cas pratiques",
  ARCHITECTURE: "Architecture",
};

export interface BankQuestion {
  id: string;
  domain: AssessmentDomain;
  prompt: string;
  options: readonly string[];
  correctIndex: number;
  explanation: string;
}

export interface BankAssessment {
  slug: string;
  title: string;
  /** Name of the skill this assessment verifies. Must match the user's skill name. */
  skillName: string;
  description: string;
  durationMinutes: number;
  /** Critical assessments need a human verifier before the credential is issued. */
  requiresReview: boolean;
  questions: readonly BankQuestion[];
}

export const ASSESSMENT_BANK: readonly BankAssessment[] = [
  {
    slug: "power-apps",
    title: "Power Apps — Niveau Avancé",
    skillName: "Power Apps",
    description: "Power Fx, galeries, formulaires, délégation, composants et déploiement.",
    durationMinutes: 15,
    requiresReview: false,
    questions: [
      {
        id: "pa-k1",
        domain: "KNOWLEDGE",
        prompt:
          "Quelle fonction Power Fx évalue une formule pour chaque enregistrement d'une table et renvoie une table de résultats ?",
        options: ["Filter", "ForAll", "LookUp", "Collect"],
        correctIndex: 1,
        explanation:
          "ForAll applique une formule à chaque enregistrement et renvoie une table des résultats.",
      },
      {
        id: "pa-k2",
        domain: "KNOWLEDGE",
        prompt: "Quelle propriété d'un contrôle Galerie définit les données qu'il affiche ?",
        options: ["OnSelect", "Default", "DataSource", "Items"],
        correctIndex: 3,
        explanation: "Items contient la table ou l'expression dont la galerie affiche les lignes.",
      },
      {
        id: "pa-k3",
        domain: "KNOWLEDGE",
        prompt: "Comment éviter les avertissements de délégation sur une grande table Dataverse ?",
        options: [
          "Charger toute la table dans une collection au démarrage",
          "Augmenter indéfiniment la limite de lignes de données",
          "Utiliser des fonctions et opérateurs délégables dans Filter et Search",
          "Masquer l'avertissement dans les paramètres",
        ],
        correctIndex: 2,
        explanation:
          "Une requête délégable est exécutée par la source de données, sans limite de 500 à 2 000 lignes.",
      },
      {
        id: "pa-p1",
        domain: "PRACTICAL",
        prompt:
          "Un bouton doit enregistrer le contenu d'un formulaire d'édition dans la source de données. Quelle formule placer dans OnSelect ?",
        options: ["Refresh(Form1)", "Save(Form1)", "SubmitForm(Form1)", "Patch(Form1)"],
        correctIndex: 2,
        explanation: "SubmitForm envoie les valeurs du formulaire à la source de données.",
      },
      {
        id: "pa-p2",
        domain: "PRACTICAL",
        prompt:
          "Vous devez ouvrir l'écran de détail en lui transmettant la ligne sélectionnée dans la galerie. Quelle formule convient ?",
        options: [
          "Navigate(EcranDetail, Gallery1.Selected)",
          "Launch(EcranDetail)",
          "Navigate(EcranDetail, ScreenTransition.None, { Item: Gallery1.Selected })",
          "Back(EcranDetail)",
        ],
        correctIndex: 2,
        explanation: "Le troisième argument de Navigate définit le contexte de l'écran cible.",
      },
      {
        id: "pa-p3",
        domain: "PRACTICAL",
        prompt: "Comment afficher un indicateur de chargement pendant une opération longue ?",
        options: [
          "Appeler Refresh() en boucle",
          "Une variable booléenne mise à true avant l'opération et à false après, liée à la propriété Visible d'un contrôle",
          "Ajouter un Timer sans lien avec l'opération",
          "Désactiver l'écran",
        ],
        correctIndex: 1,
        explanation: "Une variable d'état pilote l'affichage du spinner pendant l'exécution.",
      },
      {
        id: "pa-a1",
        domain: "ARCHITECTURE",
        prompt:
          "Une application sera utilisée par 500 personnes avec des droits d'accès différents selon le rôle. Quelle source de données privilégier ?",
        options: [
          "Un classeur Excel partagé sur OneDrive",
          "Une collection locale chargée au démarrage",
          "Un fichier CSV importé à chaque session",
          "Dataverse avec ses rôles de sécurité",
        ],
        correctIndex: 3,
        explanation: "Dataverse fournit une sécurité par rôle, par table et par ligne, adaptée à ce volume.",
      },
      {
        id: "pa-a2",
        domain: "ARCHITECTURE",
        prompt: "Quel est le principal bénéfice d'une bibliothèque de composants ?",
        options: [
          "Réutiliser une interface et sa logique entre applications avec une maintenance centralisée",
          "Supprimer le besoin de licences",
          "Faire fonctionner l'application hors ligne",
          "Contourner les limites de délégation",
        ],
        correctIndex: 0,
        explanation:
          "Les composants mutualisent interface et logique et se mettent à jour à un seul endroit.",
      },
      {
        id: "pa-a3",
        domain: "ARCHITECTURE",
        prompt:
          "Quelle pratique recommander pour promouvoir une application du développement vers la production ?",
        options: [
          "Copier-coller les écrans dans l'environnement de production",
          "Partager l'application de développement avec les utilisateurs finaux",
          "Exporter un .msapp et réimporter à la main avec des connexions en dur",
          "Une solution managée avec références de connexion et variables d'environnement",
        ],
        correctIndex: 3,
        explanation:
          "Les solutions rendent le déploiement reproductible et séparent la configuration de chaque environnement.",
      },
    ],
  },
  {
    slug: "power-automate",
    title: "Power Automate — Niveau Avancé",
    skillName: "Power Automate",
    description: "Déclencheurs, expressions, gestion d'erreurs, concurrence et solutions.",
    durationMinutes: 15,
    requiresReview: false,
    questions: [
      {
        id: "pf-k1",
        domain: "KNOWLEDGE",
        prompt: "Quel type de flux s'exécute automatiquement à l'arrivée d'un e-mail ?",
        options: [
          "Flux cloud automatisé",
          "Flux de bureau",
          "Flux instantané",
          "Flux de processus d'entreprise",
        ],
        correctIndex: 0,
        explanation: "Un flux automatisé démarre sur un événement, ici la réception d'un message.",
      },
      {
        id: "pf-k2",
        domain: "KNOWLEDGE",
        prompt: "Quelle action SharePoint lit plusieurs éléments d'une liste ?",
        options: [
          "Créer un élément",
          "Mettre à jour un élément",
          "Obtenir les éléments",
          "Supprimer un élément",
        ],
        correctIndex: 2,
        explanation:
          "« Obtenir les éléments » (Get items) renvoie les lignes d'une liste, avec filtre optionnel.",
      },
      {
        id: "pf-k3",
        domain: "KNOWLEDGE",
        prompt: "Comment réutiliser la sortie d'une action précédente ?",
        options: [
          "C'est impossible sans variable globale",
          "Uniquement en copiant la valeur à la main",
          "Seulement dans l'action qui suit immédiatement",
          "Via le contenu dynamique ou l'expression outputs('NomAction')",
        ],
        correctIndex: 3,
        explanation:
          "Le contenu dynamique et outputs() donnent accès aux résultats de toute action précédente.",
      },
      {
        id: "pf-p1",
        domain: "PRACTICAL",
        prompt: "Un appel HTTP échoue par intermittence. Que configurer pour le rejouer automatiquement ?",
        options: [
          "Ajouter dix actions HTTP identiques",
          "La stratégie de nouvelle tentative dans les paramètres de l'action",
          "Un délai fixe de 24 heures",
          "Dupliquer le flux",
        ],
        correctIndex: 1,
        explanation:
          "La stratégie de nouvelle tentative gère les erreurs transitoires avec un backoff configurable.",
      },
      {
        id: "pf-p2",
        domain: "PRACTICAL",
        prompt: "Comment exécuter une action de nettoyage même si l'action précédente a échoué ?",
        options: [
          "Placer l'action en premier dans le flux",
          "Désactiver la gestion d'erreurs",
          "Utiliser deux flux distincts",
          "Configurer « Exécuter après » sur échec ou expiration, idéalement dans une étendue (Scope)",
        ],
        correctIndex: 3,
        explanation: "« Exécuter après » permet un schéma try/catch/finally avec des étendues.",
      },
      {
        id: "pf-p3",
        domain: "PRACTICAL",
        prompt: "Vous devez appliquer un traitement à chaque élément d'un tableau. Quelle action utiliser ?",
        options: ["Condition", "Appliquer à chacun", "Terminer", "Initialiser la variable"],
        correctIndex: 1,
        explanation: "« Appliquer à chacun » (Apply to each) itère sur les éléments d'un tableau.",
      },
      {
        id: "pf-a1",
        domain: "ARCHITECTURE",
        prompt:
          "Des centaines d'éléments arrivent en même temps et créent des doublons. Quelle approche adopter ?",
        options: [
          "Augmenter le parallélisme à 50",
          "Ajouter une pause d'une seconde",
          "Limiter la concurrence du déclencheur et utiliser une clé de déduplication",
          "Dupliquer le flux pour répartir la charge",
        ],
        correctIndex: 2,
        explanation: "Réduire la concurrence et vérifier une clé unique rend le traitement idempotent.",
      },
      {
        id: "pf-a2",
        domain: "ARCHITECTURE",
        prompt: "Où stocker une clé d'API utilisée par un flux ?",
        options: [
          "En clair dans une action HTTP",
          "Dans le nom du flux",
          "Dans un commentaire",
          "Dans Azure Key Vault ou une variable d'environnement de type secret",
        ],
        correctIndex: 3,
        explanation: "Les secrets doivent être gérés hors du flux, avec contrôle d'accès et rotation.",
      },
      {
        id: "pf-a3",
        domain: "ARCHITECTURE",
        prompt: "Un flux d'équipe doit survivre au départ de son créateur. Que faire ?",
        options: [
          "Le laisser dans « Mes flux » avec un compte personnel",
          "Le créer dans une solution avec références de connexion et un compte de service",
          "Demander au créateur de ne jamais partir",
          "Exporter le flux chaque semaine en ZIP",
        ],
        correctIndex: 1,
        explanation:
          "Une solution avec un compte de service rend la propriété et le déploiement indépendants d'une personne.",
      },
    ],
  },
  {
    slug: "dataverse",
    title: "Dataverse — Niveau Avancé",
    skillName: "Dataverse",
    description: "Modélisation, sécurité, règles métier, qualité des données et ALM.",
    durationMinutes: 15,
    requiresReview: true,
    questions: [
      {
        id: "dv-k1",
        domain: "KNOWLEDGE",
        prompt: "Quel type de colonne relie une ligne d'une table à une ligne d'une autre table ?",
        options: ["Texte", "Choix", "Recherche (Lookup)", "Nombre décimal"],
        correctIndex: 2,
        explanation: "Une colonne de recherche matérialise la relation plusieurs-à-un.",
      },
      {
        id: "dv-k2",
        domain: "KNOWLEDGE",
        prompt: "Quelle table standard représente une organisation cliente ?",
        options: ["Compte (Account)", "Contact", "Équipe", "Utilisateur"],
        correctIndex: 0,
        explanation: "La table Compte représente les organisations ; Contact représente les personnes.",
      },
      {
        id: "dv-k3",
        domain: "KNOWLEDGE",
        prompt: "À quoi sert une colonne calculée ?",
        options: [
          "À planifier l'exécution d'un flux",
          "À chiffrer les données",
          "À importer des fichiers",
          "À obtenir une valeur dérivée d'autres colonnes, sans la saisir",
        ],
        correctIndex: 3,
        explanation:
          "La valeur est calculée à partir d'autres colonnes (de la ligne ou de sa ligne parente).",
      },
      {
        id: "dv-p1",
        domain: "PRACTICAL",
        prompt: "Les commerciaux ne doivent voir que leurs propres enregistrements. Que configurer ?",
        options: [
          "Masquer la colonne dans le formulaire",
          "Un rôle de sécurité avec un accès en lecture limité au niveau Utilisateur",
          "Désactiver la table",
          "Partager le classeur Excel",
        ],
        correctIndex: 1,
        explanation:
          "L'étendue d'accès « Utilisateur » limite la lecture aux lignes dont l'utilisateur est propriétaire.",
      },
      {
        id: "dv-p2",
        domain: "PRACTICAL",
        prompt:
          "Un champ doit devenir obligatoire selon la valeur d'un autre champ, sans code. Quelle solution ?",
        options: [
          "Un plug-in C# obligatoire",
          "Une colonne calculée",
          "Une règle métier (business rule)",
          "Un flux planifié",
        ],
        correctIndex: 2,
        explanation:
          "Les règles métier appliquent obligation, visibilité ou valeurs par défaut de façon déclarative.",
      },
      {
        id: "dv-p3",
        domain: "PRACTICAL",
        prompt: "Vous devez importer 50 000 lignes depuis Excel dans une table. Que faire ?",
        options: [
          "Les saisir une à une",
          "Les copier dans un champ texte",
          "Utiliser l'import de données ou un flux de données (dataflow)",
          "Créer 50 000 flux",
        ],
        correctIndex: 2,
        explanation: "L'import et les dataflows traitent de gros volumes avec correspondance des colonnes.",
      },
      {
        id: "dv-a1",
        domain: "ARCHITECTURE",
        prompt:
          "Un étudiant suit plusieurs cours et un cours compte plusieurs étudiants. Quelle relation modéliser ?",
        options: ["Un-à-plusieurs", "Plusieurs-à-plusieurs (N:N)", "Un-à-un", "Une colonne texte"],
        correctIndex: 1,
        explanation: "Une relation N:N (ou une table d'association) représente ce lien bidirectionnel.",
      },
      {
        id: "dv-a2",
        domain: "ARCHITECTURE",
        prompt: "Comment limiter les doublons de clients lors des saisies et des imports ?",
        options: [
          "Faire confiance aux utilisateurs",
          "Trier la vue par nom",
          "Supprimer la table chaque semaine",
          "Des règles de détection des doublons et des clés alternatives",
        ],
        correctIndex: 3,
        explanation:
          "Les clés alternatives garantissent l'unicité ; la détection des doublons alerte à la saisie.",
      },
      {
        id: "dv-a3",
        domain: "ARCHITECTURE",
        prompt: "Où stocker des PDF de 50 Mo rattachés à un enregistrement ?",
        options: [
          "Dans une colonne Fichier (stockage de fichiers Dataverse)",
          "En base64 dans une colonne texte",
          "Dans le nom de l'enregistrement",
          "Dans plusieurs colonnes numériques",
        ],
        correctIndex: 0,
        explanation:
          "Les colonnes Fichier sont prévues pour les gros binaires, contrairement au texte encodé.",
      },
    ],
  },
];

export const findAssessment = (slug: string) => ASSESSMENT_BANK.find((a) => a.slug === slug);
