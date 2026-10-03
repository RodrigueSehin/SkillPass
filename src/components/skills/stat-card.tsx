import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
}

export function StatCard({ label, value, icon: Icon }: StatCardProps) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <div className="text-brand flex size-12 shrink-0 items-center justify-center rounded-xl bg-blue-50">
        <Icon className="size-6" aria-hidden />
      </div>
      <div>
        <p className="text-2xl leading-none font-bold tracking-tight">{value}</p>
        <p className="text-muted mt-1 text-sm">{label}</p>
      </div>
    </Card>
  );
}
