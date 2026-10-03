import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { withUser } from "@/lib/api/handler";
import { getRecommendationService } from "@/services/container";

const moderationSchema = z.object({ decision: z.enum(["APPROVED", "DECLINED"]) });

export const PATCH = withUser(
  async (user, request: NextRequest, ctx: RouteContext<"/api/recommendations/[id]">) => {
    const { id } = await ctx.params;
    const { decision } = moderationSchema.parse(await request.json());
    return NextResponse.json(await getRecommendationService().moderate(user.id, id, decision));
  },
);

export const DELETE = withUser(
  async (user, _request: NextRequest, ctx: RouteContext<"/api/recommendations/[id]">) => {
    const { id } = await ctx.params;
    await getRecommendationService().remove(user.id, id);
    return new Response(null, { status: 204 });
  },
);
