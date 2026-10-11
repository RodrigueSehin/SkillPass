import type { NextRequest } from "next/server";
import { withUser } from "@/lib/api/handler";
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
