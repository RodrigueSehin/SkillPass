import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { withUser } from "@/lib/api/handler";
import { rateLimit } from "@/lib/rate-limit";
import { getCvImportService } from "@/services/container";

/** Creates what the person ticked on the review screen: `{ skills, experiences, certifications }`. */
export const POST = withUser(async (user, request: NextRequest) => {
  rateLimit(`cv-import:${user.id}`, 20, 60 * 60_000);
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const list = (v: unknown) => (Array.isArray(v) ? v : []);
  const result = await getCvImportService().importSelection(user.id, {
    skills: list(body?.skills),
    experiences: list(body?.experiences),
    certifications: list(body?.certifications),
  });
  for (const path of [
    "/dashboard",
    "/dashboard/skills",
    "/dashboard/experiences",
    "/dashboard/certifications",
  ]) {
    revalidatePath(path);
  }
  return NextResponse.json(result);
});
