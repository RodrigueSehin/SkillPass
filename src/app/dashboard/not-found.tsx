import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function DashboardNotFound() {
  return (
    <EmptyState
      icon={SearchX}
      title="Élément introuvable"
      description="Cette page n'existe pas ou ne vous appartient pas."
      action={
        <Button asChild>
          <Link href="/dashboard">Retour au dashboard</Link>
        </Button>
      }
    />
  );
}
