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

export interface CompletionMessage {
  title: string;
  hint: string;
  href: string;
}

/** Encouragement shown next to the completion bar, adapted to how far along the profile is. */
export function completionMessage({
  percent,
  next,
}: Pick<Completion, "percent" | "next">): CompletionMessage {
  if (!next || percent >= 100) {
    return {
      title: "Votre profil est complet 🎉",
      hint: "Gardez-le à jour pour rester visible auprès des recruteurs.",
      href: "/dashboard/settings",
    };
  }
  if (percent >= 70) {
    return {
      title: "Super ! Votre profil est presque complet.",
      hint: `${next.label} pour augmenter votre visibilité.`,
      href: next.href,
    };
  }
  return {
    title: "Continuez : votre profil prend forme.",
    hint: `${next.label} pour être mieux repéré.`,
    href: next.href,
  };
}
