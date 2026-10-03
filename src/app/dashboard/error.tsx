"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  return (
    <EmptyState
      icon={AlertTriangle}
      title="Une erreur est survenue"
      description="Nous n'avons pas pu charger cette page. Vos données ne sont pas affectées."
      action={<Button onClick={reset}>Réessayer</Button>}
    />
  );
}
