import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/** "Affichage de 1 à 8 sur 12 membres" with numbered page links. Server component: pages are plain links. */
export function Pagination({
  page,
  pages,
  total,
  size,
  noun,
  hrefFor,
}: {
  page: number;
  pages: number;
  total: number;
  size: number;
  /** Plural noun of the listed items, e.g. "membres". */
  noun: string;
  hrefFor: (page: number) => string;
}) {
  const from = total === 0 ? 0 : (page - 1) * size + 1;
  const to = Math.min(total, page * size);
  const numbers = Array.from({ length: pages }, (_, i) => i + 1).filter(
    (n) => pages <= 7 || n === 1 || n === pages || Math.abs(n - page) <= 1,
  );
  const box = "flex size-9 items-center justify-center rounded-lg border text-sm font-semibold";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
      <p className="text-muted text-sm">
        Affichage de {from} à {to} sur {total} {noun}
      </p>
      {pages > 1 && (
        <nav aria-label="Pagination" className="flex items-center gap-1.5">
          <Link
            href={hrefFor(page - 1)}
            aria-label="Page précédente"
            aria-disabled={page === 1}
            className={cn(
              box,
              "border-border text-navy bg-white",
              page === 1 && "pointer-events-none opacity-40",
            )}
          >
            <ChevronLeft className="size-4" aria-hidden />
          </Link>
          {numbers.map((n, i) => (
            <span key={n} className="flex items-center gap-1.5">
              {i > 0 && n - numbers[i - 1] > 1 && <span className="text-muted">…</span>}
              <Link
                href={hrefFor(n)}
                aria-current={n === page ? "page" : undefined}
                className={cn(
                  box,
                  n === page
                    ? "bg-brand border-brand text-white"
                    : "border-border text-navy bg-white hover:bg-slate-50",
                )}
              >
                {n}
              </Link>
            </span>
          ))}
          <Link
            href={hrefFor(page + 1)}
            aria-label="Page suivante"
            aria-disabled={page === pages}
            className={cn(
              box,
              "border-border text-navy bg-white",
              page === pages && "pointer-events-none opacity-40",
            )}
          >
            <ChevronRight className="size-4" aria-hidden />
          </Link>
        </nav>
      )}
    </div>
  );
}
