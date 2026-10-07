import type {
  EvaluationInput,
  EvaluationQuestion,
  QuestionDifficulty,
  QuestionType,
} from "@/types/evaluation";
import { DEFAULT_SETTINGS, TRUE_FALSE_OPTIONS } from "@/types/evaluation";
import type { SkillLevel } from "@/types/skill";

type Q = Omit<EvaluationQuestion, "id">;

const choice = (
  prompt: string,
  options: string[],
  correct: number[],
  difficulty: QuestionDifficulty,
  points = 2,
): Q => ({
  type: correct.length > 1 ? "MULTIPLE" : "SINGLE",
  prompt,
  options,
  correct,
  difficulty,
  points,
});
const trueFalse = (prompt: string, isTrue: boolean, difficulty: QuestionDifficulty = "EASY"): Q => ({
  type: "TRUE_FALSE",
  prompt,
  options: [...TRUE_FALSE_OPTIONS],
  correct: [isTrue ? 0 : 1],
  difficulty,
  points: 1,
});
const open = (type: QuestionType, prompt: string, difficulty: QuestionDifficulty, points = 4): Q => ({
  type,
  prompt,
  options: [],
  correct: [],
  difficulty,
  points,
});

export interface EvaluationTemplate {
  id: string;
  title: string;
  description: string;
  skill: string;
  type: EvaluationInput["type"];
  difficulty: SkillLevel;
  durationMinutes: number;
  questions: Q[];
}

