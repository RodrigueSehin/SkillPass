import type { NextRequest } from "next/server";
import { withUser } from "@/lib/api/handler";
import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { readEvidenceForm } from "@/lib/storage/evidence-form";
import { updateEvidenceSchema } from "@/schemas/evidence";
import { getEvidenceService } from "@/services/container";

export const DELETE = withUser(
  async (user, _request: NextRequest, ctx: RouteContext<"/api/evidence/[id]">) => {
    const { id } = await ctx.params;
    await getEvidenceService().remove(user.id, id);
    return new Response(null, { status: 204 });
  },
);

/** Publishes a draft. */
export const PATCH = withUser(
  async (user, _request: NextRequest, ctx: RouteContext<"/api/evidence/[id]">) => {
    const { id } = await ctx.params;
    await getEvidenceService().publish(user.id, id);
    return new Response(null, { status: 204 });
  },
);

/** Edits an evidence: same multipart body as the creation, plus `keepFileIds` in `data`. */
export const PUT = withUser(async (user, request: NextRequest, ctx: RouteContext<"/api/evidence/[id]">) => {
  rateLimit(`evidence:${user.id}`, 20, 60_000);
  const { id } = await ctx.params;
  const { json, files } = await readEvidenceForm(request);
  const input = updateEvidenceSchema.parse(json);
  return NextResponse.json(await getEvidenceService().update(user.id, id, input, files));
});
