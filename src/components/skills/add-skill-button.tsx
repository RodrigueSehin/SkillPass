import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

/** Leads to the full "Ajouter une compétence" page. */
export function AddSkillButton() {
  return (
    <Link href="/dashboard/skills/new" className={buttonVariants()}>
      <Plus /> Ajouter une compétence
    </Link>
  );
}
