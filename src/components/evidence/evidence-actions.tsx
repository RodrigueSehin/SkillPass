"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

interface Props {
  id: string;
  title: string;
  published: boolean;
}

/** The "⋮" menu of an evidence: publish a draft, delete. */
export function EvidenceActions({ id, title, published }: Props) {
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => !root.current?.contains(e.target as Node) && setMenu(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [menu]);

  async function call(method: "DELETE" | "PATCH") {
    const res = await fetch(`/api/evidence/${id}`, { method }).catch(() => null);
    if (res?.ok) return true;
    const json = (await res?.json().catch(() => null)) as { error?: { message?: string } } | null;
    setError(json?.error?.message ?? "L'opération a échoué. Veuillez réessayer.");
    return false;
  }

  const publish = () =>
    startTransition(async () => {
      setMenu(false);
      if (await call("PATCH")) router.refresh();
    });
  const remove = () =>
    startTransition(async () => {
      if (await call("DELETE")) {
        setConfirming(false);
        router.replace("/dashboard/evidence");
        router.refresh();
      }
    });

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-label={`Actions pour ${title}`}
        aria-haspopup="menu"
        aria-expanded={menu}
        onClick={() => setMenu((v) => !v)}
        className="border-border text-navy flex size-9 items-center justify-center rounded-lg border bg-white hover:bg-slate-50"
      >
        <MoreVertical className="size-4" aria-hidden />
      </button>
      {menu && (
        <div
          role="menu"
          className="border-border shadow-lift absolute right-0 bottom-full z-20 mb-1 w-44 overflow-hidden rounded-xl border bg-white text-sm"
        >
          {!published && (
            <button
              role="menuitem"
              type="button"
              onClick={publish}
              className="text-navy flex w-full items-center gap-2 px-4 py-2.5 text-left hover:bg-blue-50"
            >
              <Send className="size-4" aria-hidden /> Publier
            </button>
          )}
          <button
            role="menuitem"
            type="button"
            onClick={() => {
              setMenu(false);
              setError(undefined);
              setConfirming(true);
            }}
            className="text-danger flex w-full items-center gap-2 px-4 py-2.5 text-left hover:bg-red-50"
          >
            <Trash2 className="size-4" aria-hidden /> Supprimer
          </button>
        </div>
      )}
      {error && !confirming && (
        <p
          role="alert"
          className="text-danger absolute right-0 bottom-full mb-1 w-56 rounded-lg bg-red-50 px-3 py-2 text-xs"
        >
          {error}
        </p>
      )}
      <Modal open={confirming} onClose={() => setConfirming(false)} title="Supprimer cette preuve ?">
        <p className="text-muted text-sm">« {title} » et ses fichiers seront définitivement supprimés.</p>
        {error && (
          <p role="alert" className="text-danger mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm">
            {error}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setConfirming(false)}>
            Annuler
          </Button>
          <Button className="bg-danger hover:bg-red-700" onClick={remove} disabled={pending}>
            {pending ? "Suppression…" : "Supprimer"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
