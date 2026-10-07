"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Upload } from "lucide-react";
import { OrgLogo } from "./org-logo";

const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];
const MAX_BYTES = 2 * 1024 * 1024;

/** Logo and identity card: change or remove the logo of the organization. */
export function LogoUploader({
  name,
  version,
  canEdit,
}: {
  name: string;
  version: string | null;
  canEdit: boolean;
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  async function send(request: () => Promise<Response>) {
    setError(undefined);
    const res = await request();
    if (!res.ok) {
      const json = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
      setError(json?.error?.message ?? "L'opération a échoué.");
    }
    router.refresh();
  }

  function pick(file: File | undefined) {
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) return setError("Format non accepté (PNG, JPG ou WebP).");
    if (file.size > MAX_BYTES) return setError("Logo trop volumineux (2 Mo maximum).");
    const body = new FormData();
    body.append("file", file);
    startTransition(() => send(() => fetch("/api/business/logo", { method: "POST", body })));
  }

  return (
    <div>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <OrgLogo name={name} version={version} className="size-24 text-2xl" />
        {canEdit && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => input.current?.click()}
              className="border-brand/40 text-brand flex h-10 items-center gap-2 rounded-xl border bg-white px-4 text-sm font-semibold hover:bg-blue-50 disabled:opacity-50"
            >
              <Upload className="size-4" aria-hidden /> {pending ? "Envoi…" : "Changer le logo"}
            </button>
            {version && (
              <button
                type="button"
                aria-label="Supprimer le logo"
                disabled={pending}
                onClick={() =>
                  startTransition(() => send(() => fetch("/api/business/logo", { method: "DELETE" })))
                }
                className="flex size-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50"
              >
                <Trash2 className="size-4" />
              </button>
            )}
            <input
              ref={input}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              aria-label="Logo de l'organisation"
              className="sr-only"
              onChange={(e) => {
                pick(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </div>
        )}
      </div>
      <p className="text-muted mt-3 text-xs">Formats acceptés : PNG, JPG ou WebP (max 2 Mo).</p>
      {error && (
        <p role="alert" className="text-danger mt-2 text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
