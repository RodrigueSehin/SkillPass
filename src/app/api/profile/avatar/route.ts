import { NextResponse, type NextRequest } from "next/server";
import { withUser } from "@/lib/api/handler";
import { AVATAR_MAX_BYTES } from "@/lib/avatars";
import { rateLimit } from "@/lib/rate-limit";
import { UploadError } from "@/lib/storage/uploads";
import { getProfileAvatarService } from "@/services/container";

/** multipart/form-data with a single `file` field (PNG, JPG or WebP, 2 Mo maximum): the person's own photo. */
export const POST = withUser(async (user, request: NextRequest) => {
  rateLimit(`avatar:${user.id}`, 10, 60_000);
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > AVATAR_MAX_BYTES + 64 * 1024) throw new UploadError("Photo trop volumineuse (2 Mo maximum)");
  const raw = (await request.formData()).get("file");
  if (!(raw instanceof File) || raw.size === 0) throw new UploadError("Aucun fichier reçu");
  if (raw.size > AVATAR_MAX_BYTES) throw new UploadError("Photo trop volumineuse (2 Mo maximum)");
  await getProfileAvatarService().upload(user.id, {
    name: raw.name,
    type: raw.type,
    size: raw.size,
    bytes: new Uint8Array(await raw.arrayBuffer()),
  });
  return NextResponse.json({ ok: true }, { status: 201 });
});

/** Picks one of the SkillPass avatars: `{ "preset": "orbit" }`. */
export const PUT = withUser(async (user, request: NextRequest) => {
  rateLimit(`avatar:${user.id}`, 30, 60_000);
  const body = (await request.json().catch(() => null)) as { preset?: unknown } | null;
  await getProfileAvatarService().choosePreset(user.id, typeof body?.preset === "string" ? body.preset : "");
  return NextResponse.json({ ok: true });
});

export const DELETE = withUser(async (user) => {
  await getProfileAvatarService().remove(user.id);
  return NextResponse.json({ ok: true });
});
