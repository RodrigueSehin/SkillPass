"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Upload } from "lucide-react";
import { AVATAR_MAX_BYTES, AVATAR_PRESETS, type AvatarRef } from "@/lib/avatars";
import { PresetAvatar, ProfileAvatar } from "@/components/ui/profile-avatar";
import { cn } from "@/lib/utils/cn";

const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];

/** Change the profile picture: upload a photo, or pick one of the SkillPass avatars. */
export function AvatarPicker({
  name,
  profileId,
  avatar,
}: {
  name: string;
  profileId: string;
  avatar: AvatarRef | null;
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

  function pickFile(file: File | undefined) {
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) return setError("Format non accepté (PNG, JPG ou WebP).");
    if (file.size > AVATAR_MAX_BYTES) return setError("Photo trop volumineuse (2 Mo maximum).");
    const body = new FormData();
    body.append("file", file);
    startTransition(() => send(() => fetch("/api/profile/avatar", { method: "POST", body })));
    if (input.current) input.current.value = "";
  }

  const choose = (key: string) =>
    startTransition(() =>
      send(() =>
        fetch("/api/profile/avatar", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ preset: key }),
        }),
      ),
    );

  return (
    <div>
      <div className="flex flex-wrap items-center gap-5">
        <ProfileAvatar name={name} avatar={avatar} profileId={profileId} className="size-24 text-3xl" />
        <div>
          <div className="flex flex-wrap gap-2">
            <input
              ref={input}
              type="file"
              accept={ACCEPTED.join(",")}
              className="sr-only"
              aria-label="Choisir une photo"
              onChange={(e) => pickFile(e.target.files?.[0])}
            />
            <button
              type="button"
              disabled={pending}
              onClick={() => input.current?.click()}
              className="border-brand/40 text-brand flex h-10 items-center gap-2 rounded-xl border bg-white px-4 text-sm font-semibold hover:bg-blue-50 disabled:opacity-50"
            >
              <Upload className="size-4" aria-hidden />{" "}
              {avatar?.kind === "upload" ? "Changer la photo" : "Importer une photo"}
            </button>
            {avatar && (
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(() => send(() => fetch("/api/profile/avatar", { method: "DELETE" })))
                }
                className="flex h-10 items-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 className="size-4" aria-hidden /> Supprimer
              </button>
            )}
          </div>
          <p className="text-muted mt-2 text-xs">PNG, JPG ou WebP, 2 Mo maximum.</p>
        </div>
      </div>

      <fieldset className="mt-5">
        <legend className="text-navy text-sm font-semibold">Ou choisissez un avatar SkillPass</legend>
        <ul className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-6">
          {AVATAR_PRESETS.map((preset) => {
            const current = avatar?.kind === "preset" && avatar.key === preset.key;
            return (
              <li key={preset.key}>
                <button
                  type="button"
                  disabled={pending}
                  aria-pressed={current}
                  aria-label={`Avatar ${preset.label}`}
                  title={preset.label}
                  onClick={() => choose(preset.key)}
                  className={cn(
                    "block size-14 overflow-hidden rounded-full ring-offset-2 transition disabled:opacity-60",
                    current ? "ring-brand ring-2" : "hover:ring-2 hover:ring-slate-300",
                  )}
                >
                  <PresetAvatar presetKey={preset.key} />
                </button>
              </li>
            );
          })}
        </ul>
      </fieldset>

      {error && (
        <p role="alert" className="text-danger mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
