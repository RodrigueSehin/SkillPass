import Link from "next/link";
import { UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function ProfileNotFound() {
  return (
    <main className="mx-auto max-w-lg px-4 py-24">
      <EmptyState
        icon={UserX}
        title="Profil introuvable"
        description="Ce SkillPass n'existe pas ou n'est pas public."
        action={
          <Button asChild>
            <Link href="/">Retour à l&apos;accueil</Link>
          </Button>
        }
      />
    </main>
  );
}
