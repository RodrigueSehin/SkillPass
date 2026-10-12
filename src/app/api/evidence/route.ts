import { NextResponse, type NextRequest } from "next/server";
import { withUser } from "@/lib/api/handler";
import { rateLimit } from "@/lib/rate-limit";
import { readEvidenceForm } from "@/lib/storage/evidence-form";
import { createEvidenceSchema, listEvidenceQuerySchema } from "@/schemas/evidence";
import { getEvidenceService } from "@/services/container";

export const GET = withUser(async (user, request: NextRequest) => {
  const { skillId } = listEvidenceQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
  return NextResponse.json({ items: await getEvidenceService().list(user.id, skillId) });
});

/** multipart/form-data: `data` (JSON of the wizard) + up to 5 `files`. */
export const POST = withUser(async (user, request: NextRequest) => {
  rateLimit(`evidence:${user.id}`, 20, 60_000);
  const { json, files } = await readEvidenceForm(request);
  const input = createEvidenceSchema.parse(json);
  return NextResponse.json(await getEvidenceService().add(user.id, input, files), { status: 201 });
});
