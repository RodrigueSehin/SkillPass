export interface CompletionInput {
  profile: {
    headline: string | null;
    bio: string | null;
    location: string | null;
    profession: string | null;
  };
  counts: {
    skills: number;
    verifiedSkills: number;
    projects: number;
    experiences: number;
    certifications: number;
    evidence: number;
  };
}

export interface CompletionItem {
  key: string;
  label: string;
  done: boolean;
  /** Dashboard path where the user can complete this item. */
  href: string;
}

export interface Completion {
  percent: number;
  items: CompletionItem[];
  next: CompletionItem | undefined;
}

/** Profile completion: ten equally weighted steps, so the percentage is easy to reason about. */
export function computeCompletion({ profile, counts }: CompletionInput): Completion {
  const items: CompletionItem[] = [
    {
      key: "headline",
      label: "Ajoutez un titre professionnel",
      done: Boolean(profile.headline),
      href: "/dashboard/settings",
    },
    {
      key: "profession",
      label: "Renseignez votre profession",
      done: Boolean(profile.profession),
      href: "/dashboard/settings",
    },
    {
      key: "location",
      label: "Indiquez votre localisation",
      done: Boolean(profile.location),
      href: "/dashboard/settings",
    },
    {
      key: "bio",
      label: "Rédigez une présentation",
      done: Boolean(profile.bio),
      href: "/dashboard/settings",
    },
    {
      key: "skills",
      label: "Ajoutez au moins 3 compétences",
      done: counts.skills >= 3,
      href: "/dashboard/skills",
    },
    { key: "projects", label: "Ajoutez un projet", done: counts.projects >= 1, href: "/dashboard/projects" },
    {
      key: "experiences",
      label: "Ajoutez une expérience",
      done: counts.experiences >= 1,
      href: "/dashboard/experiences",
    },
    {
      key: "certifications",
      label: "Ajoutez une certification",
      done: counts.certifications >= 1,
      href: "/dashboard/certifications",
    },
    {
      key: "evidence",
      label: "Ajoutez une preuve à une compétence",
      done: counts.evidence >= 1,
      href: "/dashboard/evidence",
    },
    {
      key: "verified",
      label: "Faites vérifier une compétence",
      done: counts.verifiedSkills >= 1,
      href: "/dashboard/skills",
    },
  ];
  const done = items.filter((i) => i.done).length;
  return { percent: Math.round((done / items.length) * 100), items, next: items.find((i) => !i.done) };
}