/** Ready-made tests of the library. Choice questions are marked automatically; the others are read by a person. */
export const EVALUATION_TEMPLATES: EvaluationTemplate[] = [
  {
    id: "power-apps-beginner",
    title: "Power Apps - Niveau débutant",
    description:
      "Cette évaluation mesure les bases de Power Apps : types d'applications, sources de données et formules.",
    skill: "Power Apps",
    type: "TECHNICAL",
    difficulty: "BEGINNER",
    durationMinutes: 30,
    questions: [
      choice(
        "Quel est le rôle principal de Power Apps ?",
        [
          "Créer des applications métiers avec peu ou pas de code",
          "Administrer des serveurs de bases de données",
          "Concevoir des réseaux d'entreprise",
          "Éditer des vidéos",
        ],
        [0],
        "EASY",
      ),
      choice(
        "Quel type d'application Power Apps génère son interface à partir du modèle de données ?",
        [
          "Application canevas",
          "Application pilotée par modèle",
          "Application de bureau",
          "Application mobile native",
        ],
        [1],
        "MEDIUM",
      ),
      trueFalse("Power Fx est le langage de formules utilisé dans les applications canevas.", true),
      choice(
        "Parmi ces sources, lesquelles peuvent être connectées à une application canevas ?",
        ["SharePoint", "Dataverse", "Excel (fichier stocké dans le cloud)", "Un fichier .exe local"],
        [0, 1, 2],
        "MEDIUM",
        3,
      ),
    ],
  },
  {
    id: "power-automate-intermediate",
    title: "Power Automate - Niveau intermédiaire",
    description: "Cette évaluation mesure la conception de flux : déclencheurs, conditions et boucles.",
    skill: "Power Automate",
    type: "TECHNICAL",
    difficulty: "INTERMEDIATE",
    durationMinutes: 45,
    questions: [
      choice(
        "Quel type de flux se déclenche à partir d'un événement, par exemple l'arrivée d'un e-mail ?",
        [
          "Flux de cloud automatisé",
          "Flux de cloud instantané",
          "Flux de cloud planifié",
          "Processus métier",
        ],
        [0],
        "EASY",
      ),
      trueFalse(
        "Une condition permet d'exécuter des actions différentes selon qu'elle est vraie ou fausse.",
        true,
      ),
      choice(
        "Quelle action répète des étapes pour chaque élément d'une liste ?",
        ["Appliquer à chacun", "Condition", "Terminer", "Délai"],
        [0],
        "MEDIUM",
      ),
      choice(
        "Quels déclencheurs sont disponibles dans Power Automate ?",
        ["Planifié (récurrence)", "Instantané (manuel)", "Automatisé (événement)", "Compilé (build)"],
        [0, 1, 2],
        "MEDIUM",
        3,
      ),
    ],
  },
  {
    id: "dataverse-advanced",
    title: "Dataverse - Niveau avancé",
    description:
      "Cette évaluation mesure la modélisation des données, la sécurité et le déploiement avec Dataverse.",
    skill: "Dataverse",
    type: "TECHNICAL",
    difficulty: "ADVANCED",
    durationMinutes: 60,
    questions: [
      choice(
        "Quel type de colonne relie une ligne d'une table à une ligne d'une autre table ?",
        ["Recherche (Lookup)", "Texte sur une seule ligne", "Choix", "Nombre entier"],
        [0],
        "MEDIUM",
      ),
      choice(
        "Quel mécanisme contrôle l'accès aux enregistrements selon le rôle de l'utilisateur ?",
        ["Rôles de sécurité", "Thèmes", "Solutions gérées", "Connecteurs"],
        [0],
        "MEDIUM",
      ),
      trueFalse(
        "Une solution permet de regrouper et de transporter des composants entre environnements.",
        true,
        "MEDIUM",
      ),
      choice(
        "Quelles relations peut-on définir entre deux tables ?",
        ["Un-à-plusieurs", "Plusieurs-à-un", "Plusieurs-à-plusieurs", "Un-à-zéro"],
        [0, 1, 2],
        "HARD",
        4,
      ),
    ],
  },
  {
    id: "pl-200-preparation",
    title: "PL-200 - Préparation certification",
    description:
      "Simulation d'examen : notions de base de la Power Platform attendues pour la certification PL-200.",
    skill: "Power Platform",
    type: "CERTIFICATION",
    difficulty: "INTERMEDIATE",
    durationMinutes: 90,
    questions: [
      choice(
        "Quel outil permet d'analyser interactivement des données avec des visuels ?",
        ["Power BI", "Power Pages", "Power Automate Desktop", "AI Builder"],
        [0],
        "EASY",
      ),
      choice(
        "Quel composant regroupe applications et flux pour les déployer ensemble ?",
        ["Solution", "Environnement", "Connecteur", "Table virtuelle"],
        [0],
        "MEDIUM",
      ),
      trueFalse(
        "Un environnement est un espace qui stocke, gère et partage les données et applications d'une organisation.",
        true,
      ),
      choice(
        "Quel service permet de créer des agents conversationnels sans code ?",
        ["Copilot Studio", "Power BI Desktop", "SharePoint", "Excel"],
        [0],
        "MEDIUM",
      ),
    ],
  },
  {
    id: "it-project-management",
    title: "Gestion de projet IT",
    description: "Méthodologies et outils de gestion de projet : Scrum, planification, gestion des risques.",
    skill: "Gestion de projet",
    type: "TRANSVERSAL",
    difficulty: "INTERMEDIATE",
    durationMinutes: 45,
    questions: [
      choice(
        "Dans Scrum, qui priorise le backlog du produit ?",
        ["Le Product Owner", "Le Scrum Master", "L'équipe de développement", "Le sponsor"],
        [0],
        "EASY",
      ),
      trueFalse("Un diagramme de Gantt représente le planning des tâches dans le temps.", true),
      open("SHORT", "Citez deux risques fréquents d'un projet IT et une action pour chacun.", "MEDIUM"),
      open(
        "SCENARIO",
        "Un livrable clé a une semaine de retard. Décrivez comment vous informez les parties prenantes et replanifiez.",
        "HARD",
        6,
      ),
    ],
  },
  {
    id: "professional-communication",
    title: "Communication professionnelle",
    description: "Évaluation comportementale : écoute, clarté du message et gestion des désaccords.",
    skill: "Communication",
    type: "TRANSVERSAL",
    difficulty: "INTERMEDIATE",
    durationMinutes: 30,
    questions: [
      choice(
        "Quelle attitude favorise l'écoute active ?",
        [
          "Reformuler ce que l'interlocuteur vient de dire",
          "Couper la parole pour gagner du temps",
          "Regarder son téléphone",
          "Préparer sa réponse sans écouter",
        ],
        [0],
        "EASY",
      ),
      trueFalse("Un e-mail professionnel doit avoir un objet clair.", true),
      open(
        "SCENARIO",
        "Un collègue critique publiquement votre travail en réunion. Comment réagissez-vous ?",
        "MEDIUM",
        5,
      ),
      open("LONG", "Expliquez comment vous adaptez votre message à un public non technique.", "MEDIUM", 5),
    ],
  },
];

export function templateInput(t: EvaluationTemplate, makeId: () => string): EvaluationInput {
  return {
    title: t.title,
    description: t.description,
    skill: t.skill,
    type: t.type,
    difficulty: t.difficulty,
    durationMinutes: t.durationMinutes,
    language: "Français",
    questions: t.questions.map((q) => ({
      ...q,
      id: makeId(),
      options: [...q.options],
      correct: [...q.correct],
    })),
    settings: { ...DEFAULT_SETTINGS, devices: { ...DEFAULT_SETTINGS.devices } },
    publishAt: null,
  };
}
