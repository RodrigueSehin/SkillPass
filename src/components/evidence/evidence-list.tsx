import Link from "next/link";
import { FileText, Link2 } from "lucide-react";
import type { EvidenceDTO } from "@/types/evidence";
import { StatusBadge, TypeBadge } from "./evidence-bits";

/** Compact list used where evidence appears inside another page (a skill's detail). */
export function EvidenceList({ items }: { items: EvidenceDTO[] }) {
  return (
    <ul className="grid gap-3 lg:grid-cols-2">
      {items.map((e) => (
        <li key={e.id}>
          <Link
            href={`/dashboard/evidence?sel=${e.id}`}
            className="border-border/60 shadow-soft hover:shadow-lift block h-full rounded-2xl border bg-white p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <TypeBadge type={e.type} />
              <StatusBadge evidence={e} />
            </div>
            <h3 className="text-navy mt-3 font-bold">{e.title}</h3>
            {e.description && <p className="text-muted mt-1 line-clamp-2 text-sm">{e.description}</p>}
            <div className="text-muted mt-3 flex items-center gap-3 text-xs">
              {e.files.length > 0 && (
                <span className="inline-flex items-center gap-1">
                  <FileText className="size-3.5" aria-hidden /> {e.files.length}
                </span>
              )}
              {e.url && (
                <span className="inline-flex items-center gap-1">
                  <Link2 className="size-3.5" aria-hidden /> Lien
                </span>
              )}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
